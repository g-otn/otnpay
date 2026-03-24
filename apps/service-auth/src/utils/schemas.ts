import { passwordSchema } from '@otnpay/schemas';
import * as v from 'valibot';

/** POST /auth/login */
export const loginRequestSchema = v.object({
  email: v.pipe(v.string(), v.email()),
  password: v.pipe(v.string(), v.minLength(1)),
});

export const loginResponseSchema = v.object({
  access_token: v.string(),
  refresh_token: v.string(),
});

/** POST /auth/signup */
export const signupRequestSchema = v.object({
  email: v.pipe(v.string(), v.email()),
  ownerName: v.pipe(v.string(), v.trim(), v.minLength(2), v.maxLength(100)),
  password: passwordSchema,
});

/** POST /auth/logout */
export const logoutRequestSchema = v.object({
  refreshToken: v.string(),
});

/** POST /auth/refresh */
export const refreshRequestSchema = v.object({
  refreshToken: v.pipe(v.string(), v.minLength(1), v.maxLength(50)),
});

export const refreshResponseSchema = loginResponseSchema;

export type LoginRequest = v.InferOutput<typeof loginRequestSchema>;
export type LoginResponse = v.InferOutput<typeof loginResponseSchema>;
export type LogoutRequest = v.InferOutput<typeof logoutRequestSchema>;
export type RefreshRequest = v.InferOutput<typeof refreshRequestSchema>;
export type RefreshResponse = v.InferOutput<typeof refreshResponseSchema>;
export type SignupRequest = v.InferOutput<typeof signupRequestSchema>;
