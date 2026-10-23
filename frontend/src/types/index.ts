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

export type RentalStatus =
  | 'pending'
  | 'approved'
  | 'active'
  | 'returned'
  | 'rejected'
  | 'cancelled';

export interface Item {
  itemId: string;
  ownerId: string;
  title: string;
  category: ItemCategory;
  description: string;
  photoURLs: string[];
  pricingModel: PricingModel;
  rentalPrice: number;
  availableFrom: string;
  availableTo: string;
  pickupLocation: string;
  isAvailable: boolean;
  createdAt: string;
  updatedAt?: string;
  owner?: {
    uid: string;
    name: string;
    email: string;
    photoURL?: string | null;
  };
}

export interface RentalRequest {
  requestId: string;
  itemId: string;
  itemTitle?: string;
  itemPhotoURL?: string;
  renterId: string;
  renterName?: string;
  ownerId: string;
  ownerName?: string;
  startDate: string;
  endDate: string;
  pricingModel: PricingModel;
  pricePerPeriod?: number;
  totalPrice: number;
  status: RentalStatus;
  createdAt: string;
  approvedAt?: string | null;
  returnedAt?: string | null;
}

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  photoURL?: string | null;
}

export interface AIRecommendation {
  item: {
    itemId: string;
    title: string;
    category: string;
    rentalPrice: number;
    pricingModel: string;
    pickupLocation: string;
    photoURLs: string[];
    description: string;
  };
  estimatedCost: number;
  aiExplanation: string;
  confidenceScore: number;
}
