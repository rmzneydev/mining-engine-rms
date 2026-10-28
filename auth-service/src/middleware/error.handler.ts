import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export function errorHandler(
  error: Error & { status?: number },
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  const status = error.status ?? 500;

  if (error instanceof ZodError) {
    res.status(400).json({
      message: 'Validation error',
      errors: error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      })),
    });
    return;
  }

  res.status(status).json({
    message: error.message || 'Internal server error',
  });
}
