import jwt, { type JwtPayload, type SignOptions, type VerifyOptions } from 'jsonwebtoken';

export const JWT_ALGORITHM = 'HS256';
export const JWT_ISSUER = 'auth-service';
export const JWT_AUDIENCE = 'business-service';
export const JWT_EXPIRES_IN: string = process.env.JWT_EXPIRES_IN ?? '1h';

const secret = process.env.JWT_SECRET;

if (!secret || Buffer.byteLength(secret, 'utf8') < 32) {
  throw new Error('JWT_SECRET must be configured with at least 32 bytes');
}

const jwtSecret: string = secret;

const signOptions: SignOptions = {
  algorithm: JWT_ALGORITHM,
  expiresIn: JWT_EXPIRES_IN as SignOptions['expiresIn'],
  issuer: JWT_ISSUER,
  audience: JWT_AUDIENCE,
};

const verifyOptions: VerifyOptions = {
  algorithms: [JWT_ALGORITHM],
  issuer: JWT_ISSUER,
  audience: JWT_AUDIENCE,
};

export function signAccessToken(payload: Record<string, unknown>): string {
  return jwt.sign(payload, jwtSecret, signOptions);
}

export function verifyAccessToken(token: string): JwtPayload {
  const payload = jwt.verify(token, jwtSecret, verifyOptions);

  if (typeof payload === 'string') {
    throw new Error('Invalid JWT payload');
  }

  return payload;
}
