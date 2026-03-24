import { owaspSymbols, passwordStrength } from 'check-password-strength';
import * as v from 'valibot';

const allowedPasswordChars = new Set(
  'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789' +
    owaspSymbols
);

/** Strong password — used by signup on both frontend and backend */
export const passwordSchema = v.pipe(
  v.string(),
  v.minLength(8),
  v.maxLength(40),
  v.check(
    (p) => [...p].every((c) => allowedPasswordChars.has(c)),
    `Password may only contain letters, numbers, and symbols: ${owaspSymbols}`
  ),
  v.check(
    (p) => passwordStrength(p, undefined, owaspSymbols).id >= 2,
    'Password must be strong: at least 12 characters containing uppercase, lowercase, numbers'
  )
);
