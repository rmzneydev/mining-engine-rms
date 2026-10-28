import type { NextFunction, Request, Response } from 'express';
import jwt, { type JwtPayload } from 'jsonwebtoken';
import { prisma } from '../config/prisma.js';
import type { UserRole } from '../types/index.js';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    isActive: boolean;
  };
}

const jwtSecret = process.env.JWT_SECRET;

if (!jwtSecret) {
  throw new Error('JWT_SECRET is not configured');
}

const secret: string = jwtSecret;

export async function authenticate(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const authorization = req.headers.authorization;

  if (!authorization?.startsWith('Bearer ')) {
    res.status(401).json({ message: 'Authentication token required' });
    return;
  }

  const token = authorization.slice(7);

  let payload: JwtPayload;
  try {
    const verified = jwt.verify(token, secret);
    if (typeof verified === 'string') {
      res.status(401).json({ message: 'Invalid authentication token' });
      return;
    }
    payload = verified;
  } catch {
    res.status(401).json({ message: 'Invalid or expired token' });
    return;
  }

  if (typeof payload.sub !== 'string') {
    res.status(401).json({ message: 'Invalid authentication token' });
    return;
  }

  try {
    const user = await prisma.user.findUnique({ where: { id: payload.sub } });

    if (!user || !user.isActive) {
      res.status(401).json({ message: 'Invalid or inactive user' });
      return;
    }

    req.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role as UserRole,
      isActive: user.isActive,
    };

    next();
  } catch (error) {
    next(error);
  }
}
