import { Request, Response, NextFunction } from 'express';
import { itemsService } from '../services/items.service';
import { sendSuccess, sendError } from '../utils/apiResponse';
import { ItemFilterQuery } from '../types/item.types';

export class ItemsController {
  async createItem(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user || !req.user.uid) {
        sendError(res, 'UNAUTHORIZED', 'Authentication is required to create a listing.', 401);
        return;
      }

      const result = await itemsService.createItem(req.user.uid, req.body);
      sendSuccess(res, result, 'Listing published successfully.', 201);
    } catch (error: any) {
      next(error);
    }
  }

  async getItems(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const filters: ItemFilterQuery = {
        category: typeof req.query.category === 'string' ? req.query.category : undefined,
        search: typeof req.query.search === 'string' ? req.query.search : undefined,
        minPrice: req.query.minPrice ? parseFloat(req.query.minPrice as string) : undefined,
        maxPrice: req.query.maxPrice ? parseFloat(req.query.maxPrice as string) : undefined,
        pricingModel: typeof req.query.pricingModel === 'string' ? req.query.pricingModel : undefined,
        availableFrom: typeof req.query.availableFrom === 'string' ? req.query.availableFrom : undefined,
        availableTo: typeof req.query.availableTo === 'string' ? req.query.availableTo : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined,
      };

      const result = await itemsService.getItems(filters);
      sendSuccess(res, result, 'Items fetched successfully.');
    } catch (error: any) {
      next(error);
    }
  }

  async getItemById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const item = await itemsService.getItemById(id);

      if (!item) {
        sendError(res, 'ITEM_NOT_FOUND', 'Item listing not found.', 404);
        return;
      }

      sendSuccess(res, { item }, 'Item details retrieved.');
    } catch (error: any) {
      next(error);
    }
  }

  async updateItem(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user || !req.user.uid) {
        sendError(res, 'UNAUTHORIZED', 'Authentication is required to update a listing.', 401);
        return;
      }

      const { id } = req.params;
      const updated = await itemsService.updateItem(id, req.user.uid, req.body);

      if (!updated) {
        sendError(res, 'ITEM_NOT_FOUND', 'Item listing not found.', 404);
        return;
      }

      sendSuccess(res, updated, 'Listing updated successfully.');
    } catch (error: any) {
      if (error.statusCode === 403 || error.code === 'FORBIDDEN') {
        sendError(res, 'FORBIDDEN', error.message, 403);
        return;
      }
      next(error);
    }
  }
}

export const itemsController = new ItemsController();
