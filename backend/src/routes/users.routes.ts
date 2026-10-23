import { Router, Request, Response, NextFunction } from 'express';
import { usersController } from '../controllers/users.controller';
import { verifyAuth } from '../middleware/auth.middleware';

const router = Router();

router.post(
  '/sync',
  verifyAuth,
  (req: Request, res: Response, next: NextFunction) => usersController.syncProfile(req, res, next)
);

router.get(
  '/me',
  verifyAuth,
  (req: Request, res: Response, next: NextFunction) => usersController.getMyProfile(req, res, next)
);

router.get(
  '/:uid',
  (req: Request, res: Response, next: NextFunction) => usersController.getPublicProfile(req, res, next)
);

export default router;
