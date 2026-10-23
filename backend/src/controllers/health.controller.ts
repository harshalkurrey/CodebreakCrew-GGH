import { Request, Response } from 'express';
import { sendSuccess } from '../utils/apiResponse';

export function getHealth(_req: Request, res: Response): void {
  const healthData = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  };

  sendSuccess(res, healthData, 'CampusCycle API is fully operational.');
}
