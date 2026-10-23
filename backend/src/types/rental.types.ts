import { Timestamp } from 'firebase-admin/firestore';
import { PricingModel } from './item.types';

export type RentalStatus =
  | 'pending'
  | 'approved'
  | 'active'
  | 'returned'
  | 'rejected'
  | 'cancelled';

export interface RentalRequestDocument {
  requestId: string;
  itemId: string;
  renterId: string;
  ownerId: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  pricingModel: PricingModel;
  pricePerPeriod: number;
  totalPrice: number;
  status: RentalStatus;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  approvedAt?: Timestamp | null;
  returnedAt?: Timestamp | null;
}

export interface CreateRentalDTO {
  itemId: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
}

export interface UpdateRentalStatusDTO {
  status: 'approved' | 'rejected' | 'cancelled';
}

export interface PopulatedRentalItem {
  requestId: string;
  itemId: string;
  itemTitle: string;
  itemPhotoURL?: string;
  renterId: string;
  renterName?: string;
  ownerId: string;
  ownerName?: string;
  startDate: string;
  endDate: string;
  pricingModel: PricingModel;
  totalPrice: number;
  status: RentalStatus;
  createdAt: string;
  approvedAt?: string | null;
  returnedAt?: string | null;
}
