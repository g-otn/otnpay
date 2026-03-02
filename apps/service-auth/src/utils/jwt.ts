import { importPKCS8, importSPKI, JWTPayload, jwtVerify, SignJWT } from 'jose';

import { ACCESS_TOKEN_EXPIRE_TIME } from '~/utils/constants';

const alg = 'RS256';

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
  const privateKey = await importPKCS8(secret, alg);
  return signJwt(
    { name: ownerName, sub: userId.toString() },
    privateKey,
    ACCESS_TOKEN_EXPIRE_TIME
  );
}

export async function signJwt(
  payload: JWTPayload,
  key: CryptoKey,
  expirationTime: Date | number | string
): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg })
    .setIssuedAt()
    .setExpirationTime(expirationTime)
    .sign(key);
}

export async function verifyJwt<Claims extends Record<string, unknown>>(
  token: string,
  /**
   * PEM-encoded SPKI string
   * RS256 public key
   */
  publicKey: string
): Promise<Claims & JWTPayload> {
  const key = await importSPKI(publicKey.replaceAll('\\n', '\n'), alg);
  const { payload } = await jwtVerify<Claims>(token, key);
  return payload;
}
