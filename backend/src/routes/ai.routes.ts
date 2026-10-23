import { Router, Request, Response, NextFunction } from 'express';
import { aiController } from '../controllers/ai.controller';
import { verifyAuth, optionalAuth } from '../middleware/auth.middleware';
import {
  validateBody,
  aiRecommendationsSchema,
  aiDescriptionSchema,
} from '../middleware/validate.middleware';

const router = Router();

// Recommendations can be accessed publicly or authenticated
router.post(
  '/recommendations',
  optionalAuth,
  validateBody(aiRecommendationsSchema),
  (req: Request, res: Response, next: NextFunction) => aiController.getRecommendations(req, res, next)
);

// Description assistance requires authenticated student
router.post(
  '/description',
  verifyAuth,
  validateBody(aiDescriptionSchema),
  (req: Request, res: Response, next: NextFunction) => aiController.generateDescription(req, res, next)
);

export default router;
