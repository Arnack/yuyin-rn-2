import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { SubscriptionContextValue, SubscriptionPlan, UserSubscription } from '@/types/subscription'
import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { Alert, Platform } from 'react-native'
import {
    endConnection,
    finishTransaction,
    getAvailablePurchases,
    getSubscriptions,
    initConnection,
    ProductPurchase,
    purchaseErrorListener,
    purchaseUpdatedListener,
    requestSubscription,
    SubscriptionPurchase
} from 'react-native-iap'

// Define your subscription plans
const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'basic_monthly',
    name: 'Premium Monthly',
    description: 'Access to all premium features',
    price: '$9.99',
    currency: 'USD',
    duration: 'monthly',
    features: [
      'Unlimited practice sessions',
      'Advanced tone recognition',
      'Personalized feedback',
      'Offline mode',
      'Progress tracking'
    ],
    productId: Platform.OS === 'ios' ? 'com.yuyin.premium.monthly' : 'premium_monthly'
  },
  {
    id: 'basic_yearly',
    name: 'Premium Yearly',
    description: 'Best value - Save 40%!',
    price: '$59.99',
    currency: 'USD',
    duration: 'yearly',
    features: [
      'All Monthly features',
      'Priority support',
      'Exclusive content',
      'Achievement badges'
    ],
    productId: Platform.OS === 'ios' ? 'com.yuyin.premium.yearly' : 'premium_yearly',
    isPopular: true
  }
]

