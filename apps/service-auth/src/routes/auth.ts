import { Redis } from '@upstash/redis/cloudflare';
import { eq } from 'drizzle-orm';
import { Hono } from 'hono';
import { z } from 'zod';
import { createDb } from '../db';
import { user } from '../db/schema';
import { signJwt, verifyJwt } from '../utils/jwt';
import { verifyPassword } from '../utils/password';

const REFRESH_TTL = 7 * 24 * 3600; // 7 days

const loginSchema = z.object({
  owner_name: z.string().min(1),
  password: z.string().min(1),
});

const auth = new Hono<{ Bindings: Cloudflare.Env }>();

auth.post('/login', async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: 'Invalid request body' }, 400);
  }

  const db = createDb(c.env.AUTH_SERVICE_DB_URL);
  const [account] = await db
    .select()
    .from(user)
    .where(eq(user.owner_name, parsed.data.owner_name))
    .limit(1);

  if (
    !account ||
    !(await verifyPassword(account.password, parsed.data.password))
  ) {
    return c.json({ error: 'Invalid credentials' }, 401);
  }

  const jwtPayload = {
    sub: account.account_id,
    owner_name: account.owner_name,
  };
  const accessToken = await signJwt(jwtPayload, c.env.AUTH_SERVICE_JWT_SECRET);
  const refreshToken = await signJwt(
    { sub: account.account_id },
    c.env.AUTH_SERVICE_JWT_SECRET
  );

  const redis = new Redis({
    url: c.env.AUTH_SERVICE_REDIS_URL,
    token: c.env.AUTH_SERVICE_REDIS_TOKEN,
  });
  await redis.set(
    `refresh:${account.account_id}:${refreshToken.slice(-16)}`,
    refreshToken,
    { ex: REFRESH_TTL }
  );

  return c.json({ access_token: accessToken, refresh_token: refreshToken });
});

auth.post('/logout', async (c) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ error: 'Missing token' }, 401);
  }
  const refreshToken = authHeader.slice(7);

  let payload: Record<string, unknown>;
  try {
    payload = await verifyJwt(refreshToken, c.env.AUTH_SERVICE_JWT_SECRET);
  } catch {
    return c.json({ error: 'Invalid token' }, 401);
  }

  const redis = new Redis({
    url: c.env.AUTH_SERVICE_REDIS_URL,
    token: c.env.AUTH_SERVICE_REDIS_TOKEN,
  });
  await redis.del(`refresh:${payload.sub}:${refreshToken.slice(-16)}`);

  return c.json({ message: 'Logged out' });
});

auth.post('/refresh', async (c) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ error: 'Missing token' }, 401);
  }
  const refreshToken = authHeader.slice(7);

  let payload: Record<string, unknown>;
  try {
    payload = await verifyJwt(refreshToken, c.env.AUTH_SERVICE_JWT_SECRET);
  } catch {
    return c.json({ error: 'Invalid or expired token' }, 401);
  }

  const redis = new Redis({
    url: c.env.AUTH_SERVICE_REDIS_URL,
    token: c.env.AUTH_SERVICE_REDIS_TOKEN,
  });
  const stored = await redis.get(
    `refresh:${payload.sub}:${refreshToken.slice(-16)}`
  );
  if (stored !== refreshToken) {
    return c.json({ error: 'Token revoked' }, 401);
  }

  const db = createDb(c.env.AUTH_SERVICE_DB_URL);
  const [account] = await db
    .select({ account_id: user.account_id, owner_name: user.owner_name })
    .from(user)
    .where(eq(user.account_id, payload.sub as number))
    .limit(1);

  if (!account) {
    return c.json({ error: 'Account not found' }, 401);
  }

  const newAccessToken = await signJwt(
    { sub: account.account_id, owner_name: account.owner_name },
    c.env.AUTH_SERVICE_JWT_SECRET
  );

  return c.json({ access_token: newAccessToken });
});

export { auth };
