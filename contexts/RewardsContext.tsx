import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from './AuthContext';
import type { RewardRedemption, RewardsSummary } from '../lib/rewards/types';

interface RewardsContextType {
  summary: RewardsSummary | null;
  pointsBalance: number;
  availableRedemptions: RewardRedemption[];
  loading: boolean;
  error: string;
  refreshRewards: () => Promise<void>;
}

const RewardsContext = createContext<RewardsContextType>({
  summary: null,
  pointsBalance: 0,
  availableRedemptions: [],
  loading: false,
  error: '',
  refreshRewards: async () => {},
});

export function RewardsProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [summary, setSummary] = useState<RewardsSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const refreshRewards = useCallback(async () => {
    if (!user) {
      setSummary(null);
      setError('');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/rewards');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch rewards');
      }

      setSummary(data);
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
        loading,
        error,
        refreshRewards,
      }}
    >
      {children}
    </RewardsContext.Provider>
  );
}

export function useRewards() {
  return useContext(RewardsContext);
}
