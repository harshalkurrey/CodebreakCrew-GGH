import { Response } from 'express';

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: {
    code: string;
    message: string;
  };
}

export function sendSuccess<T>(
  res: Response,
  data: T,
  message = 'Operation successful',
  statusCode = 200
): Response {
  const responsePayload: ApiResponse<T> = {
    success: true,
    data,
    message,
  };
  return res.status(statusCode).json(responsePayload);
}

export function sendError(
  res: Response,
  code: string,
  message: string,
  statusCode = 400
): Response {
  const responsePayload: ApiResponse = {
    success: false,
    error: {
      code,
      message,
    },
  };
  return res.status(statusCode).json(responsePayload);
}
