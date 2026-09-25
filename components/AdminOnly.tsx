import Head from 'next/head';
import Link from 'next/link';
import Header from './Header';
import Footer from './Footer';

const AdminOnly = () => (
  <>
    <Head>
      <title>Admin Only - A-Ru Sushi</title>
      <meta name="robots" content="noindex" />
    </Head>
    <Header />

    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
        padding: '140px 20px 60px',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          maxWidth: '520px',
          width: '100%',
          textAlign: 'center',
          padding: '40px 28px',
          borderRadius: '12px',
          background: 'rgba(255, 255, 255, 0.04)',
          border: '1px solid rgba(241, 208, 15, 0.3)',
        }}
      >
        <div style={{ fontSize: '48px', marginBottom: '12px' }} aria-hidden="true">
          🔒
        </div>
        <h1 style={{ fontSize: '32px', fontWeight: 'bold', color: '#f1d00f', marginBottom: '12px' }}>
          Admin Only
        </h1>
        <p style={{ color: '#ccc', fontSize: '16px', lineHeight: 1.6, marginBottom: '28px' }}>
          This page is only available to A-Ru Sushi staff. If you believe you should have access,
          please contact the restaurant.
        </p>
        <Link
          href="/"
          style={{
            display: 'inline-block',
            padding: '12px 28px',
            borderRadius: '8px',
            background: '#f1d00f',
            color: '#1a1a1a',
            fontWeight: 700,
            textDecoration: 'none',
          }}
        >
          Back to Home
        </Link>
      </div>
    </div>

    <Footer />
  </>
);

export default AdminOnly;
