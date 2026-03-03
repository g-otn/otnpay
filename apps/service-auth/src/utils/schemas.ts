import { passwordSchema } from '@otnpay/schemas';
import { z } from 'zod';

/** POST /auth/login */
export const loginRequestSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});

export const loginResponseSchema = z.object({
  access_token: z.string(),
  refresh_token: z.string(),
});

/** POST /auth/signup */
export const signupRequestSchema = z.object({
  email: z.email(),
  ownerName: z.string().trim().min(2).max(100),
  password: passwordSchema,
});

/** POST /auth/logout */
export const logoutRequestSchema = z.object({
  refreshToken: z.string(),
});

/** POST /auth/refresh */
export const refreshRequestSchema = z.object({
  refreshToken: z.string().min(1).max(50),
});

export const refreshResponseSchema = loginResponseSchema;

export type LoginRequest = z.infer<typeof loginRequestSchema>;
export type LoginResponse = z.infer<typeof loginResponseSchema>;
export type LogoutRequest = z.infer<typeof logoutRequestSchema>;
export type RefreshRequest = z.infer<typeof refreshRequestSchema>;
export type RefreshResponse = z.infer<typeof refreshResponseSchema>;
export type SignupRequest = z.infer<typeof signupRequestSchema>;
