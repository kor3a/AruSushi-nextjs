import { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '../contexts/AuthContext';
import { useRewards } from '../contexts/RewardsContext';
import Header from '../components/Header';
import Footer from '../components/Footer';
import type { RewardType, RewardsSummary } from '../lib/rewards/types';
import type { UserRankInfo } from '../lib/ranks/types';
import { RANK_TIERS } from '../lib/ranks/config';

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

export default function Rewards() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { refreshRewards, refreshRank } = useRewards();
  const [rewardsSummary, setRewardsSummary] = useState<RewardsSummary | null>(null);
  const [rankInfo, setRankInfo] = useState<UserRankInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [redeemingReward, setRedeemingReward] = useState<RewardType | null>(null);
  const [upgradingRank, setUpgradingRank] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/signin?returnUrl=/rewards');
      return;
    }

    if (user) {
      fetchRewards();
    }
  }, [user, authLoading, router]);

  const fetchRewards = async () => {
    try {
      const [rewardsResponse, rankResponse] = await Promise.all([
        fetch('/api/rewards'),
        fetch('/api/ranks'),
      ]);
      const rewardsData = await rewardsResponse.json();

      if (rewardsResponse.ok) {
        setRewardsSummary(parseRewardsSummary(rewardsData));
      } else {
        console.error('Failed to fetch rewards summary:', rewardsData.message || rewardsData);
      }

      if (rankResponse.ok) {
        const rankData = await rankResponse.json();
        setRankInfo(rankData);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
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
        headers: { 'Content-Type': 'application/json' },
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

  const handleUpgradeRank = async () => {
    if (!rankInfo?.nextUpgrade) return;
    setError('');
    setSuccess('');
    setUpgradingRank(true);

    try {
      const response = await fetch('/api/ranks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to upgrade rank');
      }

      setRankInfo(data.rankInfo);
      setSuccess(data.message || 'Rank upgraded successfully!');

      if (data.pointsBalance !== undefined && rewardsSummary) {
        setRewardsSummary({ ...rewardsSummary, pointsBalance: data.pointsBalance });
      }

      await Promise.all([refreshRewards(), refreshRank()]);
    } catch (err: any) {
      setError(err.message || 'Failed to upgrade rank');
    } finally {
      setUpgradingRank(false);
    }
  };

  if (authLoading || loading) {
    return (
      <>
        <Head>
          <title>Sushi Rewards - A-Ru Sushi</title>
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
        <title>Sushi Rewards - A-Ru Sushi</title>
        <meta name="description" content="Earn and redeem sushi rewards" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Header />

      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
        padding: '140px 20px 60px'
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h1 style={{ fontSize: '36px', fontWeight: 'bold', color: '#f1d00f', marginBottom: '32px', textAlign: 'center' }}>
            Sushi Rewards
          </h1>

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
            border: '1px solid rgba(241, 208, 15, 0.2)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
            padding: '28px',
            marginBottom: '24px'
          }}>
            <p style={{ fontSize: '14px', color: '#ccc', marginBottom: '20px' }}>
              Earn points whenever you spend and claim free appetizers or house special rolls.
            </p>

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

            {rankInfo && (
              <div style={{
                marginBottom: '20px',
                padding: '16px',
                borderRadius: '10px',
                border: `1px solid ${RANK_TIERS[rankInfo.rank].color}40`,
                background: `${RANK_TIERS[rankInfo.rank].color}10`,
              }}>
                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '16px',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: rankInfo.nextUpgrade ? '14px' : '0',
                }}>
                  <div>
                    <p style={{ color: '#ccc', fontSize: '12px', marginBottom: '4px' }}>Member Rank</p>
                    <p style={{
                      color: RANK_TIERS[rankInfo.rank].color,
                      fontSize: '22px',
                      fontWeight: '700',
                      margin: 0,
                    }}>
                      {rankInfo.label}
                    </p>
                    {rankInfo.rank !== 'silver' && (
                      <p style={{ color: '#888', fontSize: '11px', marginTop: '2px' }}>
                        Expires {new Date(rankInfo.rankExpiresAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  {rankInfo.discountPercent > 0 && (
                    <div style={{
                      background: 'rgba(252, 54, 120, 0.15)',
                      padding: '8px 14px',
                      borderRadius: '8px',
                      textAlign: 'center',
                    }}>
                      <p style={{ color: '#fc3678', fontSize: '18px', fontWeight: '700', margin: 0 }}>
                        {rankInfo.discountPercent}% OFF
                      </p>
                      <p style={{ color: '#ccc', fontSize: '11px', margin: '2px 0 0' }}>every order</p>
                    </div>
                  )}
                </div>

                {rankInfo.nextUpgrade && (
                  <div style={{
                    padding: '12px',
                    borderRadius: '8px',
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '12px',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}>
                    <div>
                      <p style={{ color: '#fff', fontSize: '14px', fontWeight: '600', marginBottom: '2px' }}>
                        Upgrade to {rankInfo.nextUpgrade.label}
                      </p>
                      <p style={{ color: '#f1d00f', fontSize: '13px', fontWeight: '600' }}>
                        Cost: {rankInfo.nextUpgrade.cost} sushi points
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={
                        upgradingRank ||
                        (rewardsSummary?.pointsBalance ?? 0) < rankInfo.nextUpgrade.cost
                      }
                      onClick={handleUpgradeRank}
                      style={{
                        padding: '10px 18px',
                        borderRadius: '8px',
                        border: 'none',
                        background:
                          (rewardsSummary?.pointsBalance ?? 0) >= rankInfo.nextUpgrade.cost
                            ? '#fc3678'
                            : 'rgba(252, 54, 120, 0.35)',
                        color: '#fff',
                        fontSize: '13px',
                        fontWeight: '600',
                        cursor:
                          (rewardsSummary?.pointsBalance ?? 0) >= rankInfo.nextUpgrade.cost && !upgradingRank
                            ? 'pointer'
                            : 'not-allowed',
                      }}
                    >
                      {upgradingRank
                        ? 'Upgrading...'
                        : (rewardsSummary?.pointsBalance ?? 0) >= rankInfo.nextUpgrade.cost
                        ? 'Upgrade Now'
                        : 'Not enough points'}
                    </button>
                  </div>
                )}

                <div style={{ marginTop: '10px', textAlign: 'center' }}>
                  <Link href="/members" style={{ color: '#f1d00f', fontSize: '12px', textDecoration: 'underline' }}>
                    View all membership tiers
                  </Link>
                </div>
              </div>
            )}

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
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
}
