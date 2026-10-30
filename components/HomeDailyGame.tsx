import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../contexts/AuthContext';
import ConveyorCatch from './minigames/ConveyorCatch';
import PrizeReveal from './minigames/PrizeReveal';
import SushiArt from './minigames/SushiArt';
import { display } from './minigames/font';
import {
  CONVEYOR_GOAL,
  type ConveyorPlay,
  type ConveyorResult,
  type ConveyorStatus,
  type WonPrize,
} from '../lib/minigames/conveyor';
import { PRIZE_TABLE } from '../lib/minigames/prizes';
import shared from './minigames/MiniGame.module.css';
import styles from './HomeDailyGame.module.css';

async function callGame<T>(body?: object): Promise<T> {
  const res = await fetch(
    '/api/games/conveyor',
    body
      ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
      : undefined
  );
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || 'Something went wrong. Please try again.');
  return data as T;
}

const startRound = () => callGame<ConveyorPlay>({ action: 'start' });
const finishRound = (play: ConveyorPlay, result: ConveyorResult) =>
  callGame<{ prize: WonPrize | null }>({ action: 'finish', playId: play.playId, ...result }).then((r) => r.prize);

const fmtExpiry = (iso: string) =>
  new Date(iso).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

const OrderLink = () => (
  <Link href="/menu" className={shared.btn}>
    Order now
  </Link>
);

// Shown instead of the game once today's round has been played
function PlayedToday({ status }: { status: Extract<ConveyorStatus, { state: 'played' }> }) {
  const { prize, score } = status;
  return (
    <div className={`${shared.frame} ${styles.panel}`}>
      {prize ? (
        <PrizeReveal
          prize={prize}
          note={
            prize.used
              ? 'Already used on an order. Enjoy!'
              : `Saved to your rewards. Use it at checkout by ${fmtExpiry(prize.expiresAt)}.`
          }
        >
          <p className={shared.overlayText}>New round tomorrow.</p>
          {!prize.used && <OrderLink />}
        </PrizeReveal>
      ) : (
        <div className={shared.overlayInner}>
          <p className={shared.eyebrow}>Today’s round is done</p>
          <h3 className={shared.overlayTitle}>{score === null ? 'The belt stopped' : 'So close!'}</h3>
          <p className={shared.overlayText}>
            {score === null
              ? 'You left before today’s round finished.'
              : `You served ${score} of ${CONVEYOR_GOAL}.`}{' '}
            Come back tomorrow for another round.
          </p>
        </div>
      )}
    </div>
  );
}

export default function HomeDailyGame() {
  const { user } = useAuth();
  const [status, setStatus] = useState<ConveyorStatus | null>(null);

  useEffect(() => {
    setStatus(null);
    if (!user) return;
    let cancelled = false;
    callGame<ConveyorStatus>()
      .then((data) => !cancelled && setStatus(data))
      .catch(() => !cancelled && setStatus({ state: 'unavailable', message: '' }));
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  // Hide the section rather than show a broken game (e.g. migration not run yet)
  if (user && status?.state === 'unavailable') return null;

  let stage;
  if (!user) {
    stage = (
      <div className={`${shared.frame} ${styles.panel}`}>
        <div className={shared.overlayInner}>
          <div className={styles.plates} aria-hidden="true">
            {(['salmon', 'tamago', 'tuna'] as const).map((kind) => (
              <span key={kind} className={styles.plate}>
                <SushiArt kind={kind} />
              </span>
            ))}
          </div>
          <h3 className={shared.overlayTitle}>Members play free</h3>
          <p className={shared.overlayText}>Sign in to play today’s round and win something for your next order.</p>
          <Link href="/auth/signin?returnUrl=/" className={shared.btn}>
            Sign in to play
          </Link>
        </div>
      </div>
    );
  } else if (!status) {
    stage = (
      <div className={`${shared.frame} ${styles.panel}`} aria-busy="true">
        <span className={shared.dots} aria-label="Loading today’s round">
          <span />
          <span />
          <span />
        </span>
      </div>
    );
  } else if (status.state === 'played') {
    stage = <PlayedToday status={status} />;
  } else {
    stage = <ConveyorCatch startRound={startRound} finishRound={finishRound} resultActions={<OrderLink />} />;
  }

  return (
    <section className={`${styles.root} ${display.variable}`} aria-labelledby="daily-game-title">
      <div className={styles.inner}>
        <div className={styles.intro}>
          <p className={styles.eyebrow}>Daily mini game</p>
          <h2 id="daily-game-title" className={styles.headline}>
            Catch a <em>free</em> bite
          </h2>
          <p className={styles.lede}>
            One round a day on the Conveyor Catch. Tap the plates that match the order and serve {CONVEYOR_GOAL} in
            25 seconds to win a prize for your next order.
          </p>
          <ul className={styles.prizes}>
            {PRIZE_TABLE.map((prize) => (
              <li key={prize.rewardType} data-rare={prize.rare || undefined}>
                {prize.label}
                {prize.rare && <span className={styles.rareTag}>Rare</span>}
              </li>
            ))}
          </ul>
          <p className={styles.fine}>Prizes are saved to your rewards and expire after 7 days.</p>
        </div>
        <div className={styles.stage}>{stage}</div>
      </div>
    </section>
  );
}
