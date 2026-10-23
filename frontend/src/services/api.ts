import { getCurrentToken } from './firebase';
import { 
  Item, 
  ItemInputPayload, 
  Booking, 
  BookingInputPayload, 
  SmartSearchResult, 
  AiDescriptionResult, 
  ApiResponse 
} from '../types';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export class ApiClientError extends Error {
  code: string;
  status: number;

  constructor(message: string, code: string = 'UNKNOWN_ERROR', status: number = 500) {
    super(message);
    this.name = 'ApiClientError';
    this.code = code;
    this.status = status;
  }
}

interface RequestOptions extends RequestInit {
  requiresAuth?: boolean;
}

/**
 * Universal API fetch wrapper with token injection, error envelope parsing, and status handling
 */
export async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const url = `${BASE_URL.replace(/\/+$/, '')}/${endpoint.replace(/^\/+/, '')}`;
  const headers = new Headers(options.headers || {});
  
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  // Inject fresh Firebase token if available
  const token = await getCurrentToken(Boolean(options.requiresAuth));
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  let response: Response;
  try {
    response = await fetch(url, {
      ...options,
      headers,
    });
  } catch (err) {
    // Network failure
    throw new ApiClientError(
      'Unable to connect to the CampusCycle server. Please check your internet connection or try again later.',
      'NETWORK_FAILURE',
      0
    );
  }

  // Handle 401 Unauthorized - redirect to /login
  if (response.status === 401) {
    if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
      const returnUrl = encodeURIComponent(window.location.pathname + window.location.search);
      window.location.href = `/login?redirect=${returnUrl}`;
    }
    throw new ApiClientError('Session expired or unauthorized. Please log in again.', 'UNAUTHORIZED', 401);
  }

  let json: ApiResponse<T> | null = null;
  try {
    json = await response.json();
  } catch {
    // Response was not JSON
  }

  if (!response.ok) {
    const errorEnvelope = json?.error;
    const errorCode = errorEnvelope?.code || `HTTP_${response.status}`;
    const errorMessage = errorEnvelope?.message || (
      response.status === 403 
        ? 'You do not have permission to perform this action.' 
        : response.status === 409
        ? 'A scheduling or state conflict occurred. These dates may already be booked.'
        : `Request failed with status ${response.status}`
    );
    throw new ApiClientError(errorMessage, errorCode, response.status);
  }

  if (json && json.success === false && json.error) {
    throw new ApiClientError(json.error.message, json.error.code, response.status);
  }

  // If response has envelope data, return that; otherwise return json as T
  return (json?.data !== undefined ? json.data : (json as unknown as T));
}

import { SHOWPIECE_ITEMS } from '../data/showpieceItems';

/* =========================================================================
   Item Services
   ========================================================================= */

