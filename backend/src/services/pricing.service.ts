import { PricingModel } from '../types/item.types';
import { calculateDurationDays } from '../utils/dateUtils';

export function roundToTwoDecimals(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function calculateRentalPrice(
  pricingModel: PricingModel,
  rate: number,
  durationDays: number
): number {
  if (rate <= 0) {
    throw new Error('Rental rate must be greater than zero.');
  }
  if (durationDays < 1) {
    throw new Error('Rental duration must be at least 1 day.');
  }

  switch (pricingModel) {
    case 'daily': {
      const total = durationDays * rate;
      return roundToTwoDecimals(total);
    }

    case 'weekly': {
      // 7-day billing cycle with daily pro-rata remainder
      const fullWeeks = Math.floor(durationDays / 7);
      const remainingDays = durationDays % 7;
      const dailyEquivalent = rate / 7;

      const unroundedPrice = fullWeeks * rate + remainingDays * dailyEquivalent;
      const minimumFloor = dailyEquivalent; // Minimum charge is 1 prorated day

      return roundToTwoDecimals(Math.max(unroundedPrice, minimumFloor));
    }

    case 'monthly': {
      // 30-day billing cycle with daily pro-rata remainder
      const fullMonths = Math.floor(durationDays / 30);
      const remainingDays = durationDays % 30;
      const dailyEquivalent = rate / 30;

      const unroundedPrice = fullMonths * rate + remainingDays * dailyEquivalent;
      const minimumFloor = dailyEquivalent; // Minimum charge is 1 prorated day

      return roundToTwoDecimals(Math.max(unroundedPrice, minimumFloor));
    }

    default: {
      throw new Error(`Unsupported pricing model: ${pricingModel}`);
    }
  }
}

export function calculateRentalTotalForDates(
  pricingModel: PricingModel,
  rate: number,
  startDate: string,
  endDate: string
): { durationDays: number; totalPrice: number } {
  const durationDays = calculateDurationDays(startDate, endDate);
  const totalPrice = calculateRentalPrice(pricingModel, rate, durationDays);
  return { durationDays, totalPrice };
}
