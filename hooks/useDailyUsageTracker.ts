import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import * as SecureStore from 'expo-secure-store';
import { useCallback, useEffect, useState } from 'react';

interface DailyUsage {
  date: string;
  count: number;
}

interface UsageTracker {
  canUse: boolean;
  usageCount: number;
  remainingUses: number;
  isLoading: boolean;
  incrementUsage: () => Promise<void>;
  resetUsage: () => Promise<void>;
}

export const useDailyUsageTracker = (
  featureKey: string,
  dailyLimit: number = 10
): UsageTracker => {
  const { user } = useAuth();
  const { isPremium } = useSubscription();
  const [usage, setUsage] = useState<DailyUsage | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const getStorageKey = useCallback(() => {
    // Use user ID if available, otherwise use device-level tracking
    const userKey = user?.id || 'anonymous';
    return `daily_usage_${featureKey}_${userKey}`;
  }, [featureKey, user?.id]);

  const getTodayString = useCallback(() => {
    return new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
  }, []);

  const loadUsage = useCallback(async () => {
    try {
      setIsLoading(true);
      const storageKey = getStorageKey();
      const storedUsage = await SecureStore.getItemAsync(storageKey);
      const today = getTodayString();

      if (storedUsage) {
        const parsedUsage: DailyUsage = JSON.parse(storedUsage);
        
        // Check if stored usage is from today
        if (parsedUsage.date === today) {
          setUsage(parsedUsage);
        } else {
          // Reset usage for new day
          const newUsage: DailyUsage = { date: today, count: 0 };
          setUsage(newUsage);
          await SecureStore.setItemAsync(storageKey, JSON.stringify(newUsage));
        }
      } else {
        // First time usage
        const newUsage: DailyUsage = { date: today, count: 0 };
        setUsage(newUsage);
        await SecureStore.setItemAsync(storageKey, JSON.stringify(newUsage));
      }
    } catch (error) {
      console.error('Error loading usage:', error);
      // Fallback to allow usage if storage fails
      setUsage({ date: getTodayString(), count: 0 });
    } finally {
      setIsLoading(false);
    }
  }, [getStorageKey, getTodayString]);

  const incrementUsage = useCallback(async () => {
    if (!usage) return;

    try {
      const newUsage: DailyUsage = {
        date: usage.date,
        count: usage.count + 1
      };
      
      setUsage(newUsage);
      const storageKey = getStorageKey();
      await SecureStore.setItemAsync(storageKey, JSON.stringify(newUsage));
    } catch (error) {
      console.error('Error incrementing usage:', error);
    }
  }, [usage, getStorageKey]);

  const resetUsage = useCallback(async () => {
    try {
      const today = getTodayString();
      const newUsage: DailyUsage = { date: today, count: 0 };
      
      setUsage(newUsage);
      const storageKey = getStorageKey();
      await SecureStore.setItemAsync(storageKey, JSON.stringify(newUsage));
    } catch (error) {
      console.error('Error resetting usage:', error);
    }
  }, [getStorageKey, getTodayString]);

  // Load usage on mount and when user changes
  useEffect(() => {
    loadUsage();
  }, [loadUsage]);

  // Calculate derived values
  const usageCount = usage?.count || 0;
  const remainingUses = Math.max(0, dailyLimit - usageCount);
  
  // Premium users have unlimited usage
  const canUse = isPremium || usageCount < dailyLimit;

  return {
    canUse,
    usageCount,
    remainingUses,
    isLoading,
    incrementUsage,
    resetUsage,
  };
}; 