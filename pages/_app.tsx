import type { AppProps } from 'next/app';
import { AuthProvider } from '../contexts/AuthContext';
import { CartProvider } from '../contexts/CartContext';
import { RewardsProvider } from '../contexts/RewardsContext';
import '../public/style/style.css';

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <AuthProvider>
      <RewardsProvider>
        <CartProvider>
          <Component {...pageProps} />
        </CartProvider>
      </RewardsProvider>
    </AuthProvider>
  );
}

export default MyApp;
