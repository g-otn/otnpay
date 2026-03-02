import { JWTPayload, jwtVerify, SignJWT } from 'jose';

import { ACCESS_TOKEN_EXPIRE_TIME } from '~/utils/constants';

export async function generateAccessToken(
  {
    account_id,
    owner_name,
  }: {
    account_id: number;
    owner_name: string;
  },
  secret: string
): Promise<string> {
  return signJwt({ name: owner_name, sub: account_id.toString() }, secret);
}

export async function signJwt(
  payload: JWTPayload,
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

function secretKey(secret: string): Uint8Array {
  return new TextEncoder().encode(secret);
}
