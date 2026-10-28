import type { NextFunction, Response } from 'express';
import type { AuthenticatedRequest } from './authenticate.js';
import type { UserRole } from '../types/index.js';

export function authorize(...allowedRoles: UserRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ message: 'No autenticado' });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({ message: 'No tiene permisos para realizar esta acción' });
      return;
    }

    next();
  };
}
