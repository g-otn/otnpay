import { z } from 'zod';

export const amountSchema = z
  .string()
  .regex(
    /^\d{1,13}(\.\d{1,2})?$/,
    'Amount must be a positive number with up to 13 digits and 2 decimal places'
  )
  .refine((v) => parseFloat(v) > 0, 'Amount must be positive');
