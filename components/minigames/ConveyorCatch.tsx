import { useEffect, useRef, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import SushiArt, { SUSHI_KINDS, SUSHI_NAMES, type SushiKind } from './SushiArt';
import PrizeReveal from './PrizeReveal';
import { display } from './font';
import {
  CONVEYOR_GOAL,
  CONVEYOR_ROUND_MS as ROUND_MS,
  type ConveyorPlay,
  type ConveyorResult,
  type WonPrize,
} from '@/lib/minigames/conveyor';
import shared from './MiniGame.module.css';
import styles from './ConveyorCatch.module.css';

const SPAWN_MS = 620;
// Keeps plates on the same belt from overlapping
const MIN_LANE_GAP_MS = 950;
const SLOWEST_MS = 5600;
const FASTEST_MS = 3800;
const TARGET_ODDS = 0.4;
const SWAP_TARGET_EVERY = 3;
const PLATE_COLORS = ['#3d7ea6', '#e0412f', '#2f8f6b', '#8a5bb8', '#d9822b'];

type Phase = 'intro' | 'starting' | 'playing' | 'drawing' | 'won' | 'lost' | 'error';
type PlateState = 'moving' | 'caught' | 'wrong';

interface Plate {
  id: number;
  kind: SushiKind;
  lane: 0 | 1;
  gold: boolean;
  color: string;
  duration: number;
  state: PlateState;
  points: number;
}

interface Props {
  // Registers the round with the server, which also decides if it has a gold
  // plate. Rejecting (e.g. already played today) shows the error message.
  startRound: () => Promise<ConveyorPlay>;
  // Scores the round on the server; resolves to the prize for a win, else null
  finishRound: (play: ConveyorPlay, result: ConveyorResult) => Promise<WonPrize | null>;
  allowReplay?: boolean;
  // Shown on the prize ticket; defaults to where the prize was saved
  resultNote?: string;
  // Shown under the result, e.g. a link to order
  resultActions?: ReactNode;
}

const fmtExpiry = (iso: string) =>
  new Date(iso).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

const pick = <T,>(items: T[]) => items[Math.floor(Math.random() * items.length)];
const otherKind = (not?: SushiKind) => pick(SUSHI_KINDS.filter((k) => k !== not));

export default function ConveyorCatch({ startRound, finishRound, allowReplay = false, resultNote, resultActions }: Props) {
  const [phase, setPhase] = useState<Phase>('intro');
  const [plates, setPlates] = useState<Plate[]>([]);
  const [target, setTarget] = useState<SushiKind>('salmon');
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(ROUND_MS);
  const [gold, setGold] = useState(false);
  const [prize, setPrize] = useState<WonPrize | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  // Interval callbacks read these instead of stale state
  const game = useRef({
    score: 0,
    target: 'salmon' as SushiKind,
    gold: false,
    correct: 0,
    nextId: 0,
    start: 0,
    goldAt: null as number | null,
    laneFree: [0, 0],
    play: null as ConveyorPlay | null,
  });
  const finishRoundRef = useRef(finishRound);
  finishRoundRef.current = finishRound;

  const start = async () => {
    setPhase('starting');
    let play: ConveyorPlay;
    try {
      play = await startRound();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Couldn’t start the round.');
      setPhase('error');
      return;
    }

    const g = game.current;
    Object.assign(g, {
      score: 0,
      target: otherKind(),
      gold: false,
      correct: 0,
      start: performance.now(),
      goldAt: play.goldAtMs,
      laneFree: [0, 0],
      play,
    });
    setTarget(g.target);
    setScore(0);
    setGold(false);
    setPlates([]);
    setTimeLeft(ROUND_MS);
    setPrize(null);
    setPhase('playing');
  };

  useEffect(() => {
    if (phase !== 'playing') return;
    const g = game.current;

    const spawn = window.setInterval(() => {
      const now = performance.now();
      const elapsed = now - g.start;
      const free = ([0, 1] as const).filter((lane) => now >= g.laneFree[lane]);
      if (!free.length) return;
      const lane = pick([...free]);
      const isGold = g.goldAt !== null && elapsed >= g.goldAt;
      if (isGold) g.goldAt = null;
      const kind = isGold ? otherKind() : Math.random() < TARGET_ODDS ? g.target : otherKind(g.target);
      g.laneFree[lane] = now + MIN_LANE_GAP_MS;
      const plate: Plate = {
        id: g.nextId++,
        kind,
        lane,
        gold: isGold,
        color: pick(PLATE_COLORS),
        duration: SLOWEST_MS - (SLOWEST_MS - FASTEST_MS) * Math.min(1, elapsed / ROUND_MS),
        state: 'moving',
        points: 0,
      };
      setPlates((prev) => [...prev, plate]);
    }, SPAWN_MS);

    const clock = window.setInterval(() => {
      const left = Math.max(0, ROUND_MS - (performance.now() - g.start));
      setTimeLeft(left);
      if (left > 0) return;

      window.clearInterval(spawn);
      window.clearInterval(clock);
      setPlates([]);
      // Lost rounds are sent too, so the server records the day's play
      setPhase('drawing');
      finishRoundRef
        .current(g.play!, { score: g.score, caughtGold: g.gold })
        .then((won) => {
          setPrize(won);
          setPhase(won ? 'won' : 'lost');
        })
        .catch((error) => {
          setErrorMessage(error instanceof Error ? error.message : 'We couldn’t save your round.');
          setPhase('error');
        });
    }, 100);

    return () => {
      window.clearInterval(spawn);
      window.clearInterval(clock);
    };
  }, [phase]);

  const removePlate = (id: number) => setPlates((prev) => prev.filter((p) => p.id !== id));

  const grab = (plate: Plate) => {
    if (phase !== 'playing' || plate.state !== 'moving') return;
    const g = game.current;
    let state: PlateState = 'caught';
    let points = 1;

    if (plate.gold) {
      points = 2;
      g.gold = true;
      setGold(true);
    } else if (plate.kind === g.target) {
      g.correct += 1;
      if (g.correct % SWAP_TARGET_EVERY === 0) {
        g.target = otherKind(g.target);
        setTarget(g.target);
      }
    } else {
      state = 'wrong';
      points = g.score > 0 ? -1 : 0;
    }

    g.score += points;
    setScore(g.score);
    setPlates((prev) => prev.map((p) => (p.id === plate.id ? { ...p, state, points } : p)));
  };

  const seconds = Math.ceil(timeLeft / 1000);
  const progress = Math.min(1, score / CONVEYOR_GOAL);

  return (
    <div className={`${shared.frame} ${styles.root} ${display.variable}`}>
      <div className={styles.hud}>
        <div className={styles.order} key={target}>
          <SushiArt kind={target} className={styles.orderArt} />
          <div>
            <span className={styles.orderEyebrow}>Order up</span>
            <strong className={styles.orderName}>{SUSHI_NAMES[target]}</strong>
          </div>
        </div>

        <div className={styles.stats}>
          <div className={styles.timer} data-low={phase === 'playing' && seconds <= 5 ? '' : undefined}>
            <span className={styles.statValue}>{seconds}</span>
            <span className={styles.statLabel}>sec</span>
          </div>
          <div className={styles.scoreBox}>
            <div className={styles.scoreLine}>
              <span className={styles.statValue}>{score}</span>
              <span className={styles.statLabel}>/ {CONVEYOR_GOAL}</span>
              {gold && <span className={styles.luckyChip}>Lucky!</span>}
            </div>
            <div className={styles.progress} data-done={progress >= 1 ? '' : undefined}>
              <span style={{ width: `${progress * 100}%` }} />
            </div>
          </div>
        </div>
      </div>

      <div className={styles.belts}>
        {([0, 1] as const).map((lane) => (
          <div key={lane} className={`${styles.lane} ${lane === 1 ? styles.laneLeft : ''}`}>
            {plates
              .filter((p) => p.lane === lane)
              .map((p) => (
                <div
                  key={p.id}
                  className={`${styles.track} ${lane === 1 ? styles.trackLeft : ''} ${p.state !== 'moving' ? styles.paused : ''}`}
                  style={{ animationDuration: `${p.duration}ms` }}
                  onAnimationEnd={(e) => {
                    if (e.target === e.currentTarget) removePlate(p.id);
                  }}
                >
                  <button
                    type="button"
                    className={`${styles.plate} ${p.gold ? styles.gold : ''} ${p.state === 'caught' ? styles.caught : ''} ${p.state === 'wrong' ? styles.wrong : ''}`}
                    style={{ '--rim': p.color } as CSSProperties}
                    aria-label={p.gold ? 'Gold plate' : SUSHI_NAMES[p.kind]}
                    onPointerDown={(e) => {
                      e.preventDefault();
                      grab(p);
                    }}
                    onAnimationEnd={(e) => {
                      if (e.target === e.currentTarget && p.state !== 'moving') removePlate(p.id);
                    }}
                  >
                    <SushiArt kind={p.kind} className={styles.plateArt} />
                    {p.state !== 'moving' && (
                      <span className={styles.points} data-bad={p.points < 0 ? '' : undefined}>
                        {p.gold ? '+2 Lucky' : p.points > 0 ? '+1' : p.points < 0 ? '−1' : 'Oops'}
                      </span>
                    )}
                  </button>
                </div>
              ))}
          </div>
        ))}
      </div>

      {phase !== 'playing' && (
        <div className={shared.overlay}>
          {phase === 'intro' && (
            <div className={shared.overlayInner}>
              <p className={shared.eyebrow}>Daily mini game</p>
              <h3 className={shared.overlayTitle}>Conveyor Catch</h3>
              <p className={shared.overlayText}>
                Tap the plates that match the <strong>order ticket</strong>. Wrong plates cost a point. Score{' '}
                <strong>{CONVEYOR_GOAL}</strong> in 25 seconds to win a prize. Spot the <strong>gold plate</strong>{' '}
                for a better shot at a rare reward.
              </p>
              <button type="button" className={shared.btn} onClick={start}>
                Start the belt
              </button>
            </div>
          )}

          {phase === 'starting' && (
            <div className={shared.overlayInner}>
              <p className={shared.eyebrow}>Get ready</p>
              <span className={shared.dots} aria-hidden="true">
                <span />
                <span />
                <span />
              </span>
            </div>
          )}

          {phase === 'drawing' && (
            <div className={shared.overlayInner}>
              <p className={shared.eyebrow}>{gold ? 'Lucky round' : 'Time’s up'}</p>
              <h3 className={shared.overlayTitle}>{score >= CONVEYOR_GOAL ? 'Drawing your prize' : 'Tallying plates'}</h3>
              <span className={shared.dots} aria-hidden="true">
                <span />
                <span />
                <span />
              </span>
            </div>
          )}

          {phase === 'won' && prize && (
            <PrizeReveal
              prize={prize}
              note={resultNote ?? `Saved to your rewards. Use it at checkout by ${fmtExpiry(prize.expiresAt)}.`}
            >
              {allowReplay && (
                <button type="button" className={shared.btn} onClick={start}>
                  Play again
                </button>
              )}
              {resultActions}
            </PrizeReveal>
          )}

          {(phase === 'lost' || phase === 'error') && (
            <div className={shared.overlayInner}>
              <p className={shared.eyebrow}>{phase === 'lost' ? 'Time’s up' : 'Something went wrong'}</p>
              <h3 className={shared.overlayTitle}>{phase === 'lost' ? 'So close!' : 'No round today'}</h3>
              <p className={shared.overlayText}>
                {phase === 'lost' ? `You served ${score} of ${CONVEYOR_GOAL}.` : errorMessage}{' '}
                {phase === 'lost' && !allowReplay && 'Come back tomorrow for another round.'}
              </p>
              {allowReplay && (
                <button type="button" className={shared.btn} onClick={start}>
                  Play again
                </button>
              )}
              {phase === 'lost' && resultActions}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
