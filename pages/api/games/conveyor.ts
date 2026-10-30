import type { NextApiRequest, NextApiResponse } from 'next';
import { createApiClient } from '../../../lib/supabase/server';
import { db, isGamesSchemaMissingError, type RewardRedemptionRecord } from '../../../lib/db';
import {
  CONVEYOR_GAME,
  CONVEYOR_GOAL,
  CONVEYOR_MAX_SCORE,
  CONVEYOR_ROUND_MS,
  GOLD_LUCKY_BOOST,
  GOLD_ROUND_CHANCE,
  GOLD_WINDOW_MS,
  getGameDate,
  type ConveyorStatus,
  type WonPrize,
} from '../../../lib/minigames/conveyor';
import { PRIZE_LIFETIME_DAYS, getPrizeByRewardType, rollPrize } from '../../../lib/minigames/prizes';

// A finish sooner than this can't have been a full round (slack for network lag)
const MIN_ROUND_MS = CONVEYOR_ROUND_MS - 1_500;
// A round left open longer than this was abandoned, and stays scoreless
const MAX_ROUND_MS = CONVEYOR_ROUND_MS + 2 * 60_000;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function toWonPrize(redemption: RewardRedemptionRecord | null) {
  const prize = redemption && getPrizeByRewardType(redemption.rewardType);
  if (!redemption || !prize) return null;
  return {
    ...prize,
    expiresAt: redemption.expiresAt?.toISOString() ?? '',
    used: redemption.status !== 'available',
  };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const supabase = createApiClient(req, res);
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return res.status(401).json({ message: 'Sign in to play' });
    }

    // Plays and prizes reference the users table
    if (!(await db.findUserById(user.id))) {
      await db.createUser({
        id: user.id,
        email: user.email!,
        name: user.user_metadata?.name || null,
      });
    }

    const playDate = getGameDate();

    if (req.method === 'GET') {
      let status: ConveyorStatus;
      try {
        const play = await db.getGamePlay(user.id, CONVEYOR_GAME, playDate);
        status = play
          ? { state: 'played', score: play.finishedAt ? play.score : null, prize: toWonPrize(play.prize) }
          : { state: 'ready' };
      } catch (error) {
        if (!isGamesSchemaMissingError(error)) throw error;
        status = { state: 'unavailable', message: 'The daily game is not set up yet.' };
      }
      return res.status(200).json(status);
    }

    const { action } = req.body as { action?: string };

    if (action === 'start') {
      // The server decides whether this round has a gold plate, so the client
      // can't claim one that never appeared
      const [from, to] = GOLD_WINDOW_MS;
      const goldAtMs = Math.random() < GOLD_ROUND_CHANCE ? Math.round(from + Math.random() * (to - from)) : null;
      const play = await db.startGamePlay(user.id, CONVEYOR_GAME, playDate, goldAtMs);
      if (!play) {
        return res.status(409).json({ message: 'You already played today. Come back tomorrow!' });
      }
      return res.status(201).json({ playId: play.id, goldAtMs: play.goldAtMs });
    }

    if (action === 'finish') {
      const { playId, score, caughtGold } = req.body as { playId?: unknown; score?: unknown; caughtGold?: unknown };
      if (typeof playId !== 'string' || !UUID_PATTERN.test(playId)) {
        return res.status(400).json({ message: 'Invalid round' });
      }
      if (!Number.isInteger(score) || (score as number) < 0 || (score as number) > CONVEYOR_MAX_SCORE) {
        return res.status(400).json({ message: 'Invalid score' });
      }

      const play = await db.getGamePlayById(user.id, playId);
      if (!play) {
        return res.status(404).json({ message: 'Round not found' });
      }
      if (play.finishedAt) {
        return res.status(409).json({ message: 'This round was already scored' });
      }

      const elapsed = Date.now() - play.startedAt.getTime();
      if (elapsed < MIN_ROUND_MS) {
        return res.status(400).json({ message: 'The round isn’t over yet' });
      }
      if (elapsed > MAX_ROUND_MS) {
        return res.status(400).json({ message: 'This round timed out' });
      }

      const gold = caughtGold === true && play.goldAtMs !== null;
      const won = (score as number) >= CONVEYOR_GOAL;
      const prize = won ? rollPrize(gold ? GOLD_LUCKY_BOOST : 1) : null;
      const expiresAt = new Date(Date.now() + PRIZE_LIFETIME_DAYS * 24 * 60 * 60 * 1000);

      try {
        await db.finishGamePlay(
          user.id,
          playId,
          { score: score as number, caughtGold: gold },
          prize && { rewardType: prize.rewardType, rewardLabel: prize.label, expiresAt }
        );
      } catch (error: any) {
        if (error?.message === 'ALREADY_FINISHED') {
          return res.status(409).json({ message: 'This round was already scored' });
        }
        throw error;
      }

      const wonPrize: WonPrize | null = prize && { ...prize, expiresAt: expiresAt.toISOString() };
      return res.status(200).json({ won, prize: wonPrize });
    }

    return res.status(400).json({ message: 'Unknown action' });
  } catch (error: any) {
    if (isGamesSchemaMissingError(error)) {
      return res.status(503).json({
        message: 'The daily game is not set up yet. Run the add_game_plays.sql migration.',
      });
    }
    console.error('Conveyor game API error:', error);
    return res.status(500).json({ message: 'Something went wrong. Please try again.' });
  }
}
