import { useRef } from 'react';
import type { CSSProperties } from 'react';
import Link from 'next/link';
import { Fraunces } from 'next/font/google';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { animate, createSpring, splitText, stagger, svg, utils } from 'animejs';
import { useAuth } from '../contexts/AuthContext';
import { RANK_ORDER, RANK_TIERS } from '../lib/ranks/config';
import type { MemberRank } from '../lib/ranks/types';
import styles from './HomeMembership.module.css';

gsap.registerPlugin(ScrollTrigger, useGSAP);

const display = Fraunces({
  subsets: ['latin'],
  style: ['normal', 'italic'],
  axes: ['SOFT', 'WONK', 'opsz'],
  variable: '--font-display',
});

const KANJI: Record<MemberRank, string> = {
  silver: '銀',
  rose_gold: '桜',
  platinum: '白金',
  diamond: '金剛',
};

// Each tier only lists what it adds on top of the one below it
const TIERS = RANK_ORDER.map((rank, idx) => {
  const tier = RANK_TIERS[rank];
  const prev = idx > 0 ? RANK_TIERS[RANK_ORDER[idx - 1]] : null;
  const prevPerks = new Set(prev?.benefits.map((b) => b.toLowerCase()) ?? []);
  return {
    ...tier,
    kanji: KANJI[rank],
    prevLabel: prev?.label ?? null,
    newPerks: tier.benefits.filter((b) => !prevPerks.has(b.toLowerCase())),
  };
});

