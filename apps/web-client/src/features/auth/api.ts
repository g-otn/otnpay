import { createServerFn } from '@tanstack/react-start';
import { getRequest } from '@tanstack/react-start/server';
import * as z from 'zod';

const loginRequestSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});

export type LoginInput = z.infer<typeof loginRequestSchema>;
export type LoginResponse = { access_token: string; refresh_token: string };

export const loginFn = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) => loginRequestSchema.parse(data))
  .handler(async ({ data }) => {
    // AUTH_SERVICE_URL is set via wrangler vars; fall back for local Vite dev
    const request = getRequest();
    const ctx = (request as { cf?: { env?: { AUTH_SERVICE_URL?: string } } }).cf
      ?.env;
    const authUrl =
      ctx?.AUTH_SERVICE_URL ??
      process.env['AUTH_SERVICE_URL'] ??
      'http://localhost:9010';

    const res = await fetch(`${authUrl}/auth/login`, {
      body: JSON.stringify(data),
      headers: { 'Content-Type': 'application/json' },
      method: 'POST',
    });

    const body = (await res.json()) as Record<string, string>;

    if (!res.ok) {
      throw new Error(body['error'] ?? 'Login failed');
    }

    return body as LoginResponse;
  });
