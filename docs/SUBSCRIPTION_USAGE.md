# How to Use Subscriptions in Your App

This guide shows you how to integrate and use the subscription system in your YuYin React Native app. It covers practical implementation patterns, code examples, and best practices.

## Table of Contents

1. [Quick Start](#quick-start)
2. [Subscription Context Usage](#subscription-context-usage)
3. [Protecting Premium Features](#protecting-premium-features)
4. [UI Components and Display](#ui-components-and-display)
5. [Common Patterns](#common-patterns)
6. [Best Practices](#best-practices)
7. [Troubleshooting](#troubleshooting)

## Quick Start

### 1. Basic Setup

The subscription system is already integrated into your app. Make sure you have:

```typescript
// Your app is already wrapped with SubscriptionProvider
import { SubscriptionProvider } from '@/contexts/SubscriptionContext'

// In your _layout.tsx
<AuthProvider>
  <SubscriptionProvider>
    {/* Your app content */}
  </SubscriptionProvider>
</AuthProvider>
```

### 2. Check Subscription Status

```typescript
import { useSubscription } from '@/contexts/SubscriptionContext'

function MyComponent() {
  const { isPremium, userSubscription, isLoading } = useSubscription()
  
  if (isLoading) {
    return <LoadingSpinner />
  }
  
  return (
    <View>
      {isPremium ? (
        <Text>✨ Premium User</Text>
      ) : (
        <Text>Free User</Text>
      )}
    </View>
  )
}
```

### 3. Protect Premium Features

```typescript
import { useSubscriptionGuard } from '@/hooks/useSubscriptionGuard'

function PremiumFeature() {
  const { requirePremium } = useSubscriptionGuard()
  
  const handlePremiumAction = () => {
    requirePremium('Advanced Feature', () => {
      // This code only runs if user has premium
      console.log('Opening premium feature...')
    })
  }
  
  return (
    <TouchableOpacity onPress={handlePremiumAction}>
      <Text>Access Premium Feature</Text>
    </TouchableOpacity>
  )
}
```

## Subscription Context Usage

### Available Data and Functions

```typescript
const {
  // Current state
  isPremium,              // boolean - is user premium?
  userSubscription,       // UserSubscription | null - subscription details
  availablePlans,         // SubscriptionPlan[] - available plans
  isLoading,             // boolean - loading state
  
  // Actions
  purchaseSubscription,   // (planId: string) => Promise<boolean>
  restorePurchases,      // () => Promise<void>
  cancelSubscription,    // () => Promise<void>
  loadAvailablePlans,    // () => Promise<void>
  checkSubscriptionStatus // () => Promise<void>
} = useSubscription()
```

### Subscription Data Structure

```typescript
interface UserSubscription {
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
```

### Example: Display Subscription Info

```typescript
function SubscriptionInfo() {
  const { userSubscription, isPremium } = useSubscription()
  
  if (!isPremium || !userSubscription) {
    return <Text>No active subscription</Text>
  }
  
  return (
    <View style={styles.subscriptionCard}>
      <Text style={styles.planName}>
        {userSubscription.planId.replace('_', ' ').toUpperCase()}
      </Text>
      <Text style={styles.status}>
        Status: {userSubscription.status}
      </Text>
      <Text style={styles.expiry}>
        Expires: {new Date(userSubscription.endDate).toLocaleDateString()}
      </Text>
      <Text style={styles.platform}>
        Platform: {userSubscription.platform}
      </Text>
    </View>
  )
}
```

## Protecting Premium Features

### Method 1: Using Subscription Guard (Recommended)

```typescript
import { useSubscriptionGuard } from '@/hooks/useSubscriptionGuard'

function AdvancedPracticeScreen() {
  const { requirePremium, isPremium } = useSubscriptionGuard()
  
  const startAdvancedPractice = () => {
    requirePremium('Advanced Practice Mode', () => {
      // Navigate to advanced practice
      router.push('/advanced-practice')
    })
  }
  
  return (
    <View>
      <TouchableOpacity 
        style={[styles.button, !isPremium && styles.lockedButton]}
        onPress={startAdvancedPractice}
      >
        <Text>{isPremium ? 'Start Advanced Practice' : 'Unlock Premium'}</Text>
      </TouchableOpacity>
    </View>
  )
}
```

### Method 2: Manual Check with Custom Alert

```typescript
function CustomPremiumCheck() {
  const { isPremium, checkPremiumAccess } = useSubscriptionGuard()
  
  const handleFeatureAccess = () => {
    const hasAccess = checkPremiumAccess({
      feature: 'Offline Downloads',
      showAlert: true,
      redirectToSubscription: true
    })
    
    if (hasAccess) {
      // User has premium access
      startDownload()
    }
  }
  
  return (
    <TouchableOpacity onPress={handleFeatureAccess}>
      <Text>Download for Offline Use</Text>
    </TouchableOpacity>
  )
}
```

### Method 3: Conditional Rendering

```typescript
function PracticeScreen() {
  const { isPremium } = useSubscription()
  
  return (
    <View>
      {/* Free features */}
      <BasicPracticeComponent />
      
      {/* Premium features */}
      {isPremium ? (
        <AdvancedPracticeComponent />
      ) : (
        <PremiumUpgradePrompt />
      )}
    </View>
  )
}
```

## UI Components and Display

### Subscription Status Badge

```typescript
function SubscriptionBadge() {
  const { isPremium } = useSubscription()
  
  return (
    <View style={[styles.badge, isPremium ? styles.premiumBadge : styles.freeBadge]}>
      <Text style={styles.badgeText}>
        {isPremium ? '✨ PREMIUM' : '🔓 FREE'}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  premiumBadge: {
    backgroundColor: '#10b981',
  },
  freeBadge: {
    backgroundColor: '#6b7280',
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
})
```

### Premium Feature Card

```typescript
function PremiumFeatureCard({ 
  title, 
  description, 
  onPress, 
  featureName 
}: {
  title: string
  description: string
  onPress: () => void
  featureName: string
}) {
  const { isPremium, requirePremium } = useSubscriptionGuard()
  
  const handlePress = () => {
    requirePremium(featureName, onPress)
  }
  
  return (
    <TouchableOpacity 
      style={[styles.featureCard, !isPremium && styles.lockedCard]}
      onPress={handlePress}
    >
      <View style={styles.featureHeader}>
        <Text style={styles.featureTitle}>{title}</Text>
        {!isPremium && <Text style={styles.premiumLabel}>PREMIUM</Text>}
      </View>
      <Text style={styles.featureDescription}>{description}</Text>
      {!isPremium && (
        <View style={styles.lockOverlay}>
          <Ionicons name="lock-closed" size={24} color="#6b7280" />
        </View>
      )}
    </TouchableOpacity>
  )
}
```

### Subscription Management Button

```typescript
function SubscriptionButton() {
  const { isPremium, userSubscription } = useSubscription()
  const router = useRouter()
  
  const handlePress = () => {
    router.push('/(tabs)/subscription')
  }
  
  return (
    <TouchableOpacity style={styles.subscriptionButton} onPress={handlePress}>
      {isPremium ? (
        <>
          <Ionicons name="diamond" size={20} color="#10b981" />
          <Text style={styles.buttonText}>Manage Subscription</Text>
        </>
      ) : (
        <>
          <Ionicons name="arrow-up" size={20} color="#3b82f6" />
          <Text style={styles.buttonText}>Upgrade to Premium</Text>
        </>
      )}
    </TouchableOpacity>
  )
}
```

## Common Patterns

### 1. Feature Gating in Lists

```typescript
function FeatureList() {
  const { isPremium } = useSubscription()
  
  const features = [
    { name: 'Basic Practice', premium: false },
    { name: 'Advanced Tones', premium: true },
    { name: 'Offline Mode', premium: true },
    { name: 'Progress Tracking', premium: false },
  ]
  
  return (
    <FlatList
      data={features}
      renderItem={({ item }) => (
        <FeatureItem 
          feature={item} 
          isAccessible={!item.premium || isPremium}
        />
      )}
    />
  )
}
```

### 2. Premium Content Loader

```typescript
function PremiumContentLoader({ children }: { children: React.ReactNode }) {
  const { isPremium, isLoading } = useSubscription()
  
  if (isLoading) {
    return <LoadingSpinner />
  }
  
  if (!isPremium) {
    return <PremiumUpgradePrompt />
  }
  
  return <>{children}</>
}

// Usage
<PremiumContentLoader>
  <AdvancedLearningContent />
</PremiumContentLoader>
```

### 3. Subscription-Aware Navigation

```typescript
function NavigationItem({ 
  title, 
  route, 
  isPremiumFeature = false 
}: {
  title: string
  route: string
  isPremiumFeature?: boolean
}) {
  const { isPremium, requirePremium } = useSubscriptionGuard()
  
  const navigate = () => {
    if (isPremiumFeature) {
      requirePremium(title, () => {
        router.push(route)
      })
    } else {
      router.push(route)
    }
  }
  
  return (
    <TouchableOpacity onPress={navigate}>
      <Text>{title}</Text>
      {isPremiumFeature && !isPremium && (
        <Ionicons name="lock-closed" size={16} color="#6b7280" />
      )}
    </TouchableOpacity>
  )
}
```

### 4. Usage Limits for Free Users

```typescript
function PracticeSession() {
  const { isPremium } = useSubscription()
  const [freeUsageCount, setFreeUsageCount] = useState(0)
  const FREE_LIMIT = 5
  
  const startPractice = () => {
    if (!isPremium && freeUsageCount >= FREE_LIMIT) {
      Alert.alert(
        'Limit Reached',
        `You've reached the free limit of ${FREE_LIMIT} sessions. Upgrade to Premium for unlimited access.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Upgrade', onPress: () => router.push('/(tabs)/subscription') }
        ]
      )
      return
    }
    
    // Start practice session
    if (!isPremium) {
      setFreeUsageCount(prev => prev + 1)
    }
  }
  
  return (
    <View>
      {!isPremium && (
        <Text>Free sessions remaining: {FREE_LIMIT - freeUsageCount}</Text>
      )}
      <TouchableOpacity onPress={startPractice}>
        <Text>Start Practice</Text>
      </TouchableOpacity>
    </View>
  )
}
```

## Best Practices

### 1. Graceful Degradation

```typescript
// Good: Graceful degradation
function AudioPlayer({ audioUrl }: { audioUrl: string }) {
  const { isPremium } = useSubscription()
  
  return (
    <View>
      <AudioControls 
        quality={isPremium ? 'high' : 'standard'}
        downloadEnabled={isPremium}
      />
      {!isPremium && (
        <Text style={styles.upgradeHint}>
          Upgrade for HD quality and offline downloads
        </Text>
      )}
    </View>
  )
}

// Bad: Hard blocking
function AudioPlayer({ audioUrl }: { audioUrl: string }) {
  const { isPremium } = useSubscription()
  
  if (!isPremium) {
    return <Text>Premium required</Text>
  }
  
  return <AudioControls />
}
```

### 2. Clear Value Proposition

```typescript
function PremiumPrompt() {
  const benefits = [
    'Unlimited practice sessions',
    'Advanced tone recognition',
    'Offline mode',
    'Progress tracking',
    'Priority support'
  ]
  
  return (
    <View style={styles.promptContainer}>
      <Text style={styles.promptTitle}>Unlock Premium Features</Text>
      {benefits.map((benefit, index) => (
        <View key={index} style={styles.benefitRow}>
          <Ionicons name="checkmark" size={20} color="#10b981" />
          <Text style={styles.benefitText}>{benefit}</Text>
        </View>
      ))}
      <TouchableOpacity 
        style={styles.upgradeButton}
        onPress={() => router.push('/(tabs)/subscription')}
      >
        <Text style={styles.upgradeButtonText}>Upgrade Now</Text>
      </TouchableOpacity>
    </View>
  )
}
```

### 3. Subscription Status Monitoring

```typescript
function App() {
  const { checkSubscriptionStatus } = useSubscription()
  
  useEffect(() => {
    // Check subscription status on app focus
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        checkSubscriptionStatus()
      }
    })
    
    return () => subscription?.remove()
  }, [checkSubscriptionStatus])
  
  return <YourAppContent />
}
```

### 4. Error Handling

```typescript
function SubscriptionManager() {
  const { purchaseSubscription, restorePurchases } = useSubscription()
  const [isProcessing, setIsProcessing] = useState(false)
  
  const handlePurchase = async (planId: string) => {
    setIsProcessing(true)
    try {
      const success = await purchaseSubscription(planId)
      if (success) {
        Alert.alert('Success', 'Subscription activated!')
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to complete purchase. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }
  
  const handleRestore = async () => {
    try {
      await restorePurchases()
    } catch (error) {
      Alert.alert('Error', 'Failed to restore purchases.')
    }
  }
  
  return (
    <View>
      <TouchableOpacity 
        disabled={isProcessing}
        onPress={() => handlePurchase('premium_monthly')}
      >
        <Text>{isProcessing ? 'Processing...' : 'Subscribe'}</Text>
      </TouchableOpacity>
      
      <TouchableOpacity onPress={handleRestore}>
        <Text>Restore Purchases</Text>
      </TouchableOpacity>
    </View>
  )
}
```

### 5. Performance Optimization

```typescript
// Memoize expensive subscription checks
const isPremiumUser = useMemo(() => {
  return userSubscription?.status === 'active' && 
         new Date(userSubscription.endDate) > new Date()
}, [userSubscription])

// Use callback for subscription actions
const handlePremiumAction = useCallback(() => {
  requirePremium('Feature Name', () => {
    // Premium action
  })
}, [requirePremium])
```

## Troubleshooting

### Common Issues

#### 1. Subscription Status Not Updating

```typescript
// Force refresh subscription status
const { checkSubscriptionStatus } = useSubscription()

useEffect(() => {
  // Check on component mount
  checkSubscriptionStatus()
}, [])
```

#### 2. Premium Features Not Unlocking

```typescript
// Debug subscription state
const { userSubscription, isPremium } = useSubscription()

useEffect(() => {
  console.log('Subscription Debug:', {
    userSubscription,
    isPremium,
    isExpired: userSubscription ? new Date(userSubscription.endDate) < new Date() : null
  })
}, [userSubscription, isPremium])
```

#### 3. Purchase Flow Issues

```typescript
// Handle purchase states
const [purchaseState, setPurchaseState] = useState<'idle' | 'processing' | 'success' | 'error'>('idle')

const handlePurchase = async (planId: string) => {
  setPurchaseState('processing')
  try {
    const success = await purchaseSubscription(planId)
    setPurchaseState(success ? 'success' : 'error')
  } catch (error) {
    setPurchaseState('error')
    console.error('Purchase error:', error)
  }
}
```

### Debug Helpers

```typescript
// Development only - Add to your debug screen
function SubscriptionDebugInfo() {
  const { userSubscription, isPremium, availablePlans } = useSubscription()
  
  if (__DEV__) {
    return (
      <View style={{ padding: 20, backgroundColor: '#f0f0f0' }}>
        <Text>Debug Info:</Text>
        <Text>Is Premium: {isPremium ? 'Yes' : 'No'}</Text>
        <Text>Subscription: {JSON.stringify(userSubscription, null, 2)}</Text>
        <Text>Available Plans: {availablePlans.length}</Text>
      </View>
    )
  }
  
  return null
}
```

### Testing Helpers

```typescript
// Test subscription states in development
function DevSubscriptionControls() {
  const { checkSubscriptionStatus } = useSubscription()
  
  if (!__DEV__) return null
  
  return (
    <View>
      <TouchableOpacity onPress={checkSubscriptionStatus}>
        <Text>Force Refresh Subscription</Text>
      </TouchableOpacity>
    </View>
  )
}
```

## Advanced Usage

### Custom Subscription Plans

```typescript
// Add custom plan logic
const customPlans = useMemo(() => {
  return availablePlans.map(plan => ({
    ...plan,
    savings: plan.duration === 'yearly' ? '40%' : null,
    pricePerMonth: plan.duration === 'yearly' 
      ? (parseFloat(plan.price.replace('$', '')) / 12).toFixed(2)
      : plan.price.replace('$', '')
  }))
}, [availablePlans])
```

### Subscription Analytics

```typescript
// Track subscription events
const trackSubscriptionEvent = (eventName: string, properties?: any) => {
  // Your analytics implementation
  console.log('Subscription Event:', eventName, properties)
}

// Usage
useEffect(() => {
  if (isPremium) {
    trackSubscriptionEvent('premium_user_session', {
      planId: userSubscription?.planId,
      platform: userSubscription?.platform
    })
  }
}, [isPremium, userSubscription])
```

This guide provides comprehensive coverage of how to use the subscription system in your app. Remember to test thoroughly and provide a great user experience for both free and premium users! 