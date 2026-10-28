import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { listUsers, updateUserRole } from '../services/auth.service.js';
import type { AuthUser } from '../types/index.js';
import { authenticate } from '../middleware/authenticate.js';

const updateRoleSchema = z.object({
  role: z.enum(['admin', 'operator']),
});

export class UserController {
  public getUsers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const users = await listUsers();
      res.status(200).json({ users });
    } catch (error) {
      next(error);
    }
  };

  public updateUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params as { id: string };
      const input = updateRoleSchema.parse(req.body);
      const user = await updateUserRole(id, input.role);
      if (!user) {
        res.status(404).json({ message: 'Usuario no encontrado' });
        return;
      }
      res.status(200).json({ message: 'Usuario actualizado', user });
    } catch (error) {
      next(error);
    }
  };
}

export { authenticate };
export type { AuthUser };
