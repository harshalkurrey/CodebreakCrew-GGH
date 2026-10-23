// Global Domain Types for CampusCycle

export type ItemCategory = 
  | 'Calculators'
  | 'Lab Coats'
  | 'Blazers'
  | 'Electronics'
  | 'Textbooks'
  | 'Tools & Equipment'
  | 'Other';

export interface Item {
  id: string;
  title: string;
  description: string;
  category: ItemCategory | string;
  condition?: string;
  dailyPrice: number;
  deposit: number;
  images: string[];
  location: string;
  ownerId: string;
  ownerName?: string;
  isAvailable: boolean;
  createdAt: string;
  updatedAt?: string;
}

// Client payload when creating/updating an item
// SECURITY: NEVER send userId, ownerId, renterId, totalPrice, isAvailable, or status
export interface ItemInputPayload {
  title: string;
  description: string;
  category: string;
  condition?: string;
  dailyPrice: number;
  deposit: number;
  images: string[];
  location: string;
}

export type BookingStatus = 
  | 'pending'
  | 'approved'
  | 'active'
  | 'completed'
  | 'cancelled'
  | 'rejected';

export interface Booking {
  id: string;
  itemId: string;
  itemTitle?: string;
  itemImage?: string;
  ownerId: string;
  renterId: string;
  startDate: string; // Canonical YYYY-MM-DD
  endDate: string;   // Canonical YYYY-MM-DD
  rentalDays: number;
  dailyPrice: number;
  rentalFee: number;
  deposit: number;
  totalPrice: number; // Server-side calculated
  status: BookingStatus;
  createdAt: string;
  updatedAt?: string;
}

// Client payload when booking an item
// SECURITY: NEVER send totalPrice, userId, renterId, ownerId, or status
export interface BookingInputPayload {
  itemId: string;
  startDate: string; // Canonical YYYY-MM-DD
  endDate: string;   // Canonical YYYY-MM-DD
}

// Gemini AI Types
export interface SmartSearchResult {
  recommendations: Item[];
  reasoning: string;
  fallbackUsed: boolean;
  model: string;
  responseTimeMs?: number;
}

export interface AiDescriptionResult {
  description: string;
  suggestedDailyPrice?: number;
  suggestedDeposit?: number;
  model: string;
  responseTimeMs?: number;
}

// Backend Error Envelope
export interface ApiError {
  code: string;
  message: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
}

// User Profile
export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  photoURL?: string;
}
