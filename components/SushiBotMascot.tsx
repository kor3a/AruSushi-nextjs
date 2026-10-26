interface SushiBotMascotProps {
  size?: number;
}

// SushiBot's face: a salmon nigiri that bobs, blinks and waves.
export default function SushiBotMascot({ size = 40 }: SushiBotMascotProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      aria-hidden="true"
      focusable="false"
      style={{ display: 'block', flexShrink: 0, overflow: 'visible' }}
    >
      <g className="bob">
        {/* Arms */}
        <ellipse cx="11" cy="43" rx="4" ry="3" fill="#fff8ec" stroke="#e6d8bd" strokeWidth="1" />
        <g className="wave">
          <ellipse cx="53" cy="41" rx="4" ry="3" fill="#fff8ec" stroke="#e6d8bd" strokeWidth="1" />
        </g>

        {/* Rice body */}
        <rect x="11" y="25" width="42" height="30" rx="14" fill="#fff8ec" stroke="#e6d8bd" strokeWidth="1.2" />
        <ellipse cx="18" cy="50" rx="1.6" ry="1" fill="#eadfc8" />
        <ellipse cx="46" cy="49" rx="1.6" ry="1" fill="#eadfc8" />
        <ellipse cx="32" cy="52" rx="1.6" ry="1" fill="#eadfc8" />

        {/* Salmon slice */}
        <path
          d="M7 31 C7 19 19 11 32 11 C45 11 57 19 57 31 C51 27.5 42 26.5 32 26.5 C22 26.5 13 27.5 7 31 Z"
          fill="#ff8a5c"
        />
        <path d="M18 16.5 C22 19.5 22.5 23.5 20 27.5" stroke="#ffc9ad" strokeWidth="2.4" strokeLinecap="round" fill="none" />
        <path d="M31 13 C35 16.5 35.5 21.5 32.5 26.5" stroke="#ffc9ad" strokeWidth="2.4" strokeLinecap="round" fill="none" />
        <path d="M44 15.5 C48 18.5 48.5 23 46 27.5" stroke="#ffc9ad" strokeWidth="2.4" strokeLinecap="round" fill="none" />

        {/* Face */}
        <g className="eyes">
          <ellipse cx="25" cy="38" rx="2.6" ry="3.2" fill="#2b2b2b" />
          <ellipse cx="39" cy="38" rx="2.6" ry="3.2" fill="#2b2b2b" />
          <circle cx="26" cy="36.8" r="0.9" fill="#fff" />
          <circle cx="40" cy="36.8" r="0.9" fill="#fff" />
        </g>
        <ellipse cx="19.5" cy="43.5" rx="3" ry="1.8" fill="#ff9eb5" opacity="0.85" />
        <ellipse cx="44.5" cy="43.5" rx="3" ry="1.8" fill="#ff9eb5" opacity="0.85" />
        <path d="M29 42.5 Q32 46 35 42.5" stroke="#2b2b2b" strokeWidth="1.6" strokeLinecap="round" fill="none" />
      </g>

      <style jsx>{`
        .bob {
          animation: sushiBob 2.4s ease-in-out infinite;
        }
        .eyes {
          transform-box: fill-box;
          transform-origin: center;
          animation: sushiBlink 4s ease-in-out infinite;
        }
        .wave {
          transform-box: fill-box;
          transform-origin: left center;
          animation: sushiWave 2.4s ease-in-out infinite;
        }
        @keyframes sushiBob {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-2.5px); }
        }
        @keyframes sushiBlink {
          0%, 90%, 100% { transform: scaleY(1); }
          94% { transform: scaleY(0.1); }
        }
        @keyframes sushiWave {
          0%, 60%, 100% { transform: rotate(0deg); }
          70% { transform: rotate(-30deg); }
          80% { transform: rotate(10deg); }
          90% { transform: rotate(-30deg); }
        }
        @media (prefers-reduced-motion: reduce) {
          .bob, .eyes, .wave { animation: none; }
        }
      `}</style>
    </svg>
  );
}
