import { owaspSymbols, passwordStrength } from 'check-password-strength';
import { z } from 'zod';

const allowedPasswordChars = new Set(
  'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789' +
    owaspSymbols
);

/** Strong password — used by signup on both frontend and backend */
export const passwordSchema = z
  .string()
  .min(8, { abort: true })
  .max(40, { abort: true })
  .refine(
    (p) => [...p].every((c) => allowedPasswordChars.has(c)),
    `Password may only contain letters, numbers, and symbols: ${owaspSymbols}`
  )
  .refine(
    (p) => passwordStrength(p, undefined, owaspSymbols).id >= 2,
    'Password must be strong: at least 12 characters containing uppercase, lowercase, numbers'
  );
