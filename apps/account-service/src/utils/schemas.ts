import * as v from 'valibot';

export const amountSchema = v.pipe(
  v.string(),
  v.regex(
    /^\d{1,13}(\.\d{1,2})?$/,
    'Amount must be a positive number with up to 13 digits and 2 decimal places'
  ),
  v.check((val) => parseFloat(val) > 0, 'Amount must be positive')
);

/** POST /accounts/deposit */
export const depositRequestSchema = v.object({ amount: amountSchema });
export const depositResponseSchema = v.object({ balance: v.string() });

/** POST /accounts/withdraw */
export const withdrawRequestSchema = v.object({ amount: amountSchema });
export const withdrawResponseSchema = v.object({ balance: v.string() });

/** GET /accounts/balance */
export const getBalanceResponseSchema = v.object({
  balance: v.string(),
  user_id: v.number(),
});

export type DepositRequest = v.InferOutput<typeof depositRequestSchema>;
export type DepositResponse = v.InferOutput<typeof depositResponseSchema>;
export type GetBalanceResponse = v.InferOutput<typeof getBalanceResponseSchema>;
export type WithdrawRequest = v.InferOutput<typeof withdrawRequestSchema>;
export type WithdrawResponse = v.InferOutput<typeof withdrawResponseSchema>;
