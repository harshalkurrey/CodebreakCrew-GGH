import { Request, Response, NextFunction } from 'express';
import { geminiService } from '../services/gemini.service';
import { sendSuccess, sendError } from '../utils/apiResponse';

export class AIController {
  async getRecommendations(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { query, maxBudget, durationDays } = req.body;
      const result = await geminiService.getRecommendations(
        query,
        maxBudget ? Number(maxBudget) : undefined,
        durationDays ? Number(durationDays) : 1
      );

      sendSuccess(res, result, 'AI recommendations generated successfully.');
    } catch (error: any) {
      next(error);
    }
  }

  async generateDescription(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user || !req.user.uid) {
        sendError(res, 'UNAUTHORIZED', 'Authentication is required for AI description assistance.', 401);
        return;
      }

      const { title, rawDetails, intendedPrice } = req.body;
      const result = await geminiService.generateDescription(
        title,
        rawDetails,
        intendedPrice ? Number(intendedPrice) : undefined
      );

      sendSuccess(res, result, 'Description drafted successfully.');
    } catch (error: any) {
      next(error);
    }
  }
}

export const aiController = new AIController();
