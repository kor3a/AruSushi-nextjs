import Head from 'next/head';
import Header from '../components/Header';
import Footer from '../components/Footer';
import MembershipTiers from '../components/MembershipTiers';

export default function Members() {
  return (
    <>
      <Head>
        <title>Membership Tiers - A-Ru Sushi</title>
        <meta name="description" content="Explore our membership tiers and exclusive benefits" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Header />

      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
        padding: '140px 20px 60px',
      }}>
        <MembershipTiers />
      </div>

      <Footer />
    </>
  );
}
