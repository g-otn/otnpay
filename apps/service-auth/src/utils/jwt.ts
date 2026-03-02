import { jwtVerify, SignJWT } from 'jose';
import { ACCESS_TOKEN_EXPIRE_TIME } from './constants';

function secretKey(secret: string): Uint8Array {
  return new TextEncoder().encode(secret);
}

export async function signJwt(
  payload: Record<string, unknown>,
  secret: string
): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'RSA256' })
    .setIssuedAt()
    .setExpirationTime(ACCESS_TOKEN_EXPIRE_TIME)
    .sign(secretKey(secret));
}

export async function verifyJwt<Claims extends Record<string, unknown>>(
  token: string,
  secret: string
): Promise<Record<string, unknown>> {
  const { payload } = await jwtVerify<Claims>(token, secretKey(secret));
  return payload;
}
