import type { AppProps } from 'next/app';
import '../public/style/style.css';

function MyApp({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />;
}

export default MyApp;