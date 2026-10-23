import { Router } from 'express';
import { itemsController } from '../controllers/items.controller';
import { verifyAuth } from '../middleware/auth.middleware';
import { validateBody, createItemSchema, updateItemSchema } from '../middleware/validate.middleware';

const router = Router();

// Public routes
router.get('/', (req, res, next) => itemsController.getItems(req, res, next));
router.get('/:id', (req, res, next) => itemsController.getItemById(req, res, next));

// Protected routes (Authentication required)
router.post(
  '/',
  verifyAuth,
  validateBody(createItemSchema),
  (req, res, next) => itemsController.createItem(req, res, next)
);

router.patch(
  '/:id',
  verifyAuth,
  validateBody(updateItemSchema),
  (req, res, next) => itemsController.updateItem(req, res, next)
);

export default router;
