import { db, isPerksSchemaMissingError } from '../db';
import { isPerkType, getPerkPeriodKey, PERK_DEFINITIONS } from './config';
import type { OrderDiscounts } from './discounts';
import type { PerkType } from './types';

type ResolvedPerks = { ok: true; perks: PerkType[] } | { ok: false; status: number; message: string };

// Checks the perks a checkout asked for against what the member is actually
// entitled to and hasn't used this period. The client is never trusted here.
export async function resolveRequestedPerks(
  userId: string,
  birthday: Date | null,
  requested: unknown
): Promise<ResolvedPerks> {
  if (!Array.isArray(requested) || requested.length === 0) {
    return { ok: true, perks: [] };
  }

  const perks = Array.from(new Set(requested.map(String)));
  const invalid = perks.find((perk) => !isPerkType(perk));
  if (invalid) {
    return { ok: false, status: 400, message: `Unknown member perk: ${invalid}` };
  }

  try {
    const rank = await db.getUserRank(userId);
    const statuses = await db.getMemberPerks(userId, rank.rank, birthday);

    for (const perk of perks as PerkType[]) {
      const status = statuses.find((s) => s.type === perk);
      if (!status) {
        return { ok: false, status: 400, message: `${PERK_DEFINITIONS[perk].label} isn't included in your membership` };
      }
      if (!status.available) {
        return {
          ok: false,
          status: 400,
          message: `${status.label} isn't available: ${status.unavailableReason ?? 'already used'}`,
        };
      }
    }
  } catch (error) {
    if (isPerksSchemaMissingError(error)) {
      return {
        ok: false,
        status: 503,
        message: 'Member perks are not set up yet. Run the add_member_perk_uses.sql migration.',
      };
    }
    throw error;
  }

  return { ok: true, perks: perks as PerkType[] };
}

// A free-item perk with nothing in the cart to apply to would be silently
// burned, so refuse it instead.
export function findUnusablePerk(perks: PerkType[], discounts: OrderDiscounts): PerkType | null {
  return perks.find((perk) => !(discounts.perkDiscounts[perk] && discounts.perkDiscounts[perk]! > 0)) ?? null;
}

export function describePerkUses(perks: PerkType[], discounts: OrderDiscounts, now: Date = new Date()) {
  return perks.map((perkType) => ({
    perkType,
    periodKey: getPerkPeriodKey(perkType, now),
    discountAmount: discounts.perkDiscounts[perkType] ?? 0,
  }));
}
