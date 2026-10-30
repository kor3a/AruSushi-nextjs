export type SushiKind = 'salmon' | 'tuna' | 'ebi' | 'tamago' | 'maki';

export const SUSHI_KINDS: SushiKind[] = ['salmon', 'tuna', 'ebi', 'tamago', 'maki'];

export const SUSHI_NAMES: Record<SushiKind, string> = {
  salmon: 'Salmon',
  tuna: 'Tuna',
  ebi: 'Ebi',
  tamago: 'Tamago',
  maki: 'Maki',
};

const Rice = () => (
  <>
    <ellipse cx="50" cy="52" rx="34" ry="11" fill="#e9e2d4" />
    <rect x="16" y="40" width="68" height="12" rx="6" fill="#f7f3ea" />
  </>
);

function Topping({ kind }: { kind: SushiKind }) {
  switch (kind) {
    case 'salmon':
      return (
        <g>
          <path d="M12 40 Q14 24 50 22 Q86 22 88 38 Q86 46 50 46 Q14 47 12 40Z" fill="#f2864f" />
          {[28, 42, 56, 70].map((x) => (
            <path key={x} d={`M${x} 24 Q${x + 6} 34 ${x + 2} 45`} stroke="#ffd9c2" strokeWidth="2.4" fill="none" strokeLinecap="round" />
          ))}
        </g>
      );
    case 'tuna':
      return (
        <g>
          <path d="M12 40 Q14 24 50 22 Q86 22 88 38 Q86 46 50 46 Q14 47 12 40Z" fill="#c4233a" />
          <path d="M22 30 Q50 25 78 30" stroke="#e2556a" strokeWidth="2.4" fill="none" strokeLinecap="round" />
        </g>
      );
    case 'ebi':
      return (
        <g>
          <path d="M20 41 Q20 25 50 23 Q76 23 80 34 L92 26 L90 42 L80 40 Q64 47 50 46 Q20 47 20 41Z" fill="#f5a185" />
          {[34, 46, 58, 70].map((x) => (
            <path key={x} d={`M${x} 24 L${x} 45`} stroke="#e4572e" strokeWidth="3" strokeLinecap="round" />
          ))}
        </g>
      );
    case 'tamago':
      return (
        <g>
          <rect x="13" y="22" width="74" height="22" rx="4" fill="#f6cf45" />
          <rect x="13" y="22" width="74" height="5" rx="2.5" fill="#e3a91c" />
          <rect x="41" y="20" width="18" height="34" rx="1.5" fill="#1d2a22" />
        </g>
      );
    default:
      return null;
  }
}

export default function SushiArt({ kind, className }: { kind: SushiKind; className?: string }) {
  if (kind === 'maki') {
    return (
      <svg viewBox="0 0 100 70" className={className} aria-hidden="true">
        <ellipse cx="50" cy="38" rx="27" ry="26" fill="#1d2a22" />
        <ellipse cx="50" cy="36" rx="22" ry="21" fill="#f7f3ea" />
        <circle cx="45" cy="34" r="7" fill="#f2864f" />
        <circle cx="56" cy="40" r="5" fill="#6db36a" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 100 70" className={className} aria-hidden="true">
      <Rice />
      <Topping kind={kind} />
    </svg>
  );
}
