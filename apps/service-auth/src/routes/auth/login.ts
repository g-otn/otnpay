import { Redis } from '@upstash/redis/cloudflare';
import { contentJson, OpenAPIRoute } from 'chanfana';
import { eq } from 'drizzle-orm';
import { Context } from 'hono';
import { z } from 'zod';
import { getDB } from '~/db';
import { user } from '~/db/schema';
import {
  getDBAppName,
  REFRESH_TOKEN_REDIS_TTL,
  RouteTag,
} from '~/utils/constants';
import { generateAccessToken } from '~/utils/jwt';
import { verifyPassword } from '~/utils/password';
import { generateRefreshToken } from '~/utils/refreshToken';
import { badRequestResponse, unauthorizedResponse } from '~/routes/schemas';

export class AuthLogin extends OpenAPIRoute {
  schema = {
    tags: [RouteTag.Auth],
    summary: 'Login with email and password',
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
      ...unauthorizedResponse,
    },
  };

  async handle(c: Context<{ Bindings: Cloudflare.Env }>) {
    const data = await this.getValidatedData<typeof this.schema>();
    const { email, password } = data.body;

    const db = getDB(
      c.env.AUTH_SERVICE_DB_URL,
      getDBAppName(c.get('requestId'), c.env.CF_VERSION_METADATA?.tag)
    );
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
      url: c.env.AUTH_SERVICE_REDIS_URL,
      token: c.env.AUTH_SERVICE_REDIS_TOKEN,
    });
    await redis.set(`refresh:${refreshToken}`, account.account_id, {
      ex: REFRESH_TOKEN_REDIS_TTL,
    });

    return c.json({ access_token: accessToken, refresh_token: refreshToken });
  }
}
