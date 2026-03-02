import { importPKCS8, JWTPayload, jwtVerify, SignJWT } from 'jose';

import { ACCESS_TOKEN_EXPIRE_TIME } from '~/utils/constants';

export async function generateAccessToken(
  {
    ownerName,
    userId,
  }: {
    ownerName: string;
    userId: number;
  },
  /**
   * PEM-encoded PKCS#8 string
   * RS256 private key
   */
  secret: string
): Promise<string> {
  const privateKey = await importPKCS8(secret, 'RS256');
  return signJwt({ name: ownerName, sub: userId.toString() }, privateKey);
}

export async function signJwt(
  payload: JWTPayload,
  key: CryptoKey
): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'RSA256' })
    .setIssuedAt()
    .setExpirationTime(ACCESS_TOKEN_EXPIRE_TIME)
    .sign(key);
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
