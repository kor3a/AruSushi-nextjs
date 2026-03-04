import { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useAuth } from '../contexts/AuthContext';
import { useRewards } from '../contexts/RewardsContext';
import Header from '../components/Header';
import Footer from '../components/Footer';
import type { RewardType, RewardsSummary } from '../lib/rewards/types';
import { canManageOrders } from '../lib/auth/roles';

interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  address: string | null;
  createdAt: string;
}

function parseRewardsSummary(data: any): RewardsSummary {
  return {
    pointsBalance: Number(data?.pointsBalance ?? 0),
    lifetimePointsEarned: Number(data?.lifetimePointsEarned ?? 0),
    lifetimePointsRedeemed: Number(data?.lifetimePointsRedeemed ?? 0),
    pointsPerDollar: Number(data?.pointsPerDollar ?? 1),
    rewardsCatalog: Array.isArray(data?.rewardsCatalog) ? data.rewardsCatalog : [],
    availableRedemptions: Array.isArray(data?.availableRedemptions) ? data.availableRedemptions : [],
  };
}

export default function Profile() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { refreshRewards } = useRewards();
  const showRewards = !canManageOrders(user?.email);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [rewardsSummary, setRewardsSummary] = useState<RewardsSummary | null>(null);
  const [rewardsLoading, setRewardsLoading] = useState(true);
  const [redeemingReward, setRedeemingReward] = useState<RewardType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Check if form data has changed from the original profile
  const hasChanges = () => {
    if (!profile) return false;

    const nameChanged = formData.name !== (profile.name || '');
    const phoneChanged = formData.phone !== (profile.phone || '');
    const addressChanged = formData.address !== (profile.address || '');
    const passwordChanged = formData.currentPassword || formData.newPassword || formData.confirmPassword;

    return nameChanged || phoneChanged || addressChanged || passwordChanged;
  };

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/signin?returnUrl=/profile');
      return;
    }

    if (user) {
      fetchProfile();
    }
  }, [user, authLoading, router]);

  const fetchProfile = async () => {
    try {
      const profileResponse = await fetch('/api/user/profile');

      const profileData = await profileResponse.json();

      if (!profileResponse.ok) {
        throw new Error(profileData.message || 'Failed to fetch profile');
      }

      setProfile(profileData.user);
      setFormData({
        name: profileData.user.name || '',
        phone: profileData.user.phone || '',
        address: profileData.user.address || '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });

      if (!canManageOrders(profileData.user?.email || user?.email)) {
        const rewardsResponse = await fetch('/api/rewards');
        const rewardsData = await rewardsResponse.json();

        if (rewardsResponse.ok) {
          setRewardsSummary(parseRewardsSummary(rewardsData));
        } else {
          console.error('Failed to fetch rewards summary:', rewardsData.message || rewardsData);
        }
      } else {
        setRewardsSummary(null);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setRewardsLoading(false);
      setLoading(false);
    }
  };

  const handleRedeemReward = async (rewardType: RewardType) => {
    setError('');
    setSuccess('');
    setRedeemingReward(rewardType);

    try {
      const response = await fetch('/api/rewards', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ rewardType }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to claim reward');
      }

      setRewardsSummary(parseRewardsSummary(data));
      setSuccess(data.message || 'Reward claimed successfully');
      await refreshRewards();
    } catch (redeemError: any) {
      setError(redeemError.message || 'Failed to claim reward');
    } finally {
      setRedeemingReward(null);
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
      // Update form data with new profile values and clear password fields
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
    }
  };


  if (authLoading || loading) {
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

          {showRewards && (
            <div style={{
              background: 'rgba(255, 255, 255, 0.05)',
              backdropFilter: 'blur(10px)',
              borderRadius: '16px',
              border: '1px solid rgba(241, 208, 15, 0.2)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
              padding: '28px',
              marginBottom: '24px'
            }}>
              <h2 style={{ fontSize: '28px', fontWeight: 'bold', color: '#f1d00f', marginBottom: '12px' }}>Sushi Rewards</h2>
              <p style={{ fontSize: '14px', color: '#ccc', marginBottom: '20px' }}>
                Earn points whenever you spend and claim free appetizers or house special rolls.
              </p>

              {rewardsLoading ? (
                <p style={{ color: '#f1d00f', fontSize: '14px' }}>Loading rewards...</p>
              ) : (
                <>
                  <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '16px',
                    marginBottom: '20px',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '14px',
                    borderRadius: '10px',
                    background: 'rgba(241, 208, 15, 0.08)',
                    border: '1px solid rgba(241, 208, 15, 0.25)',
                  }}>
                    <div>
                      <p style={{ color: '#ccc', fontSize: '12px', marginBottom: '4px' }}>Current Points</p>
                      <p style={{ color: '#f1d00f', fontSize: '28px', fontWeight: '700', margin: 0 }}>
                        🍣 {rewardsSummary?.pointsBalance ?? 0}
                      </p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ color: '#ccc', fontSize: '12px', marginBottom: '4px' }}>Earning Rate</p>
                      <p style={{ color: '#fff', fontSize: '16px', fontWeight: '600', margin: 0 }}>
                        {rewardsSummary?.pointsPerDollar ?? 1} point per $1
                      </p>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gap: '12px', marginBottom: '16px' }}>
                    {(rewardsSummary?.rewardsCatalog || []).map((reward) => {
                      const hasEnoughPoints = (rewardsSummary?.pointsBalance ?? 0) >= reward.pointsCost;
                      const isRedeeming = redeemingReward === reward.type;

                      return (
                        <div
                          key={reward.type}
                          style={{
                            padding: '14px',
                            borderRadius: '10px',
                            border: '1px solid rgba(255, 255, 255, 0.12)',
                            background: 'rgba(255, 255, 255, 0.03)',
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: '12px',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                          }}
                        >
                          <div>
                            <p style={{ color: '#fff', fontSize: '15px', fontWeight: '600', marginBottom: '4px' }}>
                              {reward.label}
                            </p>
                            <p style={{ color: '#aaa', fontSize: '13px', marginBottom: '4px' }}>
                              {reward.description}
                            </p>
                            <p style={{ color: '#f1d00f', fontSize: '13px', fontWeight: '600' }}>
                              Cost: {reward.pointsCost} points
                            </p>
                          </div>
                          <button
                            type="button"
                            disabled={!hasEnoughPoints || isRedeeming}
                            onClick={() => handleRedeemReward(reward.type)}
                            style={{
                              padding: '10px 16px',
                              borderRadius: '8px',
                              border: 'none',
                              background: hasEnoughPoints ? '#fc3678' : 'rgba(252, 54, 120, 0.35)',
                              color: '#fff',
                              fontSize: '13px',
                              fontWeight: '600',
                              cursor: hasEnoughPoints && !isRedeeming ? 'pointer' : 'not-allowed',
                            }}
                          >
                            {isRedeeming ? 'Claiming...' : hasEnoughPoints ? 'Claim Reward' : 'Not enough points'}
                          </button>
                        </div>
                      );
                    })}
                  </div>

                  <div style={{
                    borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                    paddingTop: '14px'
                  }}>
                    <h3 style={{ color: '#f1d00f', fontSize: '16px', marginBottom: '10px' }}>Available Claimed Rewards</h3>
                    {(rewardsSummary?.availableRedemptions?.length || 0) === 0 ? (
                      <p style={{ color: '#aaa', fontSize: '13px' }}>
                        No claimed rewards yet. Claim one above, then apply it during checkout.
                      </p>
                    ) : (
                      <div style={{ display: 'grid', gap: '8px' }}>
                        {rewardsSummary?.availableRedemptions.map((reward) => (
                          <div
                            key={reward.id}
                            style={{
                              padding: '10px 12px',
                              borderRadius: '8px',
                              background: 'rgba(76, 175, 80, 0.1)',
                              border: '1px solid rgba(76, 175, 80, 0.3)',
                              color: '#d9ffd9',
                              fontSize: '13px',
                            }}
                          >
                            <strong>{reward.rewardLabel}</strong> claimed on{' '}
                            {new Date(reward.claimedAt).toLocaleDateString()}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
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
                    rows={3}
                    style={{
                      width: '100%',
                      padding: '12px',
                      background: 'rgba(255, 255, 255, 0.08)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '14px',
                      outline: 'none',
                      resize: 'vertical',
                      fontFamily: 'inherit'
                    }}
                    placeholder="Your address"
                  />
                </div>

                {/* Password Change Section */}
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

                {/* Member Since */}
                <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: '16px' }}>
                  <p style={{ fontSize: '14px', color: '#ccc' }}>
                    <strong style={{ color: '#f1d00f' }}>Member since:</strong>{' '}
                    {profile?.createdAt && new Date(profile.createdAt).toLocaleDateString()}
                  </p>
                </div>

                {/* Update Button */}
                <div style={{ paddingTop: '8px' }}>
                  <button
                    type="submit"
                    disabled={!hasChanges()}
                    style={{
                      width: '100%',
                      padding: '14px 24px',
                      background: hasChanges() ? '#fc3678' : 'rgba(252, 54, 120, 0.3)',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '16px',
                      fontWeight: '600',
                      cursor: hasChanges() ? 'pointer' : 'not-allowed',
                      boxShadow: hasChanges() ? '0 4px 12px rgba(252, 54, 120, 0.3)' : 'none',
                      transition: 'all 0.3s',
                      opacity: hasChanges() ? 1 : 0.6
                    }}
                    onMouseEnter={(e) => {
                      if (hasChanges()) {
                        e.currentTarget.style.background = '#e32a68';
                        e.currentTarget.style.transform = 'translateY(-2px)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (hasChanges()) {
                        e.currentTarget.style.background = '#fc3678';
                        e.currentTarget.style.transform = 'translateY(0)';
                      }
                    }}
                  >
                    Update
                  </button>
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
