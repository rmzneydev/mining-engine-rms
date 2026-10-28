
import type { NextFunction, Request, Response } from 'express';
import jwt, { type JwtPayload } from 'jsonwebtoken';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

const jwtSecret = process.env.JWT_SECRET;

if (!jwtSecret) {
  throw new Error('JWT_SECRET is not configured');
}

const secret: string = jwtSecret;

export function authenticate(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): void {
  const authorization = req.headers.authorization;

  if (!authorization?.startsWith('Bearer ')) {
    res.status(401).json({ message: 'Authentication token required' });
    return;
  }

  const token = authorization.slice(7);

  try {
    const payload = jwt.verify(token, secret);

    if (
      typeof payload === 'string' ||
      typeof (payload as JwtPayload).sub !== 'string' ||
      typeof (payload as JwtPayload).email !== 'string' ||
      typeof (payload as JwtPayload).role !== 'string'
    ) {
      res.status(401).json({ message: 'Invalid authentication token' });
      return;
    }

    const claims = payload as JwtPayload;

    req.user = {
      id: claims.sub as string,
      email: claims.email as string,
      role: claims.role as string,
    };

    next();
  } catch {
    res.status(401).json({ message: 'Invalid or expired token' });
  }
}
