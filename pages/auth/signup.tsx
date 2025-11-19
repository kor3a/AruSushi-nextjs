import { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Head from 'next/head';
import Header from '../../components/Header';
import Footer from '../../components/Footer';

export default function SignUp() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    address: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Wait for client-side mount to prevent hydration issues
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!formData.email || !formData.password) {
      setError('Email and password are required');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          name: formData.name,
          phone: formData.phone,
          address: formData.address,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to sign up');
      }

      // Redirect to sign in page
      router.push('/auth/signin?message=Account created successfully! Please sign in.');
    } catch (err: any) {
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  if (!mounted) {
    return (
      <>
        <Head>
          <title>Sign Up - A-Ru Sushi</title>
        </Head>
        <div style={{ paddingTop: '80px', minHeight: '100vh', background: '#1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <p style={{ color: '#f1d00f' }}>Loading...</p>
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Sign Up - A-Ru Sushi</title>
        <meta name="description" content="Create your A-Ru Sushi account" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Header />

      <div style={{
        paddingTop: '100px',
        paddingBottom: '60px',
        minHeight: 'calc(100vh - 80px)',
        background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ width: '100%', maxWidth: '500px', padding: '0 20px' }}>
          <div style={{ textAlign: 'center', marginBottom: '30px' }}>
            <h1 style={{ fontSize: '32px', fontWeight: 'bold', color: '#f1d00f', marginBottom: '8px' }}>
              Create Your Account
            </h1>
            <p style={{ color: '#ccc', fontSize: '16px' }}>
              Join A-Ru Sushi to start ordering
            </p>
          </div>

          <div style={{
            background: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(10px)',
            padding: '40px',
            borderRadius: '16px',
            border: '1px solid rgba(252, 54, 120, 0.2)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
          }}>
            {error && (
              <div style={{
                marginBottom: '20px',
                padding: '12px',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#fca5a5',
                borderRadius: '8px',
                fontSize: '14px'
              }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label htmlFor="name" style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#f1d00f', marginBottom: '6px' }}>
                  Full Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '15px'
                  }}
                />
              </div>

              <div>
                <label htmlFor="email" style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#f1d00f', marginBottom: '6px' }}>
                  Email Address *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '15px'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div>
                  <label htmlFor="phone" style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#f1d00f', marginBottom: '6px' }}>
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    style={{
                      width: '100%',
                      padding: '12px',
                      background: 'rgba(255, 255, 255, 0.08)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '15px'
                    }}
                  />
                </div>

                <div>
                  <label htmlFor="address" style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#f1d00f', marginBottom: '6px' }}>
                    City
                  </label>
                  <input
                    type="text"
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    style={{
                      width: '100%',
                      padding: '12px',
                      background: 'rgba(255, 255, 255, 0.08)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '15px'
                    }}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#f1d00f', marginBottom: '6px' }}>
                  Password *
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '15px'
                  }}
                />
                <p style={{ marginTop: '4px', fontSize: '12px', color: '#999' }}>Minimum 6 characters</p>
              </div>

              <div>
                <label htmlFor="confirmPassword" style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#f1d00f', marginBottom: '6px' }}>
                  Confirm Password *
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '15px'
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '14px',
                  marginTop: '10px',
                  background: loading ? '#999' : '#fc3678',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.3s',
                  boxShadow: '0 4px 12px rgba(252, 54, 120, 0.3)'
                }}
                onMouseEnter={(e) => {
                  if (!loading) e.currentTarget.style.background = '#e02d68';
                }}
                onMouseLeave={(e) => {
                  if (!loading) e.currentTarget.style.background = '#fc3678';
                }}
              >
                {loading ? 'Creating Account...' : 'Sign Up'}
              </button>
            </form>

            <div style={{ marginTop: '25px', textAlign: 'center', paddingTop: '25px', borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
              <p style={{ fontSize: '14px', color: '#ccc' }}>
                Already have an account?{' '}
                <Link href="/auth/signin" style={{ fontWeight: '600', color: '#fc3678' }}>
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
}
