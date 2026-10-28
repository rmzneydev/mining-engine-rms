export type UserRole = 'admin' | 'operator';

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
  role?: UserRole;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthTokens {
  accessToken: string;
  expiresIn: string;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}
