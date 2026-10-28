import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { registerUser, loginUser, generateTokens } from '../services/auth.service.js';
import type { AuthUser } from '../types/index.js';

const registerSchema = z.object({
  name: z.string().min(2, 'El nombre es requerido'),
  email: z.string().email('Correo inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  role: z.enum(['admin', 'operator']).optional(),
});

const loginSchema = z.object({
  email: z.string().email('Correo inválido'),
  password: z.string().min(1, 'La contraseña es requerida'),
});

export async function register(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const input = registerSchema.parse(req.body);
    const user = await registerUser(input);
    res.status(201).json({ message: 'Usuario registrado', user });
  } catch (error) {
    next(error);
  }
}

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const input = loginSchema.parse(req.body);
    const { user, tokens } = await loginUser(input);
    res.status(200).json({ message: 'Autenticación exitosa', user, tokens });
  } catch (error) {
    next(error);
  }
}

export const me = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = (req as { user?: AuthUser }).user;
    if (!user) {
      res.status(401).json({ message: 'No autenticado' });
      return;
    }
    res.status(200).json({ user });
  } catch (error) {
    next(error);
  }
}

