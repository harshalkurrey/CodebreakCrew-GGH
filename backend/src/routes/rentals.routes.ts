import { Router, Request, Response, NextFunction } from 'express';
import { rentalsController } from '../controllers/rentals.controller';
import { verifyAuth } from '../middleware/auth.middleware';
import {
  validateBody,
  createRentalSchema,
  updateRentalStatusSchema,
} from '../middleware/validate.middleware';

const router = Router();

// All rental operations require authentication
router.post(
  '/',
  verifyAuth,
  validateBody(createRentalSchema),
  (req: Request, res: Response, next: NextFunction) => rentalsController.createRental(req, res, next)
);

router.get(
  '/my',
  verifyAuth,
  (req: Request, res: Response, next: NextFunction) => rentalsController.getUserRentals(req, res, next)
);

router.patch(
  '/:id/status',
  verifyAuth,
  validateBody(updateRentalStatusSchema),
  (req: Request, res: Response, next: NextFunction) => rentalsController.updateRentalStatus(req, res, next)
);

router.patch(
  '/:id/return',
  verifyAuth,
  (req: Request, res: Response, next: NextFunction) => rentalsController.confirmReturn(req, res, next)
);

export default router;
