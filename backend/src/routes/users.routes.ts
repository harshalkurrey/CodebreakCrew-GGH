import { Router } from 'express';
import { usersController } from '../controllers/users.controller';
import { verifyAuth } from '../middleware/auth.middleware';

const router = Router();

router.post('/sync', verifyAuth, (req, res, next) => usersController.syncProfile(req, res, next));
router.get('/me', verifyAuth, (req, res, next) => usersController.getMyProfile(req, res, next));
router.get('/:uid', (req, res, next) => usersController.getPublicProfile(req, res, next));

export default router;
