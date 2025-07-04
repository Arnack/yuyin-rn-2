export interface SubscriptionPlan {
  id: string
  name: string
  description: string
  price: string
  currency: string
  duration: 'monthly' | 'yearly'
  features: string[]
  productId: string // App Store/Google Play product ID
  isPopular?: boolean
}

export interface UserSubscription {
  id: string
  userId: string
  planId: string
  status: 'active' | 'expired' | 'cancelled' | 'pending'
  startDate: string
  endDate: string
  autoRenew: boolean
  platform: 'ios' | 'android'
  originalTransactionId: string
  receiptData?: string
}

export interface SubscriptionContextValue {
  // State
  userSubscription: UserSubscription | null
  availablePlans: SubscriptionPlan[]
  isLoading: boolean
  isPremium: boolean
  
  // Actions
  loadAvailablePlans: () => Promise<void>
  purchaseSubscription: (planId: string) => Promise<boolean>
  restorePurchases: () => Promise<void>
  cancelSubscription: () => Promise<void>
  checkSubscriptionStatus: () => Promise<void>
} 