export const SERVICE_NAME = 'account-service';

export function getDBAppName(requestId: string, version?: string): string {
  return `${SERVICE_NAME}@${version ?? 'unknown'}/${requestId}`;
}
