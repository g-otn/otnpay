import { Redis } from '@upstash/redis/cloudflare';
import { contentJson, OpenAPIRoute, ResponseConfig } from 'chanfana';
import { eq } from 'drizzle-orm';
import { Context } from 'hono';
import { z } from 'zod';

import { getDB } from '~/db';
import { user } from '~/db/schema';
import { REFRESH_TOKEN_REDIS_TTL, RouteTag } from '~/utils/constants';
import { generateAccessToken } from '~/utils/jwt';
import { hashPassword, verifyPassword } from '~/utils/password';
import { generateRefreshToken } from '~/utils/refreshToken';

const ErrorSchema = z.object({ error: z.string() });

const ZodErrorSchema = z.object({
  issues: z.array(
    z.object({
      code: z.string(),
      message: z.string(),
      path: z.array(z.union([z.string(), z.number()])),
    })
  ),
});

const badRequestResponse = {
  '400': { description: 'Validation error', ...contentJson(ZodErrorSchema) },
} satisfies Record<string, ResponseConfig>;

const commonAuthenticatedEndpointResponses = {
  '401': { description: 'Unauthorized', ...contentJson(ErrorSchema) },
  '403': { description: 'Forbidden', ...contentJson(ErrorSchema) },
} satisfies Record<string, ResponseConfig>;

export class AuthLogin extends OpenAPIRoute {
  schema = {
    request: {
      body: contentJson(
        z.object({
          email: z.email(),
          password: z.string().min(1),
        })
      ),
    },
    responses: {
      '200': {
        description: 'Access and refresh tokens',
        ...contentJson(
          z.object({ access_token: z.string(), refresh_token: z.string() })
        ),
      },
      ...badRequestResponse,
      ...commonAuthenticatedEndpointResponses,
    },
    summary: 'Login with email and password',
    tags: [RouteTag.Auth],
  };

  async handle(c: Context<{ Bindings: Cloudflare.Env }>) {
    const data = await this.getValidatedData<typeof this.schema>();
    const { email, password } = data.body;

    const db = getDB(c.env.AUTH_SERVICE_DB_URL);
    const [account] = await db
      .select()
      .from(user)
      .where(eq(user.email, email))
      .limit(1);

    if (!account || !(await verifyPassword(account.password, password))) {
      return c.json({ error: 'Invalid credentials' }, 401);
    }

    const accessToken = await generateAccessToken(
      account,
      c.env.AUTH_SERVICE_JWT_SECRET
    );
    const refreshToken = generateRefreshToken();

    const redis = new Redis({
      token: c.env.AUTH_SERVICE_REDIS_TOKEN,
      url: c.env.AUTH_SERVICE_REDIS_URL,
    });
    await redis.set(`refresh:${refreshToken}`, account.account_id, {
      ex: REFRESH_TOKEN_REDIS_TTL,
    });

    return c.json({ access_token: accessToken, refresh_token: refreshToken });
  }
}

export class AuthLogout extends OpenAPIRoute {
  schema = {
    responses: {
      '200': {
        description: 'Logged out',
      },
      ...commonAuthenticatedEndpointResponses,
    },
    summary: 'Logout and revoke refresh token',
    tags: [RouteTag.Auth],
  };

  async handle(c: Context<{ Bindings: Cloudflare.Env }>) {
    const authHeader = c.req.header('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return c.json({ error: 'Missing token' }, 401);
    }
    const refreshToken = authHeader.slice(7);

    const redis = new Redis({
      token: c.env.AUTH_SERVICE_REDIS_TOKEN,
      url: c.env.AUTH_SERVICE_REDIS_URL,
    });
    await redis.del(`refresh:${refreshToken}`);

    return c.json({ message: 'Logged out' });
  }
}

export class AuthRefresh extends OpenAPIRoute {
  schema = {
    responses: {
      '200': {
        description: 'New access and refresh tokens',
        ...contentJson(
          z.object({ access_token: z.string(), refresh_token: z.string() })
        ),
      },
      ...commonAuthenticatedEndpointResponses,
    },
    summary: 'Exchange refresh token for new access and refresh tokens',
    tags: [RouteTag.Auth],
  };

  async handle(c: Context<{ Bindings: Cloudflare.Env }>) {
    const authHeader = c.req.header('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return c.json({ error: 'Missing token' }, 401);
    }
    const refreshToken = authHeader.slice(7);

    const redis = new Redis({
      token: c.env.AUTH_SERVICE_REDIS_TOKEN,
      url: c.env.AUTH_SERVICE_REDIS_URL,
    });
    const [accountId] = await Promise.all([
      redis.get<number>(`refresh:${refreshToken}`),
      redis.del(`refresh:${refreshToken}`),
    ]);
    if (!accountId) {
      return c.json({ error: 'Token revoked' }, 401);
    }

    const db = getDB(c.env.AUTH_SERVICE_DB_URL);
    const [account] = await db
      .select({ account_id: user.account_id, owner_name: user.owner_name })
      .from(user)
      .where(eq(user.account_id, accountId))
      .limit(1);

    if (!account) {
      return c.json({ error: 'Account not found' }, 401);
    }

    const newRefreshToken = generateRefreshToken();
    const [newAccessToken] = await Promise.all([
      generateAccessToken(account, c.env.AUTH_SERVICE_JWT_SECRET),
      redis.set(`refresh:${newRefreshToken}`, account.account_id, {
        ex: REFRESH_TOKEN_REDIS_TTL,
      }),
    ]);

    return c.json({
      access_token: newAccessToken,
      refresh_token: newRefreshToken,
    });
  }
}

export class AuthSignup extends OpenAPIRoute {
  schema = {
    request: {
      body: contentJson(
        z.object({
          email: z.email(),
          owner_name: z.string().min(1),
          password: z.string().min(8),
        })
      ),
    },
    responses: {
      '201': {
        description: 'Account created',
      },
      '409': {
        description: 'Email already taken',
        ...contentJson(ErrorSchema),
      },
      ...badRequestResponse,
    },
    summary: 'Register a new account',
    tags: [RouteTag.Auth],
  };

  async handle(c: Context<{ Bindings: Cloudflare.Env }>) {
    const data = await this.getValidatedData<typeof this.schema>();
    const { email, owner_name, password } = data.body;

    const db = getDB(c.env.AUTH_SERVICE_DB_URL);

    let account: typeof user.$inferSelect;
    try {
      const hashed = await hashPassword(password);
      [account] = await db
        .insert(user)
        .values({ email, owner_name, password: hashed })
        .returning();
    } catch (err) {
      const isUniqueViolation =
        err instanceof Error && err.message.includes('23505');
      if (isUniqueViolation) {
        return c.json({ error: 'Email or owner name already taken' }, 409);
      }
      throw err;
    }

    const accessToken = await generateAccessToken(
      account,
      c.env.AUTH_SERVICE_JWT_SECRET
    );
    const refreshToken = generateRefreshToken();

    const redis = new Redis({
      token: c.env.AUTH_SERVICE_REDIS_TOKEN,
      url: c.env.AUTH_SERVICE_REDIS_URL,
    });
    await redis.set(`refresh:${refreshToken}`, account.account_id, {
      ex: REFRESH_TOKEN_REDIS_TTL,
    });

    return c.json(
      { access_token: accessToken, refresh_token: refreshToken },
      201
    );
  }
}
