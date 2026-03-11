import Head from 'next/head';
import { useAuth } from '../contexts/AuthContext';
import { useRewards } from '../contexts/RewardsContext';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { RANK_ORDER, RANK_TIERS } from '../lib/ranks/config';
import type { MemberRank } from '../lib/ranks/types';
import { FaCrown, FaGem, FaStar, FaMedal, FaCheck } from 'react-icons/fa';
import type { ReactElement } from 'react';

const RANK_ICONS: Record<MemberRank, ReactElement> = {
  silver: <FaMedal size={32} />,
  rose_gold: <FaStar size={32} />,
  platinum: <FaCrown size={32} />,
  diamond: <FaGem size={32} />,
};

export default function Members() {
  const { user } = useAuth();
  const { rankInfo, loading } = useRewards();

  const currentRankIdx = rankInfo
    ? RANK_ORDER.indexOf(rankInfo.rank)
    : 0;

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
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h1 style={{
            fontSize: '36px',
            fontWeight: 'bold',
            color: '#f1d00f',
            marginBottom: '12px',
            textAlign: 'center',
          }}>
            Membership Tiers
          </h1>
          <p style={{
            color: '#ccc',
            textAlign: 'center',
            fontSize: '16px',
            marginBottom: '40px',
            maxWidth: '600px',
            margin: '0 auto 40px',
          }}>
            Unlock exclusive benefits by ranking up with your sushi points. Your rank lasts 1 year from the date of upgrade.
          </p>

          {user && rankInfo && !loading && (
            <div style={{
              textAlign: 'center',
              padding: '16px 24px',
              background: 'rgba(241, 208, 15, 0.08)',
              border: '1px solid rgba(241, 208, 15, 0.25)',
              borderRadius: '12px',
              maxWidth: '500px',
              margin: '0 auto 32px',
            }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '32px' }}>
                <div style={{
                  padding: '16px 24px',
                  background: 'rgba(241, 208, 15, 0.08)',
                  border: '1px solid rgba(241, 208, 15, 0.25)',
                  borderRadius: '12px',
                }}>
                  <p style={{ color: '#ccc', fontSize: '13px', marginBottom: '4px' }}>Your Current Rank</p>
                  <p style={{
                    color: RANK_TIERS[rankInfo.rank].color,
                    fontSize: '22px',
                    fontWeight: '700',
                    margin: 0,
                  }}>
                    {rankInfo.label}
                  </p>
                  <p style={{ color: '#888', fontSize: '12px', marginTop: '4px' }}>
                    Expires {new Date(rankInfo.rankExpiresAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '20px',
          }}>
            {RANK_ORDER.map((rankKey, idx) => {
              const tier = RANK_TIERS[rankKey];
              const isCurrentRank = rankInfo?.rank === rankKey;
              const isAchieved = currentRankIdx >= idx;

              return (
                <div
                  key={rankKey}
                  style={{
                    background: isCurrentRank
                      ? 'rgba(255, 255, 255, 0.08)'
                      : 'rgba(255, 255, 255, 0.03)',
                    borderRadius: '16px',
                    border: isCurrentRank
                      ? `2px solid ${tier.color}`
                      : '1px solid rgba(255, 255, 255, 0.1)',
                    overflow: 'hidden',
                    transition: 'transform 0.3s, box-shadow 0.3s',
                    position: 'relative',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = `0 12px 40px rgba(0, 0, 0, 0.4)`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  {isCurrentRank && (
                    <div style={{
                      position: 'absolute',
                      top: '12px',
                      right: '12px',
                      background: tier.color,
                      color: '#1a1a1a',
                      padding: '4px 10px',
                      borderRadius: '999px',
                      fontSize: '11px',
                      fontWeight: '700',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                    }}>
                      Current
                    </div>
                  )}

                  <div style={{
                    background: tier.bgGradient,
                    padding: '28px 20px',
                    textAlign: 'center',
                  }}>
                    <div style={{
                      color: '#1a1a1a',
                      marginBottom: '8px',
                      opacity: 0.8,
                    }}>
                      {RANK_ICONS[rankKey]}
                    </div>
                    <h2 style={{
                      fontSize: '22px',
                      fontWeight: '700',
                      color: '#1a1a1a',
                      margin: 0,
                    }}>
                      {tier.label}
                    </h2>
                  </div>

                  <div style={{ padding: '20px' }}>
                    {tier.upgradeCost !== null && (
                      <div style={{
                        textAlign: 'center',
                        marginBottom: '16px',
                        padding: '8px',
                        background: 'rgba(241, 208, 15, 0.08)',
                        borderRadius: '8px',
                        border: '1px solid rgba(241, 208, 15, 0.15)',
                      }}>
                        <p style={{ color: '#f1d00f', fontSize: '13px', fontWeight: '600', margin: 0 }}>
                          {tier.upgradeCost} sushi points to unlock
                        </p>
                      </div>
                    )}

                    {tier.discountPercent > 0 && (
                      <div style={{
                        textAlign: 'center',
                        marginBottom: '16px',
                        padding: '10px',
                        background: 'rgba(252, 54, 120, 0.1)',
                        borderRadius: '8px',
                        border: '1px solid rgba(252, 54, 120, 0.2)',
                      }}>
                        <p style={{
                          color: '#fc3678',
                          fontSize: '20px',
                          fontWeight: '700',
                          margin: 0,
                        }}>
                          {tier.discountPercent}% OFF
                        </p>
                        <p style={{ color: '#ccc', fontSize: '12px', margin: '2px 0 0' }}>
                          every order
                        </p>
                      </div>
                    )}

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {tier.benefits.map((benefit, bIdx) => (
                        <div key={bIdx} style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '8px',
                        }}>
                          <FaCheck
                            size={12}
                            style={{
                              color: tier.color,
                              flexShrink: 0,
                              marginTop: '3px',
                            }}
                          />
                          <span style={{
                            color: '#ccc',
                            fontSize: '13px',
                            lineHeight: '1.4',
                          }}>
                            {benefit}
                          </span>
                        </div>
                      ))}
                    </div>

                    {!user && tier.rank === 'silver' && (
                      <div style={{
                        marginTop: '16px',
                        textAlign: 'center',
                      }}>
                        <a
                          href="/auth/signup"
                          style={{
                            display: 'inline-block',
                            padding: '10px 20px',
                            background: '#fc3678',
                            color: '#fff',
                            borderRadius: '8px',
                            textDecoration: 'none',
                            fontSize: '13px',
                            fontWeight: '600',
                          }}
                        >
                          Sign Up Free
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{
            marginTop: '40px',
            textAlign: 'center',
            padding: '24px',
            background: 'rgba(255, 255, 255, 0.03)',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
          }}>
            <h3 style={{ color: '#f1d00f', fontSize: '18px', marginBottom: '8px' }}>
              How It Works
            </h3>
            <p style={{ color: '#ccc', fontSize: '14px', maxWidth: '600px', margin: '0 auto', lineHeight: '1.6' }}>
              Start as a Silver member when you sign up. Earn sushi points on every order
              and spend them to unlock higher tiers. Each rank lasts 1 year from the
              date you upgrade, then resets to Silver.
            </p>
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
}
