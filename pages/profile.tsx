import { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import Header from '../components/Header';
import Footer from '../components/Footer';

interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  address: string | null;
  createdAt: string;
}

export default function Profile() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin?returnUrl=/profile');
      return;
    }

    if (status === 'authenticated') {
      fetchProfile();
    }
  }, [status, router]);

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/user/profile');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch profile');
      }

      setProfile(data.user);
      setFormData({
        name: data.user.name || '',
        phone: data.user.phone || '',
        address: data.user.address || '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validate password fields if user is trying to change password
    if (formData.newPassword || formData.confirmPassword || formData.currentPassword) {
      if (!formData.currentPassword) {
        setError('Please enter your current password');
        return;
      }
      if (!formData.newPassword) {
        setError('Please enter a new password');
        return;
      }
      if (formData.newPassword !== formData.confirmPassword) {
        setError('New passwords do not match');
        return;
      }
      if (formData.newPassword.length < 6) {
        setError('New password must be at least 6 characters long');
        return;
      }
    }

    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          phone: formData.phone,
          address: formData.address,
          currentPassword: formData.currentPassword || undefined,
          newPassword: formData.newPassword || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update profile');
      }

      setProfile(data.user);
      setSuccess('Profile updated successfully!');
      setEditing(false);
      // Clear password fields
      setFormData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      }));
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    }
  };

  const handleCancel = () => {
    if (profile) {
      setFormData({
        name: profile.name || '',
        phone: profile.phone || '',
        address: profile.address || '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    }
    setEditing(false);
    setError('');
    setSuccess('');
  };

  if (status === 'loading' || loading) {
    return (
      <>
        <Head>
          <title>Profile - A-Ru Sushi</title>
        </Head>
        <Header />
        <div style={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
          padding: '140px 20px 60px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <p style={{ color: '#f1d00f', fontSize: '16px' }}>Loading...</p>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Profile - A-Ru Sushi</title>
        <meta name="description" content="Manage your profile" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Header />

      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
        padding: '140px 20px 60px'
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h1 style={{ fontSize: '36px', fontWeight: 'bold', color: '#f1d00f', marginBottom: '32px', textAlign: 'center' }}>My Profile</h1>

          {error && (
            <div style={{
              marginBottom: '24px',
              padding: '16px',
              background: 'rgba(255, 68, 68, 0.1)',
              border: '1px solid rgba(255, 68, 68, 0.3)',
              borderRadius: '8px',
              color: '#ff4444'
            }}>
              {error}
            </div>
          )}

          {success && (
            <div style={{
              marginBottom: '24px',
              padding: '16px',
              background: 'rgba(76, 175, 80, 0.1)',
              border: '1px solid rgba(76, 175, 80, 0.3)',
              borderRadius: '8px',
              color: '#4caf50'
            }}>
              {success}
            </div>
          )}

          <div style={{
            background: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(10px)',
            borderRadius: '16px',
            border: '1px solid rgba(252, 54, 120, 0.2)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
            padding: '32px'
          }}>
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {/* Email (read-only) */}
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#f1d00f', marginBottom: '8px' }}>
                    Email
                  </label>
                  <input
                    type="email"
                    value={profile?.email || ''}
                    disabled
                    style={{
                      width: '100%',
                      padding: '12px',
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '8px',
                      color: '#999',
                      fontSize: '14px',
                      outline: 'none',
                      cursor: 'not-allowed'
                    }}
                  />
                  <p style={{ marginTop: '4px', fontSize: '12px', color: '#888' }}>Email cannot be changed</p>
                </div>

                {/* Name */}
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#ccc', marginBottom: '8px' }}>
                    Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    disabled={!editing}
                    style={{
                      width: '100%',
                      padding: '12px',
                      background: editing ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '14px',
                      outline: 'none',
                      cursor: editing ? 'text' : 'not-allowed'
                    }}
                    placeholder="Your name"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#ccc', marginBottom: '8px' }}>
                    Phone
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    disabled={!editing}
                    style={{
                      width: '100%',
                      padding: '12px',
                      background: editing ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '14px',
                      outline: 'none',
                      cursor: editing ? 'text' : 'not-allowed'
                    }}
                    placeholder="Your phone number"
                  />
                </div>

                {/* Address */}
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#ccc', marginBottom: '8px' }}>
                    Address
                  </label>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    disabled={!editing}
                    rows={3}
                    style={{
                      width: '100%',
                      padding: '12px',
                      background: editing ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '14px',
                      outline: 'none',
                      resize: 'vertical',
                      cursor: editing ? 'text' : 'not-allowed',
                      fontFamily: 'inherit'
                    }}
                    placeholder="Your address"
                  />
                </div>

                {/* Password Change Section - Only shown when editing */}
                {editing && (
                  <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: '24px', marginTop: '8px' }}>
                    <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#f1d00f', marginBottom: '16px' }}>Change Password (Optional)</h2>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#ccc', marginBottom: '8px' }}>
                          Current Password
                        </label>
                        <input
                          type="password"
                          name="currentPassword"
                          value={formData.currentPassword}
                          onChange={handleInputChange}
                          style={{
                            width: '100%',
                            padding: '12px',
                            background: 'rgba(255, 255, 255, 0.08)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: '8px',
                            color: '#fff',
                            fontSize: '14px',
                            outline: 'none'
                          }}
                          placeholder="Enter current password"
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#ccc', marginBottom: '8px' }}>
                          New Password
                        </label>
                        <input
                          type="password"
                          name="newPassword"
                          value={formData.newPassword}
                          onChange={handleInputChange}
                          style={{
                            width: '100%',
                            padding: '12px',
                            background: 'rgba(255, 255, 255, 0.08)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: '8px',
                            color: '#fff',
                            fontSize: '14px',
                            outline: 'none'
                          }}
                          placeholder="Enter new password (min. 6 characters)"
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#ccc', marginBottom: '8px' }}>
                          Confirm New Password
                        </label>
                        <input
                          type="password"
                          name="confirmPassword"
                          value={formData.confirmPassword}
                          onChange={handleInputChange}
                          style={{
                            width: '100%',
                            padding: '12px',
                            background: 'rgba(255, 255, 255, 0.08)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: '8px',
                            color: '#fff',
                            fontSize: '14px',
                            outline: 'none'
                          }}
                          placeholder="Confirm new password"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Member Since */}
                <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: '16px' }}>
                  <p style={{ fontSize: '14px', color: '#ccc' }}>
                    <strong style={{ color: '#f1d00f' }}>Member since:</strong>{' '}
                    {profile?.createdAt && new Date(profile.createdAt).toLocaleDateString()}
                  </p>
                </div>

                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: '16px', paddingTop: '8px' }}>
                  {!editing ? (
                    <button
                      type="button"
                      onClick={() => setEditing(true)}
                      style={{
                        flex: 1,
                        padding: '14px 24px',
                        background: '#fc3678',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '16px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        boxShadow: '0 4px 12px rgba(252, 54, 120, 0.3)',
                        transition: 'all 0.3s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#e32a68';
                        e.currentTarget.style.transform = 'translateY(-2px)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = '#fc3678';
                        e.currentTarget.style.transform = 'translateY(0)';
                      }}
                    >
                      Edit Profile
                    </button>
                  ) : (
                    <>
                      <button
                        type="submit"
                        style={{
                          flex: 1,
                          padding: '14px 24px',
                          background: '#fc3678',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '8px',
                          fontSize: '16px',
                          fontWeight: '600',
                          cursor: 'pointer',
                          boxShadow: '0 4px 12px rgba(252, 54, 120, 0.3)',
                          transition: 'all 0.3s'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = '#e32a68';
                          e.currentTarget.style.transform = 'translateY(-2px)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = '#fc3678';
                          e.currentTarget.style.transform = 'translateY(0)';
                        }}
                      >
                        Save Changes
                      </button>
                      <button
                        type="button"
                        onClick={handleCancel}
                        style={{
                          flex: 1,
                          padding: '14px 24px',
                          background: 'rgba(255, 255, 255, 0.1)',
                          color: '#fff',
                          border: '1px solid rgba(255, 255, 255, 0.2)',
                          borderRadius: '8px',
                          fontSize: '16px',
                          fontWeight: '600',
                          cursor: 'pointer',
                          transition: 'all 0.3s'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                        }}
                      >
                        Cancel
                      </button>
                    </>
                  )}
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
}
