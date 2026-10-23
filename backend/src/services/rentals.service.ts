import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { getFirestore } from '../config/firebaseAdmin';
import { CreateRentalDTO, RentalRequestDocument, RentalStatus } from '../types/rental.types';
import { calculateRentalTotalForDates } from './pricing.service';
import { hasBookingConflict, resolveEffectiveStatus } from './conflict.service';
import { getTodayString, doIntervalsOverlap } from '../utils/dateUtils';

export class RentalsService {
  private rentalsCollection = 'rentalRequests';
  private itemsCollection = 'items';
  private usersCollection = 'users';

  async createRental(
    renterId: string,
    dto: CreateRentalDTO
  ): Promise<{
    requestId: string;
    itemId: string;
    durationDays: number;
    totalPrice: number;
    status: RentalStatus;
    createdAt: string;
  }> {
    const db = getFirestore();
    const today = getTodayString();

    if (dto.startDate < today) {
      const error: any = new Error('Rental start date cannot be in the past.');
      error.statusCode = 400;
      error.code = 'INVALID_DATES';
      throw error;
    }

    if (dto.startDate > dto.endDate) {
      const error: any = new Error('Rental return date must be on or after start date.');
      error.statusCode = 400;
      error.code = 'INVALID_DATES';
      throw error;
    }

    // 1. Fetch Item
    const itemDoc = await db.collection(this.itemsCollection).doc(dto.itemId).get();
    if (!itemDoc.exists) {
      const error: any = new Error('Item listing not found.');
      error.statusCode = 404;
      error.code = 'ITEM_NOT_FOUND';
      throw error;
    }

    const item = itemDoc.data()!;

    if (item.isAvailable === false) {
      const error: any = new Error('This item is currently marked unavailable by the owner.');
      error.statusCode = 400;
      error.code = 'ITEM_NOT_AVAILABLE';
      throw error;
    }

    if (item.ownerId === renterId) {
      const error: any = new Error('You cannot rent your own item.');
      error.statusCode = 400;
      error.code = 'CANNOT_RENT_OWN_ITEM';
      throw error;
    }

    if (dto.startDate < item.availableFrom || dto.endDate > item.availableTo) {
      const error: any = new Error(
        `Requested dates fall outside item availability window (${item.availableFrom} to ${item.availableTo}).`
      );
      error.statusCode = 400;
      error.code = 'INVALID_DATES';
      throw error;
    }

    // 2. Check for conflicts with approved/active rentals
    const existingSnap = await db
      .collection(this.rentalsCollection)
      .where('itemId', '==', dto.itemId)
      .get();

    const existingRentals: Array<{ startDate: string; endDate: string; status: RentalStatus }> = [];
    existingSnap.forEach((doc) => {
      const data = doc.data();
      existingRentals.push({
        startDate: data.startDate,
        endDate: data.endDate,
        status: data.status,
      });
    });

    if (hasBookingConflict(dto.startDate, dto.endDate, existingRentals)) {
      const error: any = new Error('Requested dates overlap with an existing approved rental.');
      error.statusCode = 409;
      error.code = 'CALENDAR_CONFLICT';
      throw error;
    }

    // 3. Deterministic Server-Side Pricing
    const { durationDays, totalPrice } = calculateRentalTotalForDates(
      item.pricingModel,
      item.rentalPrice,
      dto.startDate,
      dto.endDate
    );

    const docRef = db.collection(this.rentalsCollection).doc();
    const now = FieldValue.serverTimestamp();

    const newRentalDoc: Omit<RentalRequestDocument, 'createdAt' | 'updatedAt'> & {
      createdAt: any;
      updatedAt: any;
    } = {
      requestId: docRef.id,
      itemId: item.itemId,
      renterId,
      ownerId: item.ownerId,
      startDate: dto.startDate,
      endDate: dto.endDate,
      pricingModel: item.pricingModel,
      pricePerPeriod: item.rentalPrice,
      totalPrice,
      status: 'pending',
      createdAt: now,
      updatedAt: now,
      approvedAt: null,
      returnedAt: null,
    };

    await docRef.set(newRentalDoc);

    return {
      requestId: docRef.id,
      itemId: item.itemId,
      durationDays,
      totalPrice,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
  }

  async getUserRentals(userId: string): Promise<{ borrowing: any[]; lending: any[] }> {
    const db = getFirestore();

    const [borrowingSnap, lendingSnap] = await Promise.all([
      db.collection(this.rentalsCollection).where('renterId', '==', userId).get(),
      db.collection(this.rentalsCollection).where('ownerId', '==', userId).get(),
    ]);

    // Collect item IDs and user IDs to populate details in batch
    const itemIds = new Set<string>();
    const userIds = new Set<string>();

    const rawBorrowing: any[] = [];
    borrowingSnap.forEach((doc) => {
      const d = doc.data();
      rawBorrowing.push({ ...d, requestId: doc.id });
      itemIds.add(d.itemId);
      userIds.add(d.ownerId);
    });

    const rawLending: any[] = [];
    lendingSnap.forEach((doc) => {
      const d = doc.data();
      rawLending.push({ ...d, requestId: doc.id });
      itemIds.add(d.itemId);
      userIds.add(d.renterId);
    });

    // Fetch items map
    const itemsMap: Record<string, { title: string; photoURL?: string }> = {};
    if (itemIds.size > 0) {
      const itemDocs = await Promise.all(
        Array.from(itemIds).map((id) => db.collection(this.itemsCollection).doc(id).get())
      );
      itemDocs.forEach((snap) => {
        if (snap.exists) {
          const d = snap.data()!;
          itemsMap[snap.id] = {
            title: d.title || 'Campus Equipment',
            photoURL: d.photoURLs && d.photoURLs[0] ? d.photoURLs[0] : undefined,
          };
        }
      });
    }

    // Fetch users map
    const usersMap: Record<string, string> = {};
    if (userIds.size > 0) {
      const userDocs = await Promise.all(
        Array.from(userIds).map((id) => db.collection(this.usersCollection).doc(id).get())
      );
      userDocs.forEach((snap) => {
        if (snap.exists) {
          const d = snap.data()!;
          usersMap[snap.id] = d.name || 'Campus Student';
        }
      });
    }

    const mapRental = (rental: any, counterpartType: 'owner' | 'renter') => {
      const effectiveStatus = resolveEffectiveStatus(rental.status, rental.startDate);
      const itemInfo = itemsMap[rental.itemId] || { title: 'Campus Equipment' };
      const counterpartId = counterpartType === 'owner' ? rental.ownerId : rental.renterId;
      const counterpartName = usersMap[counterpartId] || 'Campus Student';

      return {
        requestId: rental.requestId,
        itemId: rental.itemId,
        itemTitle: itemInfo.title,
        itemPhotoURL: itemInfo.photoURL,
        ...(counterpartType === 'owner'
          ? { ownerId: rental.ownerId, ownerName: counterpartName }
          : { renterId: rental.renterId, renterName: counterpartName }),
        startDate: rental.startDate,
        endDate: rental.endDate,
        pricingModel: rental.pricingModel,
        pricePerPeriod: rental.pricePerPeriod,
        totalPrice: rental.totalPrice,
        status: effectiveStatus,
        createdAt: rental.createdAt instanceof Timestamp ? rental.createdAt.toDate().toISOString() : rental.createdAt,
        approvedAt: rental.approvedAt instanceof Timestamp ? rental.approvedAt.toDate().toISOString() : rental.approvedAt,
        returnedAt: rental.returnedAt instanceof Timestamp ? rental.returnedAt.toDate().toISOString() : rental.returnedAt,
      };
    };

    const borrowing = rawBorrowing
      .map((r) => mapRental(r, 'owner'))
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

    const lending = rawLending
      .map((r) => mapRental(r, 'renter'))
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

    return { borrowing, lending };
  }

  async updateRentalStatus(
    requestId: string,
    userId: string,
    newStatus: 'approved' | 'rejected' | 'cancelled'
  ): Promise<{ requestId: string; status: RentalStatus; approvedAt?: string | null }> {
    const db = getFirestore();
    const rentalRef = db.collection(this.rentalsCollection).doc(requestId);

    const result = await db.runTransaction(async (transaction) => {
      const rentalDoc = await transaction.get(rentalRef);
      if (!rentalDoc.exists) {
        const error: any = new Error('Rental request not found.');
        error.statusCode = 404;
        error.code = 'RENTAL_NOT_FOUND';
        throw error;
      }

      const rental = rentalDoc.data()!;

      if (newStatus === 'approved') {
        if (rental.ownerId !== userId) {
          const error: any = new Error('Only the item owner can approve this rental request.');
          error.statusCode = 403;
          error.code = 'FORBIDDEN';
          throw error;
        }

        if (rental.status !== 'pending') {
          const error: any = new Error(`Only pending requests can be approved. Current status: ${rental.status}`);
          error.statusCode = 400;
          error.code = 'INVALID_STATUS_TRANSITION';
          throw error;
        }

        // Concurrency protection: Check for conflicting approved/active rentals inside transaction
        const existingSnap = await transaction.get(
          db.collection(this.rentalsCollection).where('itemId', '==', rental.itemId)
        );

        const existingRentals: Array<{ startDate: string; endDate: string; status: RentalStatus }> = [];
        existingSnap.forEach((doc) => {
          if (doc.id !== requestId) {
            const data = doc.data();
            existingRentals.push({
              startDate: data.startDate,
              endDate: data.endDate,
              status: data.status,
            });
          }
        });

        if (hasBookingConflict(rental.startDate, rental.endDate, existingRentals)) {
          const error: any = new Error(
            'Cannot approve: Item has already been approved for an overlapping date range.'
          );
          error.statusCode = 409;
          error.code = 'CALENDAR_CONFLICT';
          throw error;
        }

        const now = FieldValue.serverTimestamp();
        transaction.update(rentalRef, {
          status: 'approved',
          approvedAt: now,
          updatedAt: now,
        });

        return {
          requestId,
          status: 'approved' as RentalStatus,
          approvedAt: new Date().toISOString(),
          itemMeta: {
            itemId: rental.itemId,
            startDate: rental.startDate,
            endDate: rental.endDate,
          },
        };
      } else if (newStatus === 'rejected') {
        if (rental.ownerId !== userId) {
          const error: any = new Error('Only the item owner can reject this rental request.');
          error.statusCode = 403;
          error.code = 'FORBIDDEN';
          throw error;
        }

        if (rental.status !== 'pending') {
          const error: any = new Error(`Only pending requests can be rejected. Current status: ${rental.status}`);
          error.statusCode = 400;
          error.code = 'INVALID_STATUS_TRANSITION';
          throw error;
        }

        transaction.update(rentalRef, {
          status: 'rejected',
          updatedAt: FieldValue.serverTimestamp(),
        });

        return {
          requestId,
          status: 'rejected',
        };
      } else if (newStatus === 'cancelled') {
        if (rental.renterId !== userId) {
          const error: any = new Error('Only the booking renter can cancel this request.');
          error.statusCode = 403;
          error.code = 'FORBIDDEN';
          throw error;
        }

        if (rental.status !== 'pending') {
          const error: any = new Error(`Only pending requests can be cancelled. Current status: ${rental.status}`);
          error.statusCode = 400;
          error.code = 'INVALID_STATUS_TRANSITION';
          throw error;
        }

        transaction.update(rentalRef, {
          status: 'cancelled',
          updatedAt: FieldValue.serverTimestamp(),
        });

        return {
          requestId,
          status: 'cancelled',
        };
      }

      throw new Error('Unsupported status');
    });

    // Post-Transaction Cascade: Auto-reject remaining overlapping pending requests
    if (newStatus === 'approved' && (result as any).itemMeta) {
      try {
        const meta = (result as any).itemMeta;
        const pendingSnap = await db
          .collection(this.rentalsCollection)
          .where('itemId', '==', meta.itemId)
          .where('status', '==', 'pending')
          .get();

        const batch = db.batch();
        let rejectedCount = 0;

        pendingSnap.forEach((doc) => {
          if (doc.id !== requestId) {
            const d = doc.data();
            if (doIntervalsOverlap(meta.startDate, meta.endDate, d.startDate, d.endDate)) {
              batch.update(doc.ref, {
                status: 'rejected',
                rejectionReason: 'Dates no longer available due to approved booking',
                updatedAt: FieldValue.serverTimestamp(),
              });
              rejectedCount++;
            }
          }
        });

        if (rejectedCount > 0) {
          await batch.commit();
        }
      } catch (cascadeError) {
        console.warn('[RentalsService] Post-commit cascade auto-reject error:', cascadeError);
      }
    }

    return {
      requestId: result.requestId,
      status: result.status as RentalStatus,
      approvedAt: result.approvedAt,
    };
  }

  async confirmReturn(
    requestId: string,
    userId: string
  ): Promise<{ requestId: string; status: RentalStatus; returnedAt: string }> {
    const db = getFirestore();
    const rentalRef = db.collection(this.rentalsCollection).doc(requestId);
    const snap = await rentalRef.get();

    if (!snap.exists) {
      const error: any = new Error('Rental request not found.');
      error.statusCode = 404;
      error.code = 'RENTAL_NOT_FOUND';
      throw error;
    }

    const rental = snap.data()!;

    if (rental.ownerId !== userId) {
      const error: any = new Error('Only the item owner can confirm item return.');
      error.statusCode = 403;
      error.code = 'FORBIDDEN';
      throw error;
    }

    const effectiveStatus = resolveEffectiveStatus(rental.status, rental.startDate);
    if (effectiveStatus !== 'active' && effectiveStatus !== 'approved') {
      const error: any = new Error(
        `Item can only be marked returned if active or approved. Current effective status: ${effectiveStatus}`
      );
      error.statusCode = 400;
      error.code = 'INVALID_RETURN_STATE';
      throw error;
    }

    const now = FieldValue.serverTimestamp();
    await rentalRef.update({
      status: 'returned',
      returnedAt: now,
      updatedAt: now,
    });

    return {
      requestId,
      status: 'returned',
      returnedAt: new Date().toISOString(),
    };
  }
}

export const rentalsService = new RentalsService();
