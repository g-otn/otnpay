import { contentJson, ResponseConfig } from 'chanfana';
import { z } from 'zod';

export enum RouteTag {
  Account = 'Account',
  System = 'System',
}

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

export const notFoundResponse = {
  '404': { description: 'Not found', ...contentJson(ErrorSchema) },
} satisfies Record<string, ResponseConfig>;
