import { Timestamp } from 'firebase-admin/firestore';

export type ItemCategory =
  | 'Calculators'
  | 'Lab Gear'
  | 'Formal Wear'
  | 'Textbooks & Notes'
  | 'Tech & Electronics'
  | 'Other';

export const VALID_CATEGORIES: ItemCategory[] = [
  'Calculators',
  'Lab Gear',
  'Formal Wear',
  'Textbooks & Notes',
  'Tech & Electronics',
  'Other',
];

export type PricingModel = 'daily' | 'weekly' | 'monthly';

export const VALID_PRICING_MODELS: PricingModel[] = ['daily', 'weekly', 'monthly'];

export interface ItemDocument {
  itemId: string;
  ownerId: string;
  title: string;
  category: ItemCategory;
  description: string;
  photoURLs: string[];
  pricingModel: PricingModel;
  rentalPrice: number;
  availableFrom: string; // YYYY-MM-DD
  availableTo: string;   // YYYY-MM-DD
  pickupLocation: string;
  isAvailable: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface CreateItemDTO {
  title: string;
  category: ItemCategory;
  description: string;
  photoURLs: string[];
  pricingModel: PricingModel;
  rentalPrice: number;
  availableFrom: string;
  availableTo: string;
  pickupLocation: string;
}

export interface UpdateItemDTO {
  title?: string;
  category?: ItemCategory;
  description?: string;
  photoURLs?: string[];
  pricingModel?: PricingModel;
  rentalPrice?: number;
  availableFrom?: string;
  availableTo?: string;
  pickupLocation?: string;
  isAvailable?: boolean;
}

export interface ItemFilterQuery {
  category?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  pricingModel?: string;
  availableFrom?: string;
  availableTo?: string;
  limit?: number;
}
