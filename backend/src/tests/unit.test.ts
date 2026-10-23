import assert from 'assert';
import {
  calculateRentalPrice,
  calculateRentalTotalForDates,
  roundToTwoDecimals,
} from '../services/pricing.service';
import {
  doIntervalsOverlap,
  calculateDurationDays,
  isValidDateString,
} from '../utils/dateUtils';
import {
  resolveEffectiveStatus,
  hasBookingConflict,
} from '../services/conflict.service';
import { RentalStatus } from '../types/rental.types';
import { geminiService } from '../services/gemini.service';

console.log('=== RUNNING CAMPUSCYCLE BACKEND VERIFICATION SUITE ===\n');

// 1. Date Utility Tests
console.log('1. Testing Date Parsing & Validation...');
assert.strictEqual(isValidDateString('2026-10-23'), true, 'Valid date should return true');
assert.strictEqual(isValidDateString('2026-02-29'), false, '2026 is not a leap year');
assert.strictEqual(isValidDateString('invalid-date'), false, 'Non-date string should return false');
assert.strictEqual(calculateDurationDays('2026-10-25', '2026-10-25'), 1, 'Same day rental is 1 day');
assert.strictEqual(calculateDurationDays('2026-10-25', '2026-10-27'), 3, 'Oct 25-27 inclusive is 3 days');
assert.throws(() => calculateDurationDays('2026-10-27', '2026-10-25'), 'End date before start date should throw');
console.log('✓ Date validation tests passed.\n');

// 2. Interval Overlap Tests (S1 <= E2 and S2 <= E1)
console.log('2. Testing Interval Overlap Detection (S1 <= E2 && S2 <= E1)...');
assert.strictEqual(doIntervalsOverlap('2026-10-25', '2026-10-27', '2026-10-26', '2026-10-28'), true, 'Overlapping intervals must return true');
assert.strictEqual(doIntervalsOverlap('2026-10-25', '2026-10-27', '2026-10-27', '2026-10-29'), true, 'Boundary touching intervals overlap');
assert.strictEqual(doIntervalsOverlap('2026-10-25', '2026-10-27', '2026-10-28', '2026-10-30'), false, 'Disjoint intervals must return false');
assert.strictEqual(doIntervalsOverlap('2026-10-10', '2026-10-12', '2026-10-20', '2026-10-25'), false, 'Separate date ranges must return false');
console.log('✓ Interval overlap tests passed.\n');

// 3. Deterministic Pricing Engine Tests
console.log('3. Testing Deterministic Rental Pricing Engine...');
// Daily: rate * days
assert.strictEqual(calculateRentalPrice('daily', 40, 1), 40.0, 'Daily 1 day @ 40 = 40');
assert.strictEqual(calculateRentalPrice('daily', 40, 3), 120.0, 'Daily 3 days @ 40 = 120');

// Weekly: 7 days base rate, prorated daily remainder
// e.g. 70/week -> rate/7 = 10/day
assert.strictEqual(calculateRentalPrice('weekly', 70, 7), 70.0, 'Weekly exactly 7 days = 70');
assert.strictEqual(calculateRentalPrice('weekly', 70, 9), 90.0, 'Weekly 9 days = 70 + (2 * 10) = 90');
assert.strictEqual(calculateRentalPrice('weekly', 70, 1), 10.0, 'Weekly 1 day = 1 prorated day = 10');
assert.strictEqual(calculateRentalPrice('weekly', 70, 14), 140.0, 'Weekly 14 days = 2 full weeks = 140');

// Monthly: 30 days base rate, prorated daily remainder
// e.g. 300/month -> 10/day
assert.strictEqual(calculateRentalPrice('monthly', 300, 30), 300.0, 'Monthly exactly 30 days = 300');
assert.strictEqual(calculateRentalPrice('monthly', 300, 35), 350.0, 'Monthly 35 days = 300 + (5 * 10) = 350');
assert.strictEqual(calculateRentalPrice('monthly', 300, 1), 10.0, 'Monthly 1 day minimum prorated floor = 10');

// calculateRentalTotalForDates
const totalCalc = calculateRentalTotalForDates('daily', 40, '2026-10-25', '2026-10-27');
assert.strictEqual(totalCalc.durationDays, 3);
assert.strictEqual(totalCalc.totalPrice, 120.0);
console.log('✓ Pricing engine tests passed.\n');

// 4. Booking Conflict & Effective Status Tests
console.log('4. Testing Booking Conflict & Effective Status Transitions...');
const bookings: Array<{ startDate: string; endDate: string; status: RentalStatus }> = [
  { startDate: '2026-10-25', endDate: '2026-10-27', status: 'approved' },
  { startDate: '2026-11-01', endDate: '2026-11-05', status: 'rejected' }, // rejected should not block
  { startDate: '2026-11-10', endDate: '2026-11-12', status: 'cancelled' }, // cancelled should not block
];

assert.strictEqual(hasBookingConflict('2026-10-26', '2026-10-28', bookings), true, 'Conflict with approved booking');
assert.strictEqual(hasBookingConflict('2026-10-28', '2026-10-30', bookings), false, 'No conflict with approved booking');
assert.strictEqual(hasBookingConflict('2026-11-02', '2026-11-04', bookings), false, 'Rejected booking does not create conflict');

// Effective status transition
// If status is approved and startDate has arrived, effective status is active
const effectivePast = resolveEffectiveStatus('approved', '2020-01-01');
assert.strictEqual(effectivePast, 'active', 'Past approved booking must resolve to active');
const effectiveFuture = resolveEffectiveStatus('approved', '2099-01-01');
assert.strictEqual(effectiveFuture, 'approved', 'Future approved booking remains approved');
const effectivePending = resolveEffectiveStatus('pending', '2020-01-01');
assert.strictEqual(effectivePending, 'pending', 'Pending booking never automatically becomes active');
console.log('✓ Booking conflict and status transition tests passed.\n');

// 5. AI Service & Rule-Based Fallback Tests
console.log('5. Testing AI Category Inference & Anti-Hallucination Fallback...');

async function runAITests() {
  const calcDesc = await geminiService.generateDescription('Casio FX-991EX', 'Slightly used with hard cover and battery.');
  assert.strictEqual(calcDesc.suggestedCategory, 'Calculators', 'Calculator keyword must infer Calculators category');
  assert.ok(calcDesc.generatedDescription.length > 20, 'Generated description should be non-empty');

  const labDesc = await geminiService.generateDescription('Chemistry Lab Coat Size M', 'White cotton, clean, two pockets.');
  assert.strictEqual(labDesc.suggestedCategory, 'Lab Gear', 'Lab coat keyword must infer Lab Gear category');

  const blazerDesc = await geminiService.generateDescription('Navy Raymond Blazer Size 40', 'Worn once for placement drive.');
  assert.strictEqual(blazerDesc.suggestedCategory, 'Formal Wear', 'Blazer keyword must infer Formal Wear category');

  const techDesc = await geminiService.generateDescription('Arduino Uno Starter Kit', 'Includes breadboard, jumper wires, sensors.');
  assert.strictEqual(techDesc.suggestedCategory, 'Tech & Electronics', 'Arduino keyword must infer Tech & Electronics category');

  console.log('✓ AI fallback category inference tests passed.\n');

  console.log('======================================================');
  console.log('ALL VERIFICATION SUITE TESTS PASSED SUCCESSFULLY! (100%)');
  console.log('======================================================');
}

runAITests().catch((err) => {
  console.error('Test failure:', err);
  process.exit(1);
});
