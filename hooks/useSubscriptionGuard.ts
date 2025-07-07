import { useAuth } from '@/contexts/AuthContext'
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
  const { user } = useAuth()
  const { isPremium, isLoading } = useSubscription()

  const checkPremiumAccess = useCallback(
    (options: SubscriptionGuardOptions): boolean => {
      if (isLoading) {
        return false
      }

      // If user is not authenticated, require login for premium features
      if (!user) {
        if (options.showAlert !== false) {
          Alert.alert(
            'Login Required',
            `Please log in to access ${options.feature}`,
            [
              {
                text: 'Cancel',
                style: 'cancel',
              },
              {
                text: 'Log In',
                onPress: () => {
                  router.navigate('/(auth)/login' as any)
                },
              },
            ]
          )
        }
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
    [user, isPremium, isLoading]
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