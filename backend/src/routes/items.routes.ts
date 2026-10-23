import { Router, Request, Response, NextFunction } from 'express';
import { itemsController } from '../controllers/items.controller';
import { verifyAuth } from '../middleware/auth.middleware';
import { validateBody, createItemSchema, updateItemSchema } from '../middleware/validate.middleware';

const router = Router();

// Public routes
router.get('/', (req: Request, res: Response, next: NextFunction) => itemsController.getItems(req, res, next));
router.get('/:id', (req: Request, res: Response, next: NextFunction) => itemsController.getItemById(req, res, next));

// Protected routes (Authentication required)
router.post(
  '/',
  verifyAuth,
  validateBody(createItemSchema),
  (req: Request, res: Response, next: NextFunction) => itemsController.createItem(req, res, next)
);

router.patch(
  '/:id',
  verifyAuth,
  validateBody(updateItemSchema),
  (req: Request, res: Response, next: NextFunction) => itemsController.updateItem(req, res, next)
);

export default router;
