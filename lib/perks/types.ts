export type PerkType =
  | 'monthly_percent_off'
  | 'monthly_free_appetizer'
  | 'monthly_free_roll'
  | 'birthday_treat';

export interface PerkDefinition {
  type: PerkType;
  label: string;
  description: string;
  // Monthly perks reset on the 1st of every month; the birthday perk is
  // usable once, during the member's birthday month.
  cadence: 'monthly' | 'birthday';
}

export interface PerkStatus {
  type: PerkType;
  label: string;
  description: string;
  cadence: 'monthly' | 'birthday';
  available: boolean;
  // Why an entitled perk isn't usable right now, for display.
  unavailableReason: string | null;
  usedAt: string | null;
}
