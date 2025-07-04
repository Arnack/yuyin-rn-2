import { useSubscription } from '@/contexts/SubscriptionContext'
import { router } from 'expo-router'
import { useCallback } from 'react'
import { Alert } from 'react-native'

interface SubscriptionGuardOptions {
  feature: string
  showAlert?: boolean
  redirectToSubscription?: boolean
}

export const useSubscriptionGuard = () => {
  const { isPremium, isLoading } = useSubscription()

  const checkPremiumAccess = useCallback(
    (options: SubscriptionGuardOptions): boolean => {
      if (isLoading) {
        return false
      }

      if (isPremium) {
        return true
      }

      if (options.showAlert !== false) {
        Alert.alert(
          'Premium Feature',
          `${options.feature} is a premium feature. Upgrade to Premium to access this feature.`,
          [
            {
              text: 'Cancel',
              style: 'cancel',
            },
            {
              text: 'Upgrade',
              onPress: () => {
                if (options.redirectToSubscription !== false) {
                  router.navigate('/(tabs)/subscription' as any)
                }
              },
            },
          ]
        )
      }

      return false
    },
    [isPremium, isLoading]
  )

  const requirePremium = useCallback(
    (feature: string, callback: () => void) => {
      if (checkPremiumAccess({ feature })) {
        callback()
      }
    },
    [checkPremiumAccess]
  )

  return {
    isPremium,
    isLoading,
    checkPremiumAccess,
    requirePremium,
  }
}

export default useSubscriptionGuard 