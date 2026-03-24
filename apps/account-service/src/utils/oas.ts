import { type DescribeRouteOptions } from 'hono-openapi';
import { resolver } from 'hono-openapi/valibot';
import * as v from 'valibot';

export enum RouteTag {
  Account = 'Account',
  System = 'System',
}

export const ErrorSchema = v.object({ error: v.string() });

export const ValibotErrorSchema = v.object({
  issues: v.array(
    v.object({
      message: v.string(),
      path: v.optional(
        v.array(v.object({ key: v.union([v.string(), v.number()]) }))
      ),
    })
  ),
});

export const badRequestResponse = {
  400: {
    content: { 'application/json': { schema: resolver(ValibotErrorSchema) } },
    description: 'Validation error',
  },
} satisfies NonNullable<DescribeRouteOptions['responses']>;

export const unauthorizedResponse = {
  401: {
    content: { 'application/json': { schema: resolver(ErrorSchema) } },
    description: 'Unauthorized',
  },
} satisfies NonNullable<DescribeRouteOptions['responses']>;

export const notFoundResponse = {
  404: {
    content: { 'application/json': { schema: resolver(ErrorSchema) } },
    description: 'Not found',
  },
} satisfies NonNullable<DescribeRouteOptions['responses']>;

export const validationHook = (
  result: { issues?: v.BaseIssue<unknown>[]; success: boolean },
  c: { json: (data: unknown, status: number) => Response }
) => {
  if (result.issues) {
    return c.json(
      {
        issues: v.flatten(
          result.issues as [v.BaseIssue<unknown>, ...v.BaseIssue<unknown>[]]
        ),
      },
      400
    );
  }
};
