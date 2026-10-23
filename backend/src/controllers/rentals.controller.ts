import { Request, Response, NextFunction } from 'express';
import { rentalsService } from '../services/rentals.service';
import { sendSuccess, sendError } from '../utils/apiResponse';

export class RentalsController {
  async createRental(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user || !req.user.uid) {
        sendError(res, 'UNAUTHORIZED', 'Authentication is required to request a rental.', 401);
        return;
      }

      const result = await rentalsService.createRental(req.user.uid, req.body);
      sendSuccess(res, result, 'Rental request submitted to owner for approval.', 201);
    } catch (error: any) {
      if (error.statusCode) {
        sendError(res, error.code || 'BAD_REQUEST', error.message, error.statusCode);
        return;
      }
      next(error);
    }
  }

  async getUserRentals(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user || !req.user.uid) {
        sendError(res, 'UNAUTHORIZED', 'Authentication is required to view your rentals.', 401);
        return;
      }

      const result = await rentalsService.getUserRentals(req.user.uid);
      sendSuccess(res, result, 'User rentals retrieved successfully.');
    } catch (error: any) {
      next(error);
    }
  }

  async updateRentalStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user || !req.user.uid) {
        sendError(res, 'UNAUTHORIZED', 'Authentication is required.', 401);
        return;
      }

      const { id } = req.params;
      const { status } = req.body;

      const result = await rentalsService.updateRentalStatus(id, req.user.uid, status);
      sendSuccess(res, result, `Rental request has been ${status}.`);
    } catch (error: any) {
      if (error.statusCode) {
        sendError(res, error.code || 'BAD_REQUEST', error.message, error.statusCode);
        return;
      }
      next(error);
    }
  }

  async confirmReturn(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user || !req.user.uid) {
        sendError(res, 'UNAUTHORIZED', 'Authentication is required.', 401);
        return;
      }

      const { id } = req.params;
      const result = await rentalsService.confirmReturn(id, req.user.uid);
      sendSuccess(res, result, 'Item return confirmed. Rental closed.');
    } catch (error: any) {
      if (error.statusCode) {
        sendError(res, error.code || 'BAD_REQUEST', error.message, error.statusCode);
        return;
      }
      next(error);
    }
  }
}

export const rentalsController = new RentalsController();
