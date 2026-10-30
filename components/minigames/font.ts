import { Fraunces } from 'next/font/google';

// Same display face as the home page membership section
export const display = Fraunces({
  subsets: ['latin'],
  style: ['normal', 'italic'],
  axes: ['SOFT', 'WONK', 'opsz'],
  variable: '--font-display',
});
