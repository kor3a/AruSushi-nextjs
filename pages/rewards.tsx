import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Fraunces, Manrope } from 'next/font/google';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { animate, createSpring, stagger, utils } from 'animejs';
import { useAuth } from '../contexts/AuthContext';
import { useRewards } from '../contexts/RewardsContext';
import Header from '../components/Header';
import Footer from '../components/Footer';
import type { RewardType, RewardsSummary } from '../lib/rewards/types';
import type { UserRankInfo } from '../lib/ranks/types';
import { RANK_TIERS } from '../lib/ranks/config';
import styles from '../components/Rewards.module.css';

gsap.registerPlugin(ScrollTrigger, useGSAP);

const display = Fraunces({
  subsets: ['latin'],
  style: ['normal', 'italic'],
  axes: ['SOFT', 'WONK', 'opsz'],
  variable: '--font-display',
});

// Plain, even-weight digits for the balance, which the display serif made hard to read at size
const numerals = Manrope({
  subsets: ['latin'],
  weight: ['600'],
  variable: '--font-numerals',
});

const fmt = (n: number) => Math.round(n).toLocaleString('en-US');

const fmtDate = (value: string) =>
  new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

// Layout effects so elements that animate in are hidden before the first paint
const useIsoLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function parseRewardsSummary(data: any): RewardsSummary {
  return {
    pointsBalance: Number(data?.pointsBalance ?? 0),
    lifetimePointsEarned: Number(data?.lifetimePointsEarned ?? 0),
    lifetimePointsRedeemed: Number(data?.lifetimePointsRedeemed ?? 0),
    pointsPerDollar: Number(data?.pointsPerDollar ?? 1),
    rewardsCatalog: Array.isArray(data?.rewardsCatalog) ? data.rewardsCatalog : [],
    availableRedemptions: Array.isArray(data?.availableRedemptions) ? data.availableRedemptions : [],
  };
}

// Rolls the number from whatever it last showed to the new value, so spending points visibly ticks down
function useRollingNumber(value: number, ready: boolean) {
  const ref = useRef<HTMLSpanElement>(null);
  const shown = useRef(0);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!ready || !el) return;
    el.textContent = fmt(shown.current);

    if (reducedMotion()) {
      shown.current = value;
      el.textContent = fmt(value);
      return;
    }

    const first = !started.current;
    started.current = true;
    const counter = { v: shown.current };
    const anim = animate(counter, {
      v: value,
      delay: first ? 300 : 0,
      duration: first ? 1800 : 900,
      ease: 'outExpo',
      onUpdate: () => {
        shown.current = counter.v;
        el.textContent = fmt(counter.v);
      },
    });
    return () => {
      anim.pause();
    };
  }, [value, ready]);

  return ref;
}

