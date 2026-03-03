import { importSPKI, JWTPayload, jwtVerify } from 'jose';

const alg = 'RS256';

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