export const itemService = {
  async getItems(params?: { search?: string; category?: string; available?: boolean }): Promise<Item[]> {
    const searchParams = new URLSearchParams();
    if (params?.search) searchParams.append('search', params.search);
    if (params?.category && params.category !== 'All') searchParams.append('category', params.category);
    if (params?.available !== undefined) searchParams.append('available', String(params.available));

    const queryString = searchParams.toString();
    const endpoint = queryString ? `items?${queryString}` : 'items';

    try {
      const data = await request<Item[]>(endpoint, { method: 'GET' });
      if (Array.isArray(data) && data.length > 0) {
        const backendIds = new Set(data.map((i) => i.id));
        const combined = [...data, ...SHOWPIECE_ITEMS.filter((s) => !backendIds.has(s.id))];
        return combined;
      }
      return SHOWPIECE_ITEMS;
    } catch {
      // Offline or backend unavailable: return curated showpiece items
      let filtered = [...SHOWPIECE_ITEMS];
      if (params?.category && params.category !== 'All') {
        filtered = filtered.filter((i) => i.category.toLowerCase() === params.category?.toLowerCase());
      }
      if (params?.search) {
        const q = params.search.toLowerCase();
        filtered = filtered.filter((i) => 
          i.title.toLowerCase().includes(q) ||
          i.description.toLowerCase().includes(q) ||
          i.location.toLowerCase().includes(q)
        );
      }
      return filtered;
    }
  },

  async getItemById(id: string): Promise<Item> {
    try {
      return await request<Item>(`items/${id}`, { method: 'GET' });
    } catch (err) {
      const showpiece = SHOWPIECE_ITEMS.find((i) => i.id === id);
      if (showpiece) return showpiece;
      throw err;
    }
  },

  async getMyItems(): Promise<Item[]> {
    return request<Item[]>('items/owner/mine', { method: 'GET', requiresAuth: true });
  },

  // SECURITY: Client NEVER sends userId, ownerId, renterId, totalPrice, isAvailable, or status
  async createItem(payload: ItemInputPayload): Promise<Item> {
    return request<Item>('items', {
      method: 'POST',
      body: JSON.stringify(payload),
      requiresAuth: true
    });
  },

  async updateItem(id: string, payload: Partial<ItemInputPayload>): Promise<Item> {
    return request<Item>(`items/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
      requiresAuth: true
    });
  },

  async deleteItem(id: string): Promise<{ id: string; deleted: boolean }> {
    return request<{ id: string; deleted: boolean }>(`items/${id}`, {
      method: 'DELETE',
      requiresAuth: true
    });
  }
};

/* =========================================================================
   Booking Services
   ========================================================================= */

export const bookingService = {
  // SECURITY: Client NEVER sends totalPrice, userId, renterId, ownerId, or status.
  // Pricing is computed on the server.
  async createBooking(payload: BookingInputPayload): Promise<Booking> {
    return request<Booking>('bookings', {
      method: 'POST',
      body: JSON.stringify(payload),
      requiresAuth: true
    });
  },

  async getRenterBookings(): Promise<Booking[]> {
    return request<Booking[]>('bookings/renter', { method: 'GET', requiresAuth: true });
  },

  async getOwnerBookings(): Promise<Booking[]> {
    return request<Booking[]>('bookings/owner', { method: 'GET', requiresAuth: true });
  },

  // Only renter on pending bookings
  async cancelBooking(bookingId: string): Promise<Booking> {
    return request<Booking>(`bookings/${bookingId}/cancel`, {
      method: 'POST',
      requiresAuth: true
    });
  },

  // Only owner on pending bookings
  async approveBooking(bookingId: string): Promise<Booking> {
    return request<Booking>(`bookings/${bookingId}/approve`, {
      method: 'POST',
      requiresAuth: true
    });
  },

  // Only owner on pending bookings
  async rejectBooking(bookingId: string): Promise<Booking> {
    return request<Booking>(`bookings/${bookingId}/reject`, {
      method: 'POST',
      requiresAuth: true
    });
  },

  // Only owner on active bookings
  async confirmReturn(bookingId: string): Promise<Booking> {
    return request<Booking>(`bookings/${bookingId}/confirm-return`, {
      method: 'POST',
      requiresAuth: true
    });
  }
};

/* =========================================================================
   Gemini AI Services
   ========================================================================= */

export const aiService = {
  /**
   * Gemini Smart Search:
   * Returns matching items filtered from real backend items with AI explanation.
   * On failure or quota limits, fallbackUsed will be true.
   */
  async smartSearch(query: string): Promise<SmartSearchResult> {
    try {
      return await request<SmartSearchResult>('ai/smart-search', {
        method: 'POST',
        body: JSON.stringify({ query })
      });
    } catch (err: unknown) {
      // Graceful fallback to keyword search per FRONTEND_RULES.md
      console.warn('AI search unavailable or failed, falling back to standard search:', err);
      const fallbackItems = await itemService.getItems({ search: query });
      return {
        recommendations: fallbackItems,
        reasoning: 'Standard keyword search results (AI search is currently unavailable or quota reached).',
        fallbackUsed: true,
        model: 'gemini-3.5-flash-lite',
        responseTimeMs: 0
      };
    }
  },

  /**
   * Gemini Listing Description Assistant:
   * Suggests an engaging, professional description and pricing suggestions.
   */
  async generateDescription(payload: {
    title: string;
    category: string;
    keyFeatures?: string;
  }): Promise<AiDescriptionResult> {
    return request<AiDescriptionResult>('ai/generate-description', {
      method: 'POST',
      body: JSON.stringify(payload),
      requiresAuth: true
    });
  }
};
