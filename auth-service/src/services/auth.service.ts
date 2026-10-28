import { prisma } from '../config/prisma.js';
import { compare, hash } from 'bcryptjs';
import jwt, { type SignOptions } from 'jsonwebtoken';
import type {
  RegisterInput,
  LoginInput,
  AuthTokens,
  AuthUser,
  UserRole,
  UpdateUserInput,
} from '../types/index.js';

const JWT_SECRET: string = process.env.JWT_SECRET!;
const JWT_EXPIRES_IN: string = process.env.JWT_EXPIRES_IN ?? '1h';

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET is not configured');
}

interface UserRecord {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
}

function toAuthUser(user: UserRecord): AuthUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role as UserRole,
    isActive: user.isActive,
  };
}

function httpError(message: string, status: number): Error {
  const error = new Error(message);
  (error as { status?: number }).status = status;
  return error;
}

export async function registerUser(input: RegisterInput): Promise<AuthUser> {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) {
    throw httpError('El correo electrónico ya está registrado', 409);
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

  return toAuthUser(user);
}

export async function loginUser(input: LoginInput): Promise<{ user: AuthUser; tokens: AuthTokens }> {
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  if (!user) {
    throw httpError('Credenciales inválidas', 401);
  }

  const isValid = await compare(input.password, user.passwordHash);
  if (!isValid) {
    throw httpError('Credenciales inválidas', 401);
  }

  if (!user.isActive) {
    throw httpError('Usuario desactivado', 403);
  }

  const authUser = toAuthUser(user);

  return { user: authUser, tokens: generateTokens(authUser) };
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
    throw httpError('Token inválido', 401);
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

  return toAuthUser(user);
}

export async function listUsers(): Promise<AuthUser[]> {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  return users.map((user) => toAuthUser(user));
}

export async function updateUser(
  id: string,
  input: UpdateUserInput,
): Promise<AuthUser | null> {
  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) return null;

  if (input.email && input.email !== existing.email) {
    const duplicate = await prisma.user.findUnique({ where: { email: input.email } });
    if (duplicate && duplicate.id !== id) {
      throw httpError('El correo electrónico ya está registrado', 409);
    }
  }

  const user = await prisma.user.update({
    where: { id },
    data: input,
  });

  return toAuthUser(user);
}

export async function updateUserRole(id: string, role: UserRole): Promise<AuthUser | null> {
  return updateUser(id, { role });
}

export async function setUserActive(id: string, isActive: boolean): Promise<AuthUser | null> {
  return updateUser(id, { isActive });
}
