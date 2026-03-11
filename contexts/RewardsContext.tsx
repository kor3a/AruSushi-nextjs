import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from './AuthContext';
import type { RewardRedemption, RewardsSummary } from '../lib/rewards/types';
import type { MemberRank, UserRankInfo } from '../lib/ranks/types';

interface RewardsContextType {
  summary: RewardsSummary | null;
  pointsBalance: number;
  availableRedemptions: RewardRedemption[];
  rankInfo: UserRankInfo | null;
  loading: boolean;
  error: string;
  refreshRewards: () => Promise<void>;
  refreshRank: () => Promise<void>;
}

const RewardsContext = createContext<RewardsContextType>({
  summary: null,
  pointsBalance: 0,
  availableRedemptions: [],
  rankInfo: null,
  loading: false,
  error: '',
  refreshRewards: async () => {},
  refreshRank: async () => {},
});

export function RewardsProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [summary, setSummary] = useState<RewardsSummary | null>(null);
  const [rankInfo, setRankInfo] = useState<UserRankInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const refreshRank = useCallback(async () => {
    if (!user) {
      setRankInfo(null);
      return;
    }

    try {
      const response = await fetch('/api/ranks');
      const data = await response.json();

      if (response.ok) {
        setRankInfo(data);
      }
    } catch {
      // rank fetch is non-critical
    }
  }, [user]);

  const refreshRewards = useCallback(async () => {
    if (!user) {
      setSummary(null);
      setRankInfo(null);
      setError('');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const [rewardsResponse, rankResponse] = await Promise.all([
        fetch('/api/rewards'),
        fetch('/api/ranks'),
      ]);
      const rewardsData = await rewardsResponse.json();

      if (!rewardsResponse.ok) {
        throw new Error(rewardsData.message || 'Failed to fetch rewards');
      }

      setSummary(rewardsData);

      if (rankResponse.ok) {
        const rankData = await rankResponse.json();
        setRankInfo(rankData);
      }
    } catch (fetchError: any) {
      setError(fetchError.message || 'Failed to fetch rewards');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!user) {
      setSummary(null);
      setRankInfo(null);
      setError('');
      setLoading(false);
      return;
    }

    void refreshRewards();
  }, [user, authLoading, refreshRewards]);

  useEffect(() => {
    if (!user) {
      return;
    }

    const handleWindowFocus = () => {
      void refreshRewards();
    };

    window.addEventListener('focus', handleWindowFocus);
    return () => window.removeEventListener('focus', handleWindowFocus);
  }, [user, refreshRewards]);

  useEffect(() => {
    if (!user || authLoading) {
      return;
    }

    void refreshRewards();
  }, [router.asPath, user, authLoading, refreshRewards]);

  return (
    <RewardsContext.Provider
      value={{
        summary,
        pointsBalance: summary?.pointsBalance ?? 0,
        availableRedemptions: summary?.availableRedemptions ?? [],
        rankInfo,
        loading,
        error,
        refreshRewards,
        refreshRank,
      }}
    >
      {children}
    </RewardsContext.Provider>
  );
}

export function useRewards() {
  return useContext(RewardsContext);
}
