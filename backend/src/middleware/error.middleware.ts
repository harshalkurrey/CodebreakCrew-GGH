import { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/apiResponse';

export function notFoundHandler(req: Request, res: Response): void {
  sendError(
    res,
    'NOT_FOUND',
    `Cannot ${req.method} ${req.originalUrl}`,
    404
  );
}

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void {
  // Prevent leaking internal stack traces in public error responses
  const message = err.message || 'Internal Server Error';
  sendError(res, 'INTERNAL_SERVER_ERROR', message, 500);
}
