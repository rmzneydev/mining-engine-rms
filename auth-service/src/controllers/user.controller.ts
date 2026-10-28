import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import {
  getUserById,
  listUsers,
  setUserActive,
  updateUser as updateUserService,
  updateUserRole,
} from '../services/auth.service.js';
import type { AuthenticatedRequest } from '../middleware/authenticate.js';

const idSchema = z.string().uuid('ID de usuario inválido');

const updateRoleSchema = z.object({
  role: z.enum(['admin', 'operator']),
});

const updateUserSchema = z
  .object({
    name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').max(120).optional(),
    email: z
      .string()
      .email('El correo electrónico no tiene un formato válido')
      .max(255)
      .optional(),
    role: z.enum(['admin', 'operator']).optional(),
    isActive: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Debe enviar al menos un campo para actualizar',
  });

function currentUserId(req: Request): string | undefined {
  return (req as AuthenticatedRequest).user?.id;
}

export class UserController {
  public getUsers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const users = await listUsers();
      res.status(200).json({ users });
    } catch (error) {
      next(error);
    }
  };

  public getUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = idSchema.parse((req.params as { id: string }).id);
      const user = await getUserById(id);
      if (!user) {
        res.status(404).json({ message: 'Usuario no encontrado' });
        return;
      }
      res.status(200).json({ user });
    } catch (error) {
      next(error);
    }
  };

  public updateUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = idSchema.parse((req.params as { id: string }).id);
      const input = updateUserSchema.parse(req.body);

      if (currentUserId(req) === id) {
        if (input.isActive === false) {
          res.status(400).json({ message: 'No puede desactivar su propia cuenta' });
          return;
        }
        if (input.role && input.role !== 'admin') {
          res.status(400).json({ message: 'No puede quitarse el rol de administrador' });
          return;
        }
      }

      const user = await updateUserService(id, input);
      if (!user) {
        res.status(404).json({ message: 'Usuario no encontrado' });
        return;
      }
      res.status(200).json({ message: 'Usuario actualizado', user });
    } catch (error) {
      next(error);
    }
  };

  public updateRole = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = idSchema.parse((req.params as { id: string }).id);
      const input = updateRoleSchema.parse(req.body);

      if (currentUserId(req) === id && input.role !== 'admin') {
        res.status(400).json({ message: 'No puede quitarse el rol de administrador' });
        return;
      }

      const user = await updateUserRole(id, input.role);
      if (!user) {
        res.status(404).json({ message: 'Usuario no encontrado' });
        return;
      }
      res.status(200).json({ message: 'Rol actualizado', user });
    } catch (error) {
      next(error);
    }
  };

  public deactivateUser = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const id = idSchema.parse((req.params as { id: string }).id);

      if (currentUserId(req) === id) {
        res.status(400).json({ message: 'No puede desactivar su propia cuenta' });
        return;
      }

      const user = await setUserActive(id, false);
      if (!user) {
        res.status(404).json({ message: 'Usuario no encontrado' });
        return;
      }
      res.status(200).json({ message: 'Usuario desactivado', user });
    } catch (error) {
      next(error);
    }
  };

  public activateUser = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const id = idSchema.parse((req.params as { id: string }).id);
      const user = await setUserActive(id, true);
      if (!user) {
        res.status(404).json({ message: 'Usuario no encontrado' });
        return;
      }
      res.status(200).json({ message: 'Usuario activado', user });
    } catch (error) {
      next(error);
    }
  };
}
