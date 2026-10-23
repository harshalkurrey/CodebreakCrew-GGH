import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { getFirestore, isFirebaseConfigured } from '../config/firebaseAdmin';
import {
  CreateItemDTO,
  ItemDocument,
  ItemFilterQuery,
  UpdateItemDTO,
} from '../types/item.types';

export interface PopulatedItemDetail extends Omit<ItemDocument, 'createdAt' | 'updatedAt'> {
  createdAt: string;
  updatedAt: string;
  owner: {
    uid: string;
    name: string;
    email: string;
    photoURL?: string | null;
  };
}

export const DEFAULT_SEEDED_ITEMS = [
  {
    itemId: 'itm_calc_901',
    ownerId: 'usr_priya_101',
    title: 'Casio fx-991EX ClassWiz Scientific Calculator',
    category: 'Calculators' as const,
    description: 'Mint condition scientific calculator with 552 functions, textbook display, QR code generator. Includes slide-on hard case and fresh battery.',
    photoURLs: ['https://images.unsplash.com/photo-1594980596870-8aa52a78d8cd?w=600&auto=format&fit=crop'],
    pricingModel: 'daily' as const,
    rentalPrice: 40.0,
    availableFrom: '2026-10-23',
    availableTo: '2026-12-31',
    pickupLocation: 'Girls Hostel Block A',
    isAvailable: true,
    createdAt: '2026-10-23T08:15:00.000Z',
    updatedAt: '2026-10-23T08:15:00.000Z',
  },
  {
    itemId: 'itm_coat_302',
    ownerId: 'usr_rohit_102',
    title: 'White Chemistry Lab Coat (Size M)',
    category: 'Lab Gear' as const,
    description: '100% thick cotton laboratory coat with deep hip pockets and breast pocket. Freshly washed, ironed, and free of chemical stains. Fits height 5ft 6in - 5ft 10in.',
    photoURLs: ['https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=600&auto=format&fit=crop'],
    pricingModel: 'weekly' as const,
    rentalPrice: 70.0,
    availableFrom: '2026-10-23',
    availableTo: '2026-12-15',
    pickupLocation: 'Chemistry Dept Foyer',
    isAvailable: true,
    createdAt: '2026-10-23T08:40:00.000Z',
    updatedAt: '2026-10-23T08:40:00.000Z',
  },
  {
    itemId: 'itm_suit_401',
    ownerId: 'usr_karan_103',
    title: 'Navy Blue Raymond Blazer (Size 38)',
    category: 'Formal Wear' as const,
    description: 'Tailored slim-fit formal blazer in dark navy blue. Perfect for placement interviews, conference presentations, and college fests. Dry cleaned.',
    photoURLs: ['https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=600&auto=format&fit=crop'],
    pricingModel: 'daily' as const,
    rentalPrice: 150.0,
    availableFrom: '2026-10-23',
    availableTo: '2026-11-30',
    pickupLocation: 'Boys Hostel 3 Gate',
    isAvailable: true,
    createdAt: '2026-10-23T08:20:00.000Z',
    updatedAt: '2026-10-23T08:20:00.000Z',
  },
  {
    itemId: 'itm_meter_501',
    ownerId: 'usr_sneha_104',
    title: 'Aneng Digital Multimeter with Probes',
    category: 'Tech & Electronics' as const,
    description: 'Digital multimeter with high-precision probes, auto-ranging AC/DC voltage, resistance, capacitance, and continuity buzzer. Essential for hardware lab courses.',
    photoURLs: ['https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600&auto=format&fit=crop'],
    pricingModel: 'daily' as const,
    rentalPrice: 50.0,
    availableFrom: '2026-10-23',
    availableTo: '2026-12-20',
    pickupLocation: 'Boys Hostel 2 Foyer',
    isAvailable: true,
    createdAt: '2026-10-23T08:25:00.000Z',
    updatedAt: '2026-10-23T08:25:00.000Z',
  },
  {
    itemId: 'itm_ard_601',
    ownerId: 'usr_priya_101',
    title: 'Arduino Uno Starter Kit with Sensors',
    category: 'Tech & Electronics' as const,
    description: 'Genuine Arduino Uno R3 board with USB cable, 830-point breadboard, ultrasonic sensor, servo motor, and 65 jumper wires. Complete for IoT project semester.',
    photoURLs: ['https://images.unsplash.com/photo-1553406830-ef2513450d76?w=600&auto=format&fit=crop'],
    pricingModel: 'weekly' as const,
    rentalPrice: 120.0,
    availableFrom: '2026-10-23',
    availableTo: '2026-12-31',
    pickupLocation: 'Girls Hostel Block A',
    isAvailable: true,
    createdAt: '2026-10-23T08:30:00.000Z',
    updatedAt: '2026-10-23T08:30:00.000Z',
  },
];

export class ItemsService {
  private collection = 'items';
  private usersCollection = 'users';

  private serializeDoc(id: string, data: any): any {
    return {
      ...data,
      itemId: id,
      createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : data.createdAt || new Date().toISOString(),
      updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate().toISOString() : data.updatedAt || new Date().toISOString(),
    };
  }

  async createItem(ownerId: string, dto: CreateItemDTO): Promise<{ itemId: string; title: string; createdAt: string }> {
    const db = getFirestore();
    const docRef = db.collection(this.collection).doc();
    const now = FieldValue.serverTimestamp();

    const newItem = {
      itemId: docRef.id,
      ownerId,
      title: dto.title.trim(),
      category: dto.category,
      description: dto.description.trim(),
      photoURLs: dto.photoURLs,
      pricingModel: dto.pricingModel,
      rentalPrice: Number(dto.rentalPrice),
      availableFrom: dto.availableFrom,
      availableTo: dto.availableTo,
      pickupLocation: dto.pickupLocation.trim(),
      isAvailable: true,
      createdAt: now,
      updatedAt: now,
    };

    await docRef.set(newItem);

    return {
      itemId: docRef.id,
      title: newItem.title,
      createdAt: new Date().toISOString(),
    };
  }

