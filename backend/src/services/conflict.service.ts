import { RentalStatus, RentalRequestDocument } from '../types/rental.types';
import { doIntervalsOverlap, getTodayString } from '../utils/dateUtils';

/**
 * Resolves the deterministic effective status of a rental.
 * When the current server date reaches or exceeds startDate, an approved rental becomes 'active'.
 */
export function resolveEffectiveStatus(
  status: RentalStatus,
  startDate: string
): RentalStatus {
  if (status === 'approved') {
    const today = getTodayString();
    if (today >= startDate) {
      return 'active';
    }
  }
  return status;
}

/**
 * Checks if a requested interval [startDate, endDate] conflicts with any confirmed booking.
 * A confirmed booking is any rental whose status is 'approved' or 'active'.
 */
export function hasBookingConflict(
  requestedStart: string,
  requestedEnd: string,
  existingBookings: Array<{ startDate: string; endDate: string; status: RentalStatus }>
): boolean {
  for (const booking of existingBookings) {
    const effectiveStatus = resolveEffectiveStatus(booking.status, booking.startDate);
    if (effectiveStatus === 'approved' || effectiveStatus === 'active') {
      if (
        doIntervalsOverlap(
          requestedStart,
          requestedEnd,
          booking.startDate,
          booking.endDate
        )
      ) {
        return true;
      }
    }
  }
  return false;
}
