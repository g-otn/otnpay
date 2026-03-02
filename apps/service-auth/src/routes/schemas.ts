import { contentJson, ResponseConfig } from 'chanfana';
import { owaspSymbols, passwordStrength } from 'check-password-strength';
import { z } from 'zod';

const allowedPasswordChars = new Set(
  'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789' +
    owaspSymbols
);

export const passwordSchema = z
  .string()
  .min(8, { abort: true })
  .max(40, { abort: true })
  .refine(
    (p) => [...p].every((c) => allowedPasswordChars.has(c)),
    `Password may only contain letters, numbers, and symbols: ${owaspSymbols}`
  )
  .refine(
    (p) => passwordStrength(p, undefined, owaspSymbols).id >= 3,
    'Password must be strong: at least 12 characters containing uppercase, lowercase, numbers and symbols'
  );

export const ErrorSchema = z.object({ error: z.string() });

export const ZodErrorSchema = z.object({
  issues: z.array(
    z.object({
      code: z.string(),
      message: z.string(),
      path: z.array(z.union([z.string(), z.number()])),
    })
  ),
});

export const badRequestResponse = {
  '400': { description: 'Validation error', ...contentJson(ZodErrorSchema) },
} satisfies Record<string, ResponseConfig>;

export const unauthorizedResponse = {
  '401': { description: 'Unauthorized', ...contentJson(ErrorSchema) },
} satisfies Record<string, ResponseConfig>;

export const forbiddenResponse = {
  '403': { description: 'Forbidden', ...contentJson(ErrorSchema) },
} satisfies Record<string, ResponseConfig>;

export const commonAuthenticatedEndpointResponses = {
  ...unauthorizedResponse,
  ...forbiddenResponse,
} satisfies Record<string, ResponseConfig>;