  async getItems(filters: ItemFilterQuery): Promise<{ items: any[]; total: number }> {
    let items: any[] = [];

    if (isFirebaseConfigured()) {
      try {
        const db = getFirestore();
        let query: FirebaseFirestore.Query = db.collection(this.collection);

        if (filters.category) {
          query = query.where('category', '==', filters.category);
        }

        const snapshot = await query.get();
        snapshot.forEach((doc) => {
          const data = doc.data();
          items.push(this.serializeDoc(doc.id, data));
        });
      } catch (dbError: any) {
        // Fallback to seeded items
      }
    }

    if (items.length === 0) {
      items = [...DEFAULT_SEEDED_ITEMS];
      if (filters.category) {
        items = items.filter((it) => it.category === filters.category);
      }
    }

    // In-memory filters for flexibility without requiring complex composite index setups for local dev
    if (filters.search && filters.search.trim() !== '') {
      const term = filters.search.toLowerCase().trim();
      items = items.filter(
        (it) =>
          it.title.toLowerCase().includes(term) ||
          it.description.toLowerCase().includes(term) ||
          it.pickupLocation.toLowerCase().includes(term)
      );
    }

    if (filters.pricingModel) {
      items = items.filter((it) => it.pricingModel === filters.pricingModel);
    }

    if (filters.minPrice !== undefined && !isNaN(filters.minPrice)) {
      items = items.filter((it) => it.rentalPrice >= (filters.minPrice as number));
    }

    if (filters.maxPrice !== undefined && !isNaN(filters.maxPrice)) {
      items = items.filter((it) => it.rentalPrice <= (filters.maxPrice as number));
    }

    if (filters.availableFrom && filters.availableTo) {
      // Must be within availability window of the item
      items = items.filter(
        (it) => it.availableFrom <= filters.availableFrom! && it.availableTo >= filters.availableTo!
      );
    }

    // Default to only showing items marked as available
    items = items.filter((it) => it.isAvailable !== false);

    // Sort newest first
    items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    if (filters.limit && filters.limit > 0) {
      items = items.slice(0, filters.limit);
    }

    return {
      items,
      total: items.length,
    };
  }

  async getItemById(itemId: string): Promise<PopulatedItemDetail | null> {
    if (isFirebaseConfigured()) {
      try {
        const db = getFirestore();
        const docRef = db.collection(this.collection).doc(itemId);
        const snap = await docRef.get();

        if (snap.exists) {
          const data = snap.data()!;
          const serialized = this.serializeDoc(snap.id, data);

          let owner = {
            uid: data.ownerId,
            name: 'Campus Student',
            email: '',
            photoURL: null as string | null,
          };

          try {
            const userDoc = await db.collection(this.usersCollection).doc(data.ownerId).get();
            if (userDoc.exists) {
              const udata = userDoc.data()!;
              owner = {
                uid: data.ownerId,
                name: udata.name || 'Campus Student',
                email: udata.email || '',
                photoURL: udata.photoURL || null,
              };
            }
          } catch (e) {
            // Graceful fallback
          }

          return {
            ...serialized,
            owner,
          };
        }
      } catch (e) {
        // Proceed to fallback
      }
    }

    // Check seeded items
    const seeded = DEFAULT_SEEDED_ITEMS.find((it) => it.itemId === itemId);
    if (seeded) {
      return {
        ...seeded,
        owner: {
          uid: seeded.ownerId,
          name: seeded.ownerId === 'usr_priya_101' ? 'Priya Patel' : 'Campus Student',
          email: 'student@campus.edu',
          photoURL: null,
        },
      };
    }

    return null;
  }

  async updateItem(itemId: string, ownerId: string, updates: UpdateItemDTO): Promise<any> {
    const db = getFirestore();
    const docRef = db.collection(this.collection).doc(itemId);
    const snap = await docRef.get();

    if (!snap.exists) {
      return null;
    }

    const existing = snap.data()!;
    if (existing.ownerId !== ownerId) {
      const error: any = new Error('You do not have permission to modify this listing.');
      error.statusCode = 403;
      error.code = 'FORBIDDEN';
      throw error;
    }

    const cleanUpdates: Record<string, any> = {
      updatedAt: FieldValue.serverTimestamp(),
    };

    if (updates.title !== undefined) cleanUpdates.title = updates.title.trim();
    if (updates.category !== undefined) cleanUpdates.category = updates.category;
    if (updates.description !== undefined) cleanUpdates.description = updates.description.trim();
    if (updates.photoURLs !== undefined) cleanUpdates.photoURLs = updates.photoURLs;
    if (updates.pricingModel !== undefined) cleanUpdates.pricingModel = updates.pricingModel;
    if (updates.rentalPrice !== undefined) cleanUpdates.rentalPrice = Number(updates.rentalPrice);
    if (updates.availableFrom !== undefined) cleanUpdates.availableFrom = updates.availableFrom;
    if (updates.availableTo !== undefined) cleanUpdates.availableTo = updates.availableTo;
    if (updates.pickupLocation !== undefined) cleanUpdates.pickupLocation = updates.pickupLocation.trim();
    if (updates.isAvailable !== undefined) cleanUpdates.isAvailable = Boolean(updates.isAvailable);

    await docRef.update(cleanUpdates);

    return {
      itemId,
      ...cleanUpdates,
    };
  }
}

export const itemsService = new ItemsService();
