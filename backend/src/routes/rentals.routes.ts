import { Router } from 'express';
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
  (req, res, next) => rentalsController.createRental(req, res, next)
);

router.get(
  '/my',
  verifyAuth,
  (req, res, next) => rentalsController.getUserRentals(req, res, next)
);

router.patch(
  '/:id/status',
  verifyAuth,
  validateBody(updateRentalStatusSchema),
  (req, res, next) => rentalsController.updateRentalStatus(req, res, next)
);

router.patch(
  '/:id/return',
  verifyAuth,
  (req, res, next) => rentalsController.confirmReturn(req, res, next)
);

export default router;
