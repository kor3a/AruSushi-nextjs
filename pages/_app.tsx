import type { AppProps } from 'next/app';
import { AuthProvider } from '../contexts/AuthContext';
import { CartProvider } from '../contexts/CartContext';
import { RewardsProvider } from '../contexts/RewardsContext';
import Chatbot from '../components/Chatbot';
import '../public/style/style.css';

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <AuthProvider>
      <RewardsProvider>
        <CartProvider>
          <Component {...pageProps} />
          <Chatbot />
        </CartProvider>
      </RewardsProvider>
    </AuthProvider>
  );
}

export default MyApp;
