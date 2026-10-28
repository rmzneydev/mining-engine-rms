import type { Request, Response, NextFunction } from 'express';

export function errorHandler(
  error: Error & { status?: number },
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  const status = error.status ?? 500;

  res.status(status).json({
    message: error.message || 'Error interno del servidor',
  });
}
