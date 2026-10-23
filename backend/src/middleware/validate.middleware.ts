import { Request, Response, NextFunction } from 'express';
import { z, ZodError } from 'zod';
import { sendError } from '../utils/apiResponse';
import { VALID_CATEGORIES, VALID_PRICING_MODELS } from '../types/item.types';
import { isValidDateString } from '../utils/dateUtils';

const dateStringSchema = z
  .string()
  .refine(isValidDateString, { message: 'Must be a valid date in YYYY-MM-DD format' });

export const createItemSchema = z
  .object({
    title: z.string().min(5, 'Title must be at least 5 characters').max(100),
    category: z.enum(VALID_CATEGORIES as [string, ...string[]]),
    description: z.string().min(10, 'Description must be at least 10 characters').max(1500),
    photoURLs: z.array(z.string().url('Must be a valid URL')).min(1, 'At least 1 photo URL is required'),
    pricingModel: z.enum(VALID_PRICING_MODELS as [string, ...string[]]),
    rentalPrice: z.number().positive('Rental price must be greater than zero'),
    availableFrom: dateStringSchema,
    availableTo: dateStringSchema,
    pickupLocation: z.string().min(3, 'Pickup location must be at least 3 characters').max(200),
  })
  .refine((data) => data.availableTo >= data.availableFrom, {
    message: 'availableTo must be on or after availableFrom',
    path: ['availableTo'],
  });

export const updateItemSchema = z
  .object({
    title: z.string().min(5).max(100).optional(),
    category: z.enum(VALID_CATEGORIES as [string, ...string[]]).optional(),
    description: z.string().min(10).max(1500).optional(),
    photoURLs: z.array(z.string().url()).min(1).optional(),
    pricingModel: z.enum(VALID_PRICING_MODELS as [string, ...string[]]).optional(),
    rentalPrice: z.number().positive().optional(),
    availableFrom: dateStringSchema.optional(),
    availableTo: dateStringSchema.optional(),
    pickupLocation: z.string().min(3).max(200).optional(),
    isAvailable: z.boolean().optional(),
  })
  .refine(
    (data) => {
      if (data.availableFrom && data.availableTo) {
        return data.availableTo >= data.availableFrom;
      }
      return true;
    },
    {
      message: 'availableTo must be on or after availableFrom',
      path: ['availableTo'],
    }
  );

export const createRentalSchema = z
  .object({
    itemId: z.string().min(1, 'itemId is required'),
    startDate: dateStringSchema,
    endDate: dateStringSchema,
  })
  .refine((data) => data.endDate >= data.startDate, {
    message: 'endDate must be on or after startDate',
    path: ['endDate'],
  });

export const updateRentalStatusSchema = z.object({
  status: z.enum(['approved', 'rejected', 'cancelled']),
});

export const aiRecommendationsSchema = z.object({
  query: z.string().min(5, 'Query must be at least 5 characters').max(300),
  maxBudget: z.number().positive().optional(),
  durationDays: z.number().int().positive().optional(),
});

export const aiDescriptionSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(100),
  rawDetails: z.string().min(5, 'Raw details must be at least 5 characters').max(500),
  intendedPrice: z.number().positive().optional(),
});

export function validateBody<T>(schema: z.ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const firstError = error.issues[0];
        const message = firstError ? `${firstError.path.join('.') || 'body'}: ${firstError.message}` : 'Invalid request payload';
        sendError(res, 'VALIDATION_ERROR', message, 400);
      } else {
        sendError(res, 'VALIDATION_ERROR', 'Invalid request payload', 400);
      }
    }
  };
}