export default function Rewards() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { refreshRewards, refreshRank } = useRewards();
  const [rewardsSummary, setRewardsSummary] = useState<RewardsSummary | null>(null);
  const [rankInfo, setRankInfo] = useState<UserRankInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [redeemingReward, setRedeemingReward] = useState<RewardType | null>(null);
  const [justClaimed, setJustClaimed] = useState<RewardType | null>(null);
  const [upgradingRank, setUpgradingRank] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const root = useRef<HTMLDivElement>(null);
  const toastRef = useRef<HTMLDivElement>(null);
  const isLoading = authLoading || loading;

  const points = rewardsSummary?.pointsBalance ?? 0;
  const balanceRef = useRollingNumber(points, !isLoading);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/signin?returnUrl=/rewards');
      return;
    }

    if (user) {
      fetchRewards();
    }
  }, [user, authLoading, router]);

  const fetchRewards = async () => {
    try {
      const [rewardsResponse, rankResponse] = await Promise.all([
        fetch('/api/rewards'),
        fetch('/api/ranks'),
      ]);
      const rewardsData = await rewardsResponse.json();

      if (rewardsResponse.ok) {
        setRewardsSummary(parseRewardsSummary(rewardsData));
      } else {
        console.error('Failed to fetch rewards summary:', rewardsData.message || rewardsData);
      }

      if (rankResponse.ok) {
        const rankData = await rankResponse.json();
        setRankInfo(rankData);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleRedeemReward = async (rewardType: RewardType) => {
    setError('');
    setSuccess('');
    setRedeemingReward(rewardType);

    try {
      const response = await fetch('/api/rewards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rewardType }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to claim reward');
      }

      setRewardsSummary(parseRewardsSummary(data));
      setJustClaimed(rewardType);
      setSuccess(data.message || 'Reward claimed successfully');
      await refreshRewards();
    } catch (redeemError: any) {
      setError(redeemError.message || 'Failed to claim reward');
    } finally {
      setRedeemingReward(null);
    }
  };

  const handleUpgradeRank = async () => {
    if (!rankInfo?.nextUpgrade) return;
    setError('');
    setSuccess('');
    setUpgradingRank(true);

    try {
      const response = await fetch('/api/ranks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to upgrade rank');
      }

      setRankInfo(data.rankInfo);
      setSuccess(data.message || 'Rank upgraded successfully!');

      if (data.pointsBalance !== undefined && rewardsSummary) {
        setRewardsSummary({ ...rewardsSummary, pointsBalance: data.pointsBalance });
      }

      await Promise.all([refreshRewards(), refreshRank()]);
    } catch (err: any) {
      setError(err.message || 'Failed to upgrade rank');
    } finally {
      setUpgradingRank(false);
    }
  };

  // Page intro, scroll reveals and hover. Runs once the data has rendered.
  useGSAP(() => {
    if (isLoading) return;
    const mm = gsap.matchMedia();

    mm.add('(prefers-reduced-motion: no-preference)', () => {
      const q = gsap.utils.selector(root);
      const cleanups: Array<() => void> = [];
      const canHover = window.matchMedia('(hover: hover)').matches;

      const printFrom = () => ({ clipPath: 'inset(0% 0% 100% 0%)', y: -28 });
      const printTo = () => ({ clipPath: 'inset(0% 0% 0% 0%)', y: 0, duration: 1.1, ease: 'power3.out', clearProps: 'clipPath' });

      // Balance and rank: labels fade up, the rank name rises out of its line, the rule draws across
      const rankName = q(`.${styles.rankNameText}`)[0];
      if (rankName) utils.set(rankName, { y: '105%' });

      gsap.timeline({ defaults: { ease: 'power3.out' } })
        .from(q(`.${styles.summaryLabel}`), { autoAlpha: 0, y: 12, duration: 0.7, stagger: 0.12 }, 0)
        .from(q(`.${styles.balanceNum}`), { autoAlpha: 0, y: 24, duration: 0.9 }, 0.1)
        .add(() => {
          if (rankName) animate(rankName, { y: '0%', duration: 1000, ease: 'out(4)' });
        }, 0.25)
        .from(q(`.${styles.rankFoot}`), { autoAlpha: 0, y: 10, duration: 0.7 }, 0.6)
        .fromTo(q(`.${styles.summary}`), { '--rule': 0 }, { '--rule': 1, duration: 1.4, ease: 'power2.inOut' }, 0.3);

      // Section headings
      q(`.${styles.blockHead}`).forEach((head: HTMLElement) => {
        gsap.from(head.children, {
          autoAlpha: 0,
          y: 24,
          duration: 0.9,
          stagger: 0.1,
          ease: 'power3.out',
          scrollTrigger: { trigger: head, start: 'top 85%', once: true },
        });
      });

      // Meal tickets feed out of the machine one at a time, top edge first
      const menuList = q(`.${styles.tickets}`)[0];
      if (menuList) {
        gsap.fromTo(menuList.children, printFrom(), {
          ...printTo(),
          stagger: 0.22,
          scrollTrigger: { trigger: menuList, start: 'top 82%', once: true },
        });
      }

      if (canHover) {
        (q(`.${styles.ticket}`) as HTMLElement[]).forEach((ticket) => {
          const lift = gsap.quickTo(ticket, 'y', { duration: 0.45, ease: 'power3.out' });
          const tilt = gsap.quickTo(ticket, 'rotation', { duration: 0.6, ease: 'power3.out' });
          const onMove = (e: MouseEvent) => {
            const r = ticket.getBoundingClientRect();
            tilt(((e.clientX - r.left) / r.width - 0.5) * 2.4);
            lift(-6);
          };
          const onLeave = () => {
            tilt(0);
            lift(0);
          };
          ticket.addEventListener('mousemove', onMove);
          ticket.addEventListener('mouseleave', onLeave);
          cleanups.push(() => {
            ticket.removeEventListener('mousemove', onMove);
            ticket.removeEventListener('mouseleave', onLeave);
          });
        });
      }

      // Perk ledger: rows slide in, then the dotted leaders run out to each status
      const ledger = q(`.${styles.ledger}`)[0];
      if (ledger) {
        const rows = q(`.${styles.ledgerRow}`);
        const leaders = q(`.${styles.leader}`);
        const statuses = q(`.${styles.status}`);
        utils.set(rows, { opacity: 0, x: -18 });
        utils.set(leaders, { scaleX: 0 });
        utils.set(statuses, { opacity: 0 });

        ScrollTrigger.create({
          trigger: ledger,
          start: 'top 85%',
          once: true,
          onEnter: () => {
            animate(rows, { opacity: 1, x: 0, delay: stagger(110), duration: 700, ease: 'outCubic' });
            animate(leaders, { scaleX: 1, delay: stagger(110, { start: 250 }), duration: 900, ease: 'inOutQuart' });
            animate(statuses, { opacity: 1, delay: stagger(110, { start: 900 }), duration: 400, ease: 'linear' });
          },
        });
      }

      // Claimed stubs get tossed into the wallet
      const wallet = q(`.${styles.wallet}`)[0];
      if (wallet) {
        const stubs = q(`.${styles.stub}`);
        utils.set(stubs, { opacity: 0, y: 40, rotate: -9 });
        ScrollTrigger.create({
          trigger: wallet,
          start: 'top 88%',
          once: true,
          onEnter: () => {
            animate(stubs, {
              opacity: { to: 1, duration: 250, ease: 'linear' },
              y: 0,
              rotate: (_?: unknown, i = 0) => (i % 2 ? 1.5 : -1),
              delay: stagger(90),
              ease: createSpring({ stiffness: 160, damping: 13 }),
            });
          },
        });
      }

      return () => cleanups.forEach((fn) => fn());
    });
  }, { scope: root, dependencies: [isLoading] });

  // The balance row pins under the nav and shrinks into a slim bar as the page scrolls; scrolling back up grows it again.
  // It's a feature rather than decoration, so under reduced motion it still docks, just with a quick snap instead of a scrub.
  useGSAP(() => {
    if (isLoading) return;
    const inner = root.current?.querySelector<HTMLElement>(`.${styles.inner}`);
    const slot = root.current?.querySelector<HTMLElement>(`.${styles.summarySlot}`);
    const summary = slot?.querySelector<HTMLElement>(`.${styles.summary}`);
    if (!inner || !slot || !summary) return;

    const header = document.querySelector('header');
    const navBottom = () => header?.getBoundingClientRect().bottom ?? 0;
    const barSize = () => (window.innerWidth < 560 ? 20 : 26);
    const still = reducedMotion();

    // The slot is what gets pinned: pinning locks its height, so the row inside stays free to shrink.
    // pinSpacing is off because the pin spacer already holds the row's full height, so nothing below moves.
    ScrollTrigger.create({
      trigger: slot,
      start: () => `top top+=${navBottom()}`,
      endTrigger: inner,
      end: () => `bottom top+=${navBottom() + 80}`,
      pin: true,
      pinSpacing: false,
      invalidateOnRefresh: true,
    });

    const q = gsap.utils.selector(summary);
    gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: {
        trigger: slot,
        start: () => `top top+=${navBottom()}`,
        end: '+=240',
        invalidateOnRefresh: true,
        ...(still ? { toggleActions: 'play none none reverse' } : { scrub: 0.4 }),
      },
    })
      .to(summary, { '--bar': 1, paddingTop: 10, paddingBottom: 10 }, 0)
      .to(q(`.${styles.balanceNum}`), { fontSize: barSize, marginTop: 2 }, 0)
      .to(q(`.${styles.rankName}`), { fontSize: () => barSize() - 4, marginTop: 2 }, 0)
      .to(q(`.${styles.summaryLabel}`), { fontSize: 10 }, 0)
      .to(q(`.${styles.rankFold}`), { height: 0, autoAlpha: 0 }, 0);
  }, { scope: root, dependencies: [isLoading] });

  // Hanko lands on the ticket that was just claimed, then lifts off
  useIsoLayoutEffect(() => {
    if (!justClaimed) return;
    const ticket = root.current?.querySelector<HTMLElement>(`[data-ticket="${justClaimed}"]`);
    const stamp = ticket?.querySelector<HTMLElement>(`.${styles.claimStamp}`);
    if (!ticket || !stamp) return;

    const anims: Array<{ pause: () => unknown }> = [];
    if (reducedMotion()) {
      utils.set(stamp, { opacity: 1 });
    } else {
      utils.set(stamp, { opacity: 0, scale: 2.3, rotate: -30 });
      anims.push(animate(stamp, { opacity: 1, duration: 110, ease: 'linear' }));
      anims.push(animate(stamp, { scale: 1, rotate: -12, ease: createSpring({ stiffness: 300, damping: 14 }) }));
      anims.push(animate(ticket, { x: [0, -4, 3, -1, 0], delay: 90, duration: 360, ease: 'outQuad' }));
    }

    const fade = window.setTimeout(() => {
      anims.push(animate(stamp, { opacity: 0, scale: 0.9, duration: 500, ease: 'inQuad', onComplete: () => setJustClaimed(null) }));
    }, 2600);

    return () => {
      window.clearTimeout(fade);
      anims.forEach((a) => a.pause());
    };
  }, [justClaimed]);

  // A freshly claimed reward pops into the wallet
  const seenStubs = useRef<Set<string> | null>(null);
  const redemptionIds = (rewardsSummary?.availableRedemptions ?? []).map((r) => r.id).join(',');
  useIsoLayoutEffect(() => {
    if (isLoading) return;
    const ids = redemptionIds ? redemptionIds.split(',') : [];
    const seen = seenStubs.current;
    seenStubs.current = new Set(ids);
    if (!seen || reducedMotion()) return;

    ids.filter((id) => !seen.has(id)).forEach((id) => {
      const el = root.current?.querySelector<HTMLElement>(`[data-stub="${id}"]`);
      if (!el) return;
      utils.set(el, { opacity: 0, scale: 0.6, rotate: -14, y: -30 });
      animate(el, {
        opacity: { to: 1, duration: 200, ease: 'linear' },
        scale: 1,
        rotate: -1,
        y: 0,
        delay: 500,
        ease: createSpring({ stiffness: 220, damping: 12 }),
      });
    });
  }, [redemptionIds, isLoading]);

  // New rank: the name rises in again in its new colour
  const lastRank = useRef<string | null>(null);
  useEffect(() => {
    const rank = rankInfo?.rank ?? null;
    const prev = lastRank.current;
    lastRank.current = rank;
    if (!prev || !rank || prev === rank || reducedMotion()) return;

    const name = root.current?.querySelector<HTMLElement>(`.${styles.rankNameText}`);
    if (name) animate(name, { y: ['105%', '0%'], duration: 900, ease: 'out(4)' });
  }, [rankInfo?.rank]);

  // Toast slides up; success notes clear themselves
  useEffect(() => {
    if (!error && !success) return;
    if (toastRef.current && !reducedMotion()) {
      gsap.fromTo(toastRef.current, { y: 30, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.55, ease: 'back.out(1.7)' });
    }
    if (!success) return;
    const timer = window.setTimeout(() => setSuccess(''), 5000);
    return () => window.clearTimeout(timer);
  }, [error, success]);

  if (isLoading) {
    return (
      <>
        <Head>
          <title>Sushi Rewards - A-Ru Sushi</title>
        </Head>
        <Header />
        <div className={`${styles.root} ${styles.loadingScreen} ${display.variable} ${numerals.variable}`}>
          <p className={styles.loadingText}>Counting your points&hellip;</p>
        </div>
        <Footer />
      </>
    );
  }

  const catalog = rewardsSummary?.rewardsCatalog ?? [];
  const redemptions = rewardsSummary?.availableRedemptions ?? [];
  const tier = rankInfo ? RANK_TIERS[rankInfo.rank] : null;
  const nextUpgrade = rankInfo?.nextUpgrade ?? null;
  const canUpgrade = !!nextUpgrade && points >= nextUpgrade.cost;
  // Only perks usable right now: unused this period, and the birthday treat only during the birthday month
  const readyPerks = rankInfo?.perks?.filter((perk) => perk.available) ?? [];

  return (
    <>
      <Head>
        <title>Sushi Rewards - A-Ru Sushi</title>
        <meta name="description" content="Earn and redeem sushi rewards" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Header />

      <div ref={root} className={`${styles.root} ${display.variable} ${numerals.variable}`}>
        {/* Rough ink edge for the claim stamp */}
        <svg width="0" height="0" aria-hidden="true" style={{ position: 'absolute' }}>
          <filter id="rewards-ink">
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="3" />
            <feDisplacementMap in="SourceGraphic" scale="2.6" />
          </filter>
        </svg>

        <div className={styles.inner}>
          <h1 className={styles.srOnly}>Sushi Rewards</h1>

          {/* Holds the row's place while it is pinned under the nav */}
          <div className={styles.summarySlot}>
            <div className={styles.summary}>
              <div>
                <p className={styles.summaryLabel}>Your balance</p>
                <p className={styles.balanceNum}>
                  <span ref={balanceRef} aria-hidden="true" />
                  <span className={styles.srOnly}>{fmt(points)}</span>
                  <span className={styles.balanceUnit}>pts</span>
                </p>
              </div>

              {rankInfo && tier && (
                <div className={styles.rankItem}>
                  <p className={styles.summaryLabel}>Your rank</p>
                  <p className={styles.rankName} style={{ color: tier.color }}>
                    <span className={styles.rankNameText}>{rankInfo.label}</span>
                  </p>
                  {/* Folds away once the row has shrunk into the bar */}
                  <div className={styles.rankFold}>
                    <div className={styles.rankFoot}>
                      {!nextUpgrade ? (
                        <span>Top rank</span>
                      ) : canUpgrade ? (
                        <button
                          type="button"
                          className={styles.btn}
                          disabled={upgradingRank}
                          onClick={handleUpgradeRank}
                        >
                          {upgradingRank ? 'Upgrading…' : `Upgrade to ${nextUpgrade.label}`}
                        </button>
                      ) : (
                        <span>
                          {fmt(nextUpgrade.cost - points)} pts to {nextUpgrade.label}
                        </span>
                      )}
                      <Link href="/members" className={styles.rankLink}>
                        Compare ranks <span aria-hidden="true">&rarr;</span>
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <section className={`${styles.block} ${styles.firstBlock}`}>
            <div className={styles.blockHead}>
              <p className={styles.kicker}>
                <span className={styles.kickerKanji}>食券</span> Meal tickets
              </p>
              <h2 className={styles.blockTitle}>Trade points for food</h2>
              <p className={styles.blockNote}>Claim a ticket here, then use it at checkout.</p>
            </div>

            <ul className={styles.tickets}>
              {catalog.map((reward, idx) => {
                const shortBy = Math.max(0, reward.pointsCost - points);
                const isRedeeming = redeemingReward === reward.type;

                return (
                  <li
                    key={reward.type}
                    className={`${styles.ticket} ${shortBy > 0 ? styles.locked : ''}`}
                    data-ticket={reward.type}
                  >
                    <div className={styles.ticketBody}>
                      <p className={styles.ticketNo}>Ticket {String(idx + 1).padStart(2, '0')}</p>
                      <h3 className={styles.ticketName}>{reward.label}</h3>
                      <p className={styles.ticketDesc}>{reward.description}</p>

                      {shortBy === 0 ? (
                        <button
                          type="button"
                          className={`${styles.btn} ${styles.btnInk}`}
                          disabled={isRedeeming}
                          onClick={() => handleRedeemReward(reward.type)}
                        >
                          {isRedeeming ? 'Claiming…' : 'Claim ticket'}
                        </button>
                      ) : (
                        <div className={styles.shortBy}>
                          <span className={styles.shortBar}>
                            <span style={{ width: `${(points / reward.pointsCost) * 100}%` }} />
                          </span>
                          <span>{fmt(shortBy)} more points</span>
                        </div>
                      )}
                    </div>

                    <div className={styles.ticketStub}>
                      <span className={styles.ticketCost}>{fmt(reward.pointsCost)}</span>
                      <span className={styles.ticketUnit}>points</span>
                    </div>

                    {justClaimed === reward.type && (
                      <span className={styles.claimStamp} aria-hidden="true">済</span>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>

          {rankInfo && readyPerks.length > 0 && (
            <section className={styles.block}>
              <div className={styles.blockHead}>
                <p className={styles.kicker}>
                  <span className={styles.kickerKanji}>特典</span> {rankInfo.label} perks
                </p>
                <h2 className={styles.blockTitle}>On the house this month</h2>
                <p className={styles.blockNote}>Apply them at checkout. Monthly perks reset on the 1st.</p>
              </div>

              <ul className={styles.ledger}>
                {readyPerks.map((perk) => (
                  <li key={perk.type} className={styles.ledgerRow}>
                    <div className={styles.ledgerMain}>
                      <span className={styles.ledgerName}>{perk.label}</span>
                      <span className={styles.leader} aria-hidden="true" />
                      <span className={`${styles.status} ${styles.statusReady}`}>Ready to use</span>
                    </div>
                    <p className={styles.ledgerDesc}>{perk.description}</p>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className={styles.block}>
            <div className={styles.blockHead}>
              <p className={styles.kicker}>
                <span className={styles.kickerKanji}>財布</span> Wallet
              </p>
              <h2 className={styles.blockTitle}>Claimed and waiting</h2>
              <p className={styles.blockNote}>These come off your order at checkout.</p>
            </div>

            {redemptions.length === 0 ? (
              <p className={styles.emptyWallet}>
                Nothing here yet. Claim a ticket above and it&apos;ll wait for you until checkout.
              </p>
            ) : (
              <ul className={styles.wallet}>
                {redemptions.map((reward) => (
                  <li key={reward.id} className={styles.stub} data-stub={reward.id}>
                    <span className={styles.stubLabel}>{reward.rewardLabel}</span>
                    <span className={styles.stubMeta}>Claimed {fmtDate(reward.claimedAt)}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        {(error || success) && (
          <div
            ref={toastRef}
            role={error ? 'alert' : 'status'}
            className={`${styles.toast} ${error ? styles.toastError : ''}`}
          >
            <span>{error || success}</span>
            <button
              type="button"
              className={styles.toastClose}
              aria-label="Dismiss"
              onClick={() => {
                setError('');
                setSuccess('');
              }}
            >
              &times;
            </button>
          </div>
        )}
      </div>

      <Footer />
    </>
  );
}
