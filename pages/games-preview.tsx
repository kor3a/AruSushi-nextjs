import Head from 'next/head';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ConveyorCatch from '../components/minigames/ConveyorCatch';
import FortuneFish from '../components/minigames/FortuneFish';
import { CONVEYOR_GOAL, GOLD_LUCKY_BOOST, GOLD_ROUND_CHANCE, GOLD_WINDOW_MS } from '../lib/minigames/conveyor';
import { rollPrize } from '../lib/minigames/prizes';
import styles from '../components/minigames/GamesPreview.module.css';

// Development-only sandbox for both mini games. Prizes roll in the browser
// here and nothing is saved; the home page plays against /api/games/conveyor.
export const getStaticProps = () =>
  process.env.NODE_ENV === 'production' ? { notFound: true } : { props: {} };

const PREVIEW_NOTE = 'Preview only: nothing was saved.';
const fakeServer = <T,>(value: () => T) => new Promise<T>((resolve) => setTimeout(() => resolve(value()), 700));
const inAWeek = () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

export default function GamesPreviewPage() {
  return (
    <>
      <Head>
        <title>Mini Game Preview | A-Ru Sushi</title>
        <meta name="robots" content="noindex" />
      </Head>
      <Header />
      <main className={styles.page}>
        <div className={styles.intro}>
          <p className={styles.eyebrow}>Mini game preview</p>
          <h1 className={styles.title}>Mini game sandbox</h1>
          <p className={styles.lede}>
            Play as many times as you like here; nothing is saved. Conveyor Catch is the live game on the home page,
            and Lucky Fortune Fish is the backup.
          </p>
        </div>

        <div className={styles.grid}>
          <section className={styles.option}>
            <h2 className={styles.optionTitle}>
              <span>A</span> Conveyor Catch
            </h2>
            <p className={styles.optionText}>Skill game: hit the score to earn a prize draw.</p>
            <ConveyorCatch
              allowReplay
              resultNote={PREVIEW_NOTE}
              startRound={() =>
                fakeServer(() => {
                  const [from, to] = GOLD_WINDOW_MS;
                  const goldAtMs = Math.random() < GOLD_ROUND_CHANCE ? from + Math.random() * (to - from) : null;
                  return { playId: 'preview', goldAtMs };
                })
              }
              finishRound={(_play, { score, caughtGold }) =>
                fakeServer(() =>
                  score >= CONVEYOR_GOAL
                    ? { ...rollPrize(caughtGold ? GOLD_LUCKY_BOOST : 1), expiresAt: inAWeek() }
                    : null
                )
              }
            />
          </section>

          <section className={styles.option}>
            <h2 className={styles.optionTitle}>
              <span>B</span> Lucky Fortune Fish
            </h2>
            <p className={styles.optionText}>Luck game: every catch wins something.</p>
            <FortuneFish allowReplay resultNote={PREVIEW_NOTE} drawPrize={() => fakeServer(() => rollPrize())} />
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
