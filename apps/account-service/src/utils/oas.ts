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
  400: { description: 'Validation error' },
};

export const unauthorizedResponse = {
  401: { description: 'Unauthorized' },
};

export const notFoundResponse = {
  404: { description: 'Not found' },
};
