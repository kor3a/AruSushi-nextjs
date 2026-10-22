import type { MemberRank } from '../ranks/types';
import type { PerkDefinition, PerkType } from './types';

// Perk periods follow the restaurant's calendar, not the server's or the
// customer's, so "this month" means the same thing everywhere.
export const PERK_TIME_ZONE = 'America/Los_Angeles';

export const PERCENT_OFF_RATE = 0.1;
export const PERCENT_OFF_CAP = 20;

export const PERK_DEFINITIONS: Record<PerkType, PerkDefinition> = {
  monthly_percent_off: {
    type: 'monthly_percent_off',
    label: '10% Off Coupon',
    description: '10% off one order, up to $20. Resets every month.',
    cadence: 'monthly',
  },
  monthly_free_appetizer: {
    type: 'monthly_free_appetizer',
    label: 'Free Monthly Appetizer',
    description: 'One free appetizer. Resets every month.',
    cadence: 'monthly',
  },
  monthly_free_roll: {
    type: 'monthly_free_roll',
    label: 'Free Monthly House Special Roll',
    description: 'One free House Special roll. Resets every month.',
    cadence: 'monthly',
  },
  birthday_treat: {
    type: 'birthday_treat',
    label: 'Birthday Treat',
    description: 'One free appetizer or House Special roll during your birthday month.',
    cadence: 'birthday',
  },
};

export const RANK_PERKS: Record<MemberRank, PerkType[]> = {
  silver: ['birthday_treat'],
  rose_gold: ['birthday_treat', 'monthly_percent_off'],
  platinum: ['birthday_treat', 'monthly_percent_off', 'monthly_free_appetizer'],
  diamond: ['birthday_treat', 'monthly_percent_off', 'monthly_free_appetizer', 'monthly_free_roll'],
};

export function isPerkType(value: string): value is PerkType {
  return value in PERK_DEFINITIONS;
}

function getLocalYearMonth(now: Date): { year: number; month: number } {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: PERK_TIME_ZONE,
    year: 'numeric',
    month: 'numeric',
  }).formatToParts(now);
  return {
    year: Number(parts.find((p) => p.type === 'year')?.value),
    month: Number(parts.find((p) => p.type === 'month')?.value),
  };
}

// The key a perk use is recorded under. One use per key, so a new key is
// what makes an unused (or used) perk come back.
export function getPerkPeriodKey(perkType: PerkType, now: Date = new Date()): string {
  const { year, month } = getLocalYearMonth(now);
  if (PERK_DEFINITIONS[perkType].cadence === 'birthday') {
    return String(year);
  }
  return `${year}-${String(month).padStart(2, '0')}`;
}

// Birthdays are stored as DATE and arrive as UTC midnight, so read the UTC
// month to avoid shifting the 1st into the previous month.
export function isBirthdayMonth(birthday: Date | string | null | undefined, now: Date = new Date()): boolean {
  if (!birthday) return false;
  const date = typeof birthday === 'string' ? new Date(birthday) : birthday;
  if (Number.isNaN(date.getTime())) return false;
  return date.getUTCMonth() + 1 === getLocalYearMonth(now).month;
}