export default function HomeMembership() {
  const { user } = useAuth();
  const root = useRef<HTMLElement>(null);

  useGSAP(() => {
    const mm = gsap.matchMedia();

    mm.add('(prefers-reduced-motion: no-preference)', () => {
      const q = gsap.utils.selector(root);
      const cleanups: Array<() => void> = [];
      const canHover = window.matchMedia('(hover: hover)').matches;

      // Intro: eyebrow + lede fade up, headline words rise out of their line boxes
      const headline = q(`.${styles.headline}`)[0];
      const headSplit = splitText(headline, { words: { wrap: 'clip' } });
      cleanups.push(() => headSplit.revert());
      utils.set(headSplit.words, { y: '110%' });

      // splitText keeps a hidden copy of the headline for screen readers, so this also matches that copy's path
      const underline = svg.createDrawable(q(`.${styles.squiggle} path`));
      utils.set(underline, { draw: '0 0' });

      gsap.from(q(`.${styles.eyebrow}, .${styles.lede}`), {
        autoAlpha: 0,
        y: 18,
        duration: 0.9,
        stagger: 0.15,
        ease: 'power3.out',
        scrollTrigger: { trigger: headline, start: 'top 85%', once: true },
      });

      ScrollTrigger.create({
        trigger: headline,
        start: 'top 85%',
        once: true,
        onEnter: () => {
          animate(headSplit.words, { y: '0%', delay: stagger(70), duration: 950, ease: 'out(4)' });
          animate(underline, { draw: '0 1', delay: 900, duration: 700, ease: 'inOutQuad' });
        },
      });

      // Hanko stamp: slams down with a spring, ink ring spreads out
      const stamp = q(`.${styles.stamp}`)[0];
      const inkRing = q(`.${styles.inkRing}`)[0];
      const seal = q(`.${styles.seal}`)[0];
      utils.set(stamp, { opacity: 0, scale: 2.4, rotate: -26 });

      gsap.to(q(`.${styles.stampRing}`), { rotation: 360, duration: 28, repeat: -1, ease: 'none' });

      ScrollTrigger.create({
        trigger: stamp,
        start: 'top 88%',
        once: true,
        onEnter: () => {
          animate(stamp, { opacity: 1, duration: 120, ease: 'linear' });
          animate(stamp, { scale: 1, rotate: -8, ease: createSpring({ stiffness: 280, damping: 13 }) });
          animate(inkRing, { scale: [0.7, 1.9], opacity: [0.55, 0], delay: 140, duration: 800, ease: 'outCubic' });
        },
      });

      if (canHover) {
        const wiggle = () => animate(seal, { rotate: [0, -7, 5, -2, 0], duration: 650, ease: 'outQuad' });
        stamp.addEventListener('mouseenter', wiggle);
        cleanups.push(() => stamp.removeEventListener('mouseenter', wiggle));
      }

      // Cards: dealt out from a stack in the middle, then each one fills in as it lands
      const grid = q(`.${styles.cards}`)[0];
      const cards = q(`.${styles.card}`) as HTMLElement[];

      const reveals = cards.map((card) => {
        const cardQ = gsap.utils.selector(card);
        const nameSplit = splitText(cardQ(`.${styles.nameText}`)[0], { chars: { wrap: 'clip' } });
        cleanups.push(() => nameSplit.revert());
        utils.set(nameSplit.chars, { y: '105%' });

        const sheen = cardQ(`.${styles.sheen}`)[0];
        const details = cardQ(`.${styles.inherit}, .${styles.perk}`);
        utils.set(sheen, { x: '-120%' });
        utils.set(details, { opacity: 0, y: 12 });

        return { nameSplit, run: () => {
          animate(sheen, { x: '320%', duration: 1100, ease: 'inOutQuad' });
          animate(nameSplit.chars, { y: '0%', delay: stagger(30), duration: 750, ease: 'out(4)' });
          animate(details, { opacity: 1, y: 0, delay: stagger(70, { start: 250 }), duration: 600, ease: 'outCubic' });
        } };
      });

      const deal = gsap.timeline({ scrollTrigger: { trigger: grid, start: 'top 80%', once: true } });
      deal.from(cards, {
        // start every card stacked on the middle of the grid, slightly fanned
        x: (_: number, el: HTMLElement) => grid.offsetWidth / 2 - (el.offsetLeft + el.offsetWidth / 2),
        y: 90,
        rotation: (i: number) => (i - (cards.length - 1) / 2) * 7,
        autoAlpha: 0,
        duration: 1.15,
        stagger: 0.11,
        ease: 'expo.out',
      });
      reveals.forEach(({ run }, idx) => deal.add(run, 0.35 + idx * 0.11));

      // Hover: card tilts toward the cursor and a glare follows it
      if (canHover) {
        cards.forEach((card, idx) => {
          const tilt = card.querySelector<HTMLElement>(`.${styles.cardTilt}`)!;
          const face = card.querySelector<HTMLElement>(`.${styles.face}`)!;
          const kanji = card.querySelector<HTMLElement>(`.${styles.faceKanji}`)!;
          const { nameSplit } = reveals[idx];
          gsap.set(tilt, { transformPerspective: 900 });
          const rotX = gsap.quickTo(tilt, 'rotationX', { duration: 0.5, ease: 'power3.out' });
          const rotY = gsap.quickTo(tilt, 'rotationY', { duration: 0.5, ease: 'power3.out' });

          const onMove = (e: MouseEvent) => {
            const r = tilt.getBoundingClientRect();
            const px = (e.clientX - r.left) / r.width;
            const py = (e.clientY - r.top) / r.height;
            rotY((px - 0.5) * 14);
            rotX((0.5 - py) * 10);
            face.style.setProperty('--mx', `${px * 100}%`);
            face.style.setProperty('--my', `${py * 100}%`);
          };
          const onEnter = () => {
            gsap.to(face, { '--glow': 1, duration: 0.3 });
            gsap.to(tilt, { y: -8, duration: 0.4, ease: 'power3.out' });
            animate(kanji, { scale: [1, 1.08], ease: createSpring({ stiffness: 220, damping: 10 }) });
            animate(nameSplit.chars, {
              y: [{ to: '-14%', duration: 160 }, { to: '0%', duration: 420 }],
              delay: stagger(24),
              ease: 'outQuad',
            });
          };
          const onLeave = () => {
            rotX(0);
            rotY(0);
            gsap.to(face, { '--glow': 0, duration: 0.4 });
            gsap.to(tilt, { y: 0, duration: 0.5, ease: 'power3.out' });
            animate(kanji, { scale: 1, duration: 500, ease: 'outQuad' });
          };

          card.addEventListener('mousemove', onMove);
          card.addEventListener('mouseenter', onEnter);
          card.addEventListener('mouseleave', onLeave);
          cleanups.push(() => {
            card.removeEventListener('mousemove', onMove);
            card.removeEventListener('mouseenter', onEnter);
            card.removeEventListener('mouseleave', onLeave);
          });
        });
      }

      return () => cleanups.forEach((fn) => fn());
    });
  }, { scope: root });

  return (
    <section id="membership" ref={root} className={`${styles.root} ${display.variable}`}>
      {/* Rough ink edge for the hanko seal */}
      <svg width="0" height="0" aria-hidden="true" style={{ position: 'absolute' }}>
        <filter id="aru-ink">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="7" />
          <feDisplacementMap in="SourceGraphic" scale="2.4" />
        </filter>
      </svg>

      <div className={styles.inner}>
        <div className={styles.intro}>
          <div>
            <p className={styles.eyebrow}>
              A-Ru Members <span className={styles.eyebrowKanji}>会員</span>
            </p>
            <h2 className={styles.headline}>
              Eat your way{' '}
              <em>
                up
                <svg className={styles.squiggle} viewBox="0 0 120 20" preserveAspectRatio="none" aria-hidden="true">
                  <path d="M3 13 C 22 5, 34 17, 55 10 S 92 4, 117 9" />
                </svg>
              </em>{' '}
              the counter.
            </h2>
          </div>

          <div>
            <p className={styles.lede}>
              Every order earns sushi points. Spend them to move up a seat, and that seat is yours for a full year.
            </p>
            <div className={styles.stampWrap}>
              <Link href={user ? '/rewards' : '/auth/signup'} className={styles.stamp}>
                <span className={styles.inkRing} aria-hidden="true" />
                <svg className={styles.stampRing} viewBox="0 0 140 140" aria-hidden="true">
                  <defs>
                    <path id="aru-stamp-ring" d="M70,70 m-58,0 a58,58 0 1,1 116,0 a58,58 0 1,1 -116,0" />
                  </defs>
                  <text>
                    <textPath href="#aru-stamp-ring" textLength="362" lengthAdjust="spacing">
                      {user ? 'My rewards · My rewards · My rewards · ' : 'Join free · Earn points · Join free · Earn points · '}
                    </textPath>
                  </text>
                </svg>
                <span className={styles.seal} aria-hidden="true">{user ? '会員' : '入会'}</span>
                <span className={styles.srOnly}>{user ? 'See your rewards' : 'Join A-Ru Members for free'}</span>
              </Link>
              <p className={styles.stampNote}>
                {user ? (
                  <>You&apos;re a member.<br />Check your points and rank.</>
                ) : (
                  <>Silver is free.<br />Use points to upgrade.</>
                )}
              </p>
            </div>
          </div>
        </div>

        <ol className={styles.cards}>
          {TIERS.map((tier, idx) => (
            <li
              key={tier.rank}
              className={styles.card}
              style={{ '--tier': tier.color, '--tier-grad': tier.bgGradient } as CSSProperties}
            >
              <div className={styles.cardTilt}>
                <div className={styles.face}>
                  <span className={styles.sheen} aria-hidden="true" />
                  <div className={styles.faceTop}>
                    <span>A-Ru Members</span>
                    <span>No. {String(idx + 1).padStart(2, '0')}</span>
                  </div>
                  <span className={styles.faceKanji} aria-hidden="true">{tier.kanji}</span>
                  <h3 className={styles.name}>
                    <span className={styles.nameText}>{tier.label}</span>
                  </h3>
                </div>

                <div className={styles.stub}>
                  <span className={styles.perf} aria-hidden="true" />
                  {tier.prevLabel && (
                    <p className={styles.inherit}>Everything in {tier.prevLabel}, plus</p>
                  )}
                  <ul className={styles.perks}>
                    {tier.newPerks.map((perk) => (
                      <li key={perk} className={styles.perk}>{perk}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </li>
          ))}
        </ol>

        <p className={styles.footnote}>
          Ranks last one year from the day you upgrade, then reset to Silver.
        </p>
      </div>
    </section>
  );
}
