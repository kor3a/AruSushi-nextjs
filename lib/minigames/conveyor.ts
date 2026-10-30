import { PERK_TIME_ZONE } from '../perks/config';
import type { Prize } from './prizes';

// Shared by the game (components/minigames/ConveyorCatch.tsx) and its API, so
// the server checks a result against the same rules the player saw.
export const CONVEYOR_GAME = 'conveyor_catch';
export const CONVEYOR_ROUND_MS = 25_000;
export const CONVEYOR_GOAL = 10;
// A perfect round lands around 40 (a plate every ~0.6s, +2 for gold); anything
// above this can't have come from the real game
export const CONVEYOR_MAX_SCORE = 50;
// Share of rounds that get one gold plate, and the window it can appear in
export const GOLD_ROUND_CHANCE = 0.25;
export const GOLD_WINDOW_MS: [number, number] = [6_000, 18_000];
export const GOLD_LUCKY_BOOST = 2;

// The game day follows the restaurant's calendar, like member perks
export function getGameDate(now: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: PERK_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
}

export interface ConveyorPlay {
  playId: string;
  goldAtMs: number | null;
}

export interface ConveyorResult {
  score: number;
  caughtGold: boolean;
}

export interface WonPrize extends Prize {
  expiresAt: string;
}

// What GET /api/games/conveyor returns
export type ConveyorStatus =
  | { state: 'ready' }
  | { state: 'unavailable'; message: string }
  // A round was started today; `score` is null if it was never finished
  | { state: 'played'; score: number | null; prize: (WonPrize & { used: boolean }) | null };