const SubscriptionContext = createContext<SubscriptionContextValue | undefined>(undefined)

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [userSubscription, setUserSubscription] = useState<UserSubscription | null>(null)
  const [availablePlans, setAvailablePlans] = useState<SubscriptionPlan[]>(SUBSCRIPTION_PLANS)
  const [isLoading, setIsLoading] = useState(false)
  const [isPremium, setIsPremium] = useState(false)

  // Initialize IAP connection
  useEffect(() => {
    let purchaseListener: any
    let errorListener: any

    const initIAP = async () => {
      try {
        await initConnection()
        console.log('IAP connection initialized')
        
        // Set up listeners
        purchaseListener = purchaseUpdatedListener(async (purchase: SubscriptionPurchase | ProductPurchase) => {
          console.log('Purchase updated:', purchase)
          await handlePurchaseUpdate(purchase)
        })
        
        errorListener = purchaseErrorListener((error: any) => {
          console.log('Purchase error:', error)
          Alert.alert('Purchase Error', error.message || 'Failed to complete purchase')
        })
        
        // Check current subscription status
        await checkSubscriptionStatus()
      } catch (error) {
        console.error('Failed to initialize IAP:', error)
      }
    }

    initIAP()

    return () => {
      if (purchaseListener) {
        purchaseListener.remove()
      }
      if (errorListener) {
        errorListener.remove()
      }
      endConnection()
    }
  }, [])

  const handlePurchaseUpdate = async (purchase: SubscriptionPurchase | ProductPurchase) => {
    try {
      const isValid = await validatePurchase(purchase)
      
      if (isValid) {
        // Save subscription to Supabase
        await saveSubscriptionToDatabase(purchase)
        
        // Update local state
        await checkSubscriptionStatus()
        
        Alert.alert('Success', 'Subscription activated successfully!')
      }
      
      // Acknowledge the purchase
      await finishTransaction({ purchase, isConsumable: false })
    } catch (error) {
      console.error('Failed to handle purchase:', error)
      Alert.alert('Error', 'Failed to activate subscription')
    }
  }

  const validatePurchase = async (purchase: SubscriptionPurchase | ProductPurchase): Promise<boolean> => {
    try {
      // For production, implement proper server-side validation
      // This is a simplified version for demonstration
      return purchase.transactionReceipt ? true : false
    } catch (error) {
      console.error('Purchase validation failed:', error)
      return false
    }
  }

  const saveSubscriptionToDatabase = async (purchase: SubscriptionPurchase | ProductPurchase) => {
    if (!user) return

    try {
      const plan = availablePlans.find(p => p.productId === purchase.productId)
      if (!plan) return

      const subscriptionData = {
        user_id: user.id,
        plan_id: plan.id,
        status: 'active',
        start_date: new Date().toISOString(),
        end_date: calculateEndDate(plan.duration),
        auto_renew: true,
        platform: Platform.OS,
        original_transaction_id: purchase.transactionId,
        receipt_data: purchase.transactionReceipt,
      }

      const { error } = await supabase
        .from('user_subscriptions')
        .upsert(subscriptionData, {
          onConflict: 'user_id,original_transaction_id'
        })

      if (error) throw error
    } catch (error) {
      console.error('Failed to save subscription:', error)
      throw error
    }
  }

  const calculateEndDate = (duration: 'monthly' | 'yearly'): string => {
    const now = new Date()
    if (duration === 'monthly') {
      now.setMonth(now.getMonth() + 1)
    } else {
      now.setFullYear(now.getFullYear() + 1)
    }
    return now.toISOString()
  }

  const loadAvailablePlans = useCallback(async () => {
    try {
      setIsLoading(true)
      const productIds = availablePlans.map(plan => plan.productId)
      const subscriptions = await getSubscriptions({ skus: productIds })
      
      // Update plans with actual pricing from the store
      const updatedPlans = availablePlans.map(plan => {
        const storeProduct = subscriptions.find(sub => sub.productId === plan.productId)
        return {
          ...plan,
          price: (storeProduct as any)?.localizedPrice || plan.price,
          currency: (storeProduct as any)?.currency || plan.currency
        }
      })
      
      setAvailablePlans(updatedPlans)
    } catch (error) {
      console.error('Failed to load plans:', error)
    } finally {
      setIsLoading(false)
    }
  }, [availablePlans])

  const purchaseSubscription = useCallback(async (planId: string): Promise<boolean> => {
    try {
      setIsLoading(true)
      const plan = availablePlans.find(p => p.id === planId)
      if (!plan) {
        throw new Error('Plan not found')
      }

      const result = await requestSubscription({
        sku: plan.productId,
        ...(Platform.OS === 'android' && {
          subscriptionOffers: [
            {
              sku: plan.productId,
              offerToken: '', // You'll need to implement this for Android
            },
          ],
        }),
      })

      return true
    } catch (error) {
      console.error('Purchase failed:', error)
      Alert.alert('Purchase Failed', 'Unable to complete subscription purchase')
      return false
    } finally {
      setIsLoading(false)
    }
  }, [availablePlans])

  const restorePurchases = useCallback(async () => {
    try {
      setIsLoading(true)
      const purchases = await getAvailablePurchases()
      
      for (const purchase of purchases) {
        await handlePurchaseUpdate(purchase as SubscriptionPurchase)
      }
      
      Alert.alert('Success', 'Purchases restored successfully')
    } catch (error) {
      console.error('Failed to restore purchases:', error)
      Alert.alert('Error', 'Failed to restore purchases')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const cancelSubscription = useCallback(async () => {
    Alert.alert(
      'Cancel Subscription',
      'To cancel your subscription, please go to your device settings:\n\niOS: Settings > Apple ID > Subscriptions\nAndroid: Play Store > Subscriptions',
      [{ text: 'OK' }]
    )
  }, [])

  const checkSubscriptionStatus = useCallback(async () => {
    if (!user) return

    try {
      const { data: subscription, error } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('Failed to check subscription:', error)
        return
      }

      if (subscription) {
        const endDate = new Date(subscription.end_date)
        const now = new Date()
        
        if (endDate > now) {
          setUserSubscription(subscription)
          setIsPremium(true)
        } else {
          // Subscription expired
          setUserSubscription(null)
          setIsPremium(false)
          
          // Update status in database
          await supabase
            .from('user_subscriptions')
            .update({ status: 'expired' })
            .eq('id', subscription.id)
        }
      } else {
        setUserSubscription(null)
        setIsPremium(false)
      }
    } catch (error) {
      console.error('Failed to check subscription status:', error)
    }
  }, [user])

  useEffect(() => {
    if (user) {
      checkSubscriptionStatus()
    }
  }, [user, checkSubscriptionStatus])

  const value: SubscriptionContextValue = {
    userSubscription,
    availablePlans,
    isLoading,
    isPremium,
    loadAvailablePlans,
    purchaseSubscription,
    restorePurchases,
    cancelSubscription,
    checkSubscriptionStatus,
  }

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  )
}

export const useSubscription = () => {
  const context = useContext(SubscriptionContext)
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider')
  }
  return context
} 