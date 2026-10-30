import { useEffect, useRef, useState } from 'react';
import type { CSSProperties, PointerEvent } from 'react';
import PrizeReveal from './PrizeReveal';
import { display } from './font';
import type { Prize } from '@/lib/minigames/prizes';
import shared from './MiniGame.module.css';
import styles from './FortuneFish.module.css';

// Matches .fish in the stylesheet (1rem = 10px)
const FISH_W = 72;
const FISH_H = 36;
const NET_REACH = 52;
const SCATTER_RADIUS = 150;
const FISH_COLORS: Array<[string, string]> = [
  ['#e0412f', '#a92c1f'],
  ['#3d6fa8', '#284d78'],
  ['#2f8f6b', '#1d6249'],
  ['#fc3678', '#bf1f56'],
  ['#d9822b', '#a35d15'],
  ['#8a5bb8', '#633f88'],
  ['#f3ece0', '#c9bda8'],
];

type Phase = 'intro' | 'fishing' | 'drawing' | 'won' | 'error';

interface Fish {
  x: number;
  y: number;
  angle: number;
  turn: number;
  speed: number;
  scatterUntil: number;
}

interface Net {
  id: number;
  x: number;
  y: number;
  hit: boolean;
}

interface Props {
  // Called when a fish is scooped; the real version asks the server
  drawPrize: () => Promise<Prize>;
  allowReplay?: boolean;
  resultNote?: string;
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
// Shortest signed angle from a to b
const angleTo = (a: number, b: number) => Math.atan2(Math.sin(b - a), Math.cos(b - a));

export default function FortuneFish({ drawPrize, allowReplay = false, resultNote }: Props) {
  const [phase, setPhase] = useState<Phase>('intro');
  const [caught, setCaught] = useState<number | null>(null);
  const [golden, setGolden] = useState(false);
  const [nets, setNets] = useState<Net[]>([]);
  const [prize, setPrize] = useState<Prize | null>(null);

  const pond = useRef<HTMLDivElement>(null);
  const fishEls = useRef<Array<HTMLDivElement | null>>([]);
  const fish = useRef<Fish[]>([]);
  const size = useRef({ w: 0, h: 0 });
  const caughtRef = useRef<number | null>(null);
  const lift = useRef<Animation | null>(null);
  const netId = useRef(0);

  const scatterFrom = (x: number, y: number, now: number, skip?: number) => {
    fish.current.forEach((f, i) => {
      if (i === skip || Math.hypot(f.x - x, f.y - y) > SCATTER_RADIUS) return;
      f.angle = Math.atan2(f.y - y, f.x - x);
      f.scatterUntil = now + 900;
    });
  };

  const spawnFish = () => {
    const { w, h } = size.current;
    fish.current = FISH_COLORS.map(() => {
      const a = Math.random() * Math.PI * 2;
      const r = Math.sqrt(Math.random()) * 0.6;
      return {
        x: w / 2 + Math.cos(a) * r * (w / 2),
        y: h / 2 + Math.sin(a) * r * (h / 2),
        angle: Math.random() * Math.PI * 2,
        turn: 0,
        speed: 38 + Math.random() * 26,
        scatterUntil: 0,
      };
    });
  };

  // Swimming runs the whole time the pond is on screen, including behind the intro
  useEffect(() => {
    const el = pond.current;
    if (!el) return;

    const measure = () => {
      const fresh = size.current.w === 0;
      size.current = { w: el.clientWidth, h: el.clientHeight };
      if (fresh) spawnFish();
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);

    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      // Capped so a stalled tab doesn't teleport the fish, but loose enough that slow phones keep full speed
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      const { w, h } = size.current;
      const cx = w / 2;
      const cy = h / 2;
      const rx = Math.max(1, w / 2 - FISH_W * 0.55);
      const ry = Math.max(1, h / 2 - FISH_H * 0.9);

      fish.current.forEach((f, i) => {
        if (i === caughtRef.current) return;
        f.turn = Math.max(-1.4, Math.min(1.4, f.turn + (Math.random() - 0.5) * 6 * dt));
        f.angle += f.turn * dt;

        // Steer back toward the middle near the pond's edge
        const edge = ((f.x - cx) / rx) ** 2 + ((f.y - cy) / ry) ** 2;
        if (edge > 0.65) {
          const home = Math.atan2(cy - f.y, cx - f.x);
          f.angle += angleTo(f.angle, home) * Math.min(1, (edge - 0.65) * 8 * dt);
        }

        const speed = f.speed * (now < f.scatterUntil ? 3.4 : 1);
        f.x += Math.cos(f.angle) * speed * dt;
        f.y += Math.sin(f.angle) * speed * dt;
        if (edge > 1) {
          const k = 1 / Math.sqrt(edge);
          f.x = cx + (f.x - cx) * k;
          f.y = cy + (f.y - cy) * k;
        }

        const node = fishEls.current[i];
        if (node) {
          const flip = Math.cos(f.angle) < 0 ? -1 : 1;
          node.style.transform = `translate(${f.x - FISH_W / 2}px, ${f.y - FISH_H / 2}px) rotate(${f.angle}rad) scaleY(${flip})`;
        }
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  const start = () => {
    lift.current?.cancel();
    lift.current = null;
    caughtRef.current = null;
    setCaught(null);
    setGolden(false);
    setPrize(null);
    setNets([]);
    if (phase !== 'intro') spawnFish();
    setPhase('fishing');
  };

  const scoop = async (e: PointerEvent<HTMLDivElement>) => {
    if (phase !== 'fishing' || !pond.current) return;
    const rect = pond.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const now = performance.now();

    let hit = -1;
    let best = NET_REACH;
    fish.current.forEach((f, i) => {
      const d = Math.hypot(f.x - x, f.y - y);
      if (d < best) {
        best = d;
        hit = i;
      }
    });

    setNets((prev) => [...prev, { id: netId.current++, x, y, hit: hit >= 0 }]);
    scatterFrom(x, y, now, hit >= 0 ? hit : undefined);
    if (hit < 0) return;

    caughtRef.current = hit;
    setCaught(hit);
    setPhase('drawing');

    // Lift the fish out of the water to the middle of the pond
    const f = fish.current[hit];
    const node = fishEls.current[hit];
    const { w, h } = size.current;
    if (node) {
      const flip = Math.cos(f.angle) < 0 ? -1 : 1;
      // Level the fish out by the shortest turn, so it doesn't spin through every lap it swam
      const level = f.angle + angleTo(f.angle, flip < 0 ? Math.PI : 0);
      lift.current = node.animate(
        [
          { transform: `translate(${f.x - FISH_W / 2}px, ${f.y - FISH_H / 2}px) rotate(${f.angle}rad) scale(1) scaleY(${flip})` },
          { transform: `translate(${w / 2 - FISH_W / 2}px, ${h / 2 - FISH_H / 2}px) rotate(${level}rad) scale(2.2) scaleY(${flip})` },
        ],
        { duration: 900, easing: 'cubic-bezier(0.3, 1.3, 0.5, 1)', fill: 'forwards' },
      );
    }

    try {
      const [won] = await Promise.all([drawPrize(), wait(1100)]);
      setPrize(won);
      if (won.rare) {
        setGolden(true);
        await wait(900);
      }
      setPhase('won');
    } catch {
      setPhase('error');
    }
  };

  return (
    <div className={`${shared.frame} ${styles.root} ${display.variable}`}>
      <div className={styles.pond} ref={pond} onPointerDown={scoop}>
        <span className={styles.lily} style={{ left: '6%', top: '14%' }} />
        <span className={styles.lily} style={{ right: '8%', bottom: '12%', scale: '1.3' }} />
        <span className={styles.lily} style={{ right: '20%', top: '6%', scale: '0.7' }} />
        <span className={styles.ripple} style={{ left: '30%', top: '62%' }} />
        <span className={styles.ripple} style={{ left: '68%', top: '30%', animationDelay: '1.6s' }} />

        {FISH_COLORS.map(([body, shade], i) => (
          <div
            key={i}
            ref={(node) => {
              fishEls.current[i] = node;
            }}
            className={styles.fish}
            data-caught={caught === i ? '' : undefined}
            data-gold={golden && caught === i ? '' : undefined}
            style={{ '--fish': body, '--fish-dark': shade } as CSSProperties}
          >
            <svg viewBox="0 0 80 40" className={styles.fishSvg} aria-hidden="true">
              <path className={styles.tail} d="M16 20 L1 7 L5 20 L1 33 Z" />
              <path className={styles.top} d="M14 20 L50 3 L76 20 Z" />
              <path className={styles.belly} d="M14 20 L50 37 L76 20 Z" />
              <path d="M50 3 L50 37" stroke="rgba(255,255,255,0.45)" strokeWidth="1.2" />
              <circle cx="64" cy="17" r="2.2" fill="#13110f" />
            </svg>
          </div>
        ))}

        {nets.map((n) => (
          <span
            key={n.id}
            className={styles.net}
            data-hit={n.hit ? '' : undefined}
            style={{ left: n.x, top: n.y }}
            onAnimationEnd={() => setNets((prev) => prev.filter((p) => p.id !== n.id))}
          />
        ))}

        {phase === 'fishing' && <p className={styles.hint}>Tap a fish to scoop it up</p>}
      </div>

      {phase !== 'fishing' && phase !== 'drawing' && (
        <div className={shared.overlay}>
          {phase === 'intro' && (
            <div className={shared.overlayInner}>
              <p className={shared.eyebrow}>Daily mini game</p>
              <h3 className={shared.overlayTitle}>Lucky Fortune Fish</h3>
              <p className={shared.overlayText}>
                Every paper fish in the pond is folded around a <strong>prize slip</strong>. Scoop one up to
                see what you won. Catch a <strong>golden koi</strong> for a rare reward.
              </p>
              <button type="button" className={shared.btn} onClick={start}>
                Go fishing
              </button>
            </div>
          )}

          {phase === 'won' && prize && (
            <PrizeReveal prize={prize} note={resultNote}>
              {allowReplay && (
                <button type="button" className={shared.btn} onClick={start}>
                  Play again
                </button>
              )}
            </PrizeReveal>
          )}

          {phase === 'error' && (
            <div className={shared.overlayInner}>
              <p className={shared.eyebrow}>Something went wrong</p>
              <h3 className={shared.overlayTitle}>The fish got away</h3>
              <p className={shared.overlayText}>We couldn’t open your prize slip. Please try again.</p>
              <button type="button" className={shared.btn} onClick={start}>
                Try again
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
