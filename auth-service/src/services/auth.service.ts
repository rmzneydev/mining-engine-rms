import { prisma } from '../config/prisma.js';
import { compare, hash } from 'bcryptjs';
import jwt, { type SignOptions, verify } from 'jsonwebtoken';
import type { RegisterInput, LoginInput, AuthTokens, AuthUser, UserRole } from '../types/index.js';

const JWT_SECRET: string = process.env.JWT_SECRET!;
const JWT_EXPIRES_IN: string = process.env.JWT_EXPIRES_IN ?? '1h';

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET is not configured');
}

export async function registerUser(input: RegisterInput): Promise<AuthUser> {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) {
    const error = new Error('El correo electrónico ya está registrado');
    (error as { status?: number }).status = 409;
    throw error;
  }

  const passwordHash = await hash(input.password, 10);

  const user = await prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      passwordHash,
      role: input.role ?? 'operator',
    },
  });

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role as UserRole,
  };
}

export async function loginUser(input: LoginInput): Promise<{ user: AuthUser; tokens: AuthTokens }> {
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  if (!user) {
    const error = new Error('Credenciales inválidas');
    (error as { status?: number }).status = 401;
    throw error;
  }

  const isValid = await compare(input.password, user.passwordHash);
  if (!isValid) {
    const error = new Error('Credenciales inválidas');
    (error as { status?: number }).status = 401;
    throw error;
  }

  const authUser: AuthUser = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role as UserRole,
  };

  const tokens = generateTokens(authUser);

  return { user: authUser, tokens };
}

export function generateTokens(user: AuthUser): AuthTokens {
  const payload = {
    sub: user.id,
    email: user.email,
    role: user.role,
    iss: 'auth-service',
    aud: 'business-service',
  };

  const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN } as SignOptions);

  return {
    accessToken,
    expiresIn: String(JWT_EXPIRES_IN),
  };
}

export function verifyToken(token: string): { sub: string; email: string; role: string; iss: string; aud: string } {
  const payload = jwt.verify(token, JWT_SECRET) as Record<string, unknown>;

  if (
    typeof payload.sub !== 'string' ||
    typeof payload.email !== 'string' ||
    typeof payload.role !== 'string' ||
    typeof payload.iss !== 'string' ||
    typeof payload.aud !== 'string'
  ) {
    const error = new Error('Token inválido');
    (error as { status?: number }).status = 401;
    throw error;
  }

  return {
    sub: payload.sub,
    email: payload.email,
    role: payload.role,
    iss: payload.iss,
    aud: payload.aud,
  };
}

export async function getUserById(id: string): Promise<AuthUser | null> {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) return null;

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role as UserRole,
  };
}

export async function listUsers(): Promise<AuthUser[]> {
  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  });

  return users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role as UserRole,
  }));
}

export async function updateUserRole(id: string, role: UserRole): Promise<AuthUser | null> {
  const user = await prisma.user.update({
    where: { id },
    data: { role },
    select: { id: true, name: true, email: true, role: true },
  });

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role as UserRole,
  };
}
