import type { ReactNode } from 'react';
import type { Prize } from '@/lib/minigames/prizes';
import styles from './MiniGame.module.css';

export default function PrizeReveal({ prize, note, children }: { prize: Prize; note?: string; children?: ReactNode }) {
  return (
    <div className={styles.overlayInner}>
      <div className={styles.ticket} data-rare={prize.rare || undefined}>
        <span className={styles.stamp} aria-hidden="true">当</span>
        <p className={styles.ticketEyebrow}>{prize.rare ? 'Rare win!' : 'You won'}</p>
        <h3 className={styles.ticketLabel}>{prize.label}</h3>
        <p className={styles.ticketDetail}>{prize.detail}</p>
        {note && <p className={styles.ticketNote}>{note}</p>}
      </div>
      {children}
    </div>
  );
}
