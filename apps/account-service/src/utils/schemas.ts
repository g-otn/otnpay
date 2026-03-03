import { z } from 'zod';

export const amountSchema = z
  .string()
  .regex(
    /^\d{1,13}(\.\d{1,2})?$/,
    'Amount must be a positive number with up to 13 digits and 2 decimal places'
  )
  .refine((v) => parseFloat(v) > 0, 'Amount must be positive');

/** POST /accounts/deposit */
export const depositRequestSchema = z.object({ amount: amountSchema });
export const depositResponseSchema = z.object({ balance: z.string() });

/** POST /accounts/withdraw */
export const withdrawRequestSchema = z.object({ amount: amountSchema });
export const withdrawResponseSchema = z.object({ balance: z.string() });

/** GET /accounts/balance */
export const getBalanceResponseSchema = z.object({
  balance: z.string(),
  user_id: z.number(),
});

export type DepositRequest = z.infer<typeof depositRequestSchema>;
export type DepositResponse = z.infer<typeof depositResponseSchema>;
export type GetBalanceResponse = z.infer<typeof getBalanceResponseSchema>;
export type WithdrawRequest = z.infer<typeof withdrawRequestSchema>;
export type WithdrawResponse = z.infer<typeof withdrawResponseSchema>;
