import SubscriptionPlanCard from '@/components/SubscriptionPlanCard'
import { useSubscription } from '@/contexts/SubscriptionContext'
import { Ionicons } from '@expo/vector-icons'
import React, { useEffect, useState } from 'react'
import {
    ActivityIndicator,
    Alert,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native'

export default function SubscriptionScreen() {
  const {
    availablePlans,
    userSubscription,
    isPremium,
    isLoading,
    purchaseSubscription,
    restorePurchases,
    cancelSubscription,
    loadAvailablePlans,
    checkSubscriptionStatus,
  } = useSubscription()

  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)
  const [isPurchasing, setIsPurchasing] = useState(false)

  useEffect(() => {
    loadAvailablePlans()
    checkSubscriptionStatus()
  }, [])

  const handlePlanSelect = (planId: string) => {
    setSelectedPlan(planId)
  }

  const handlePurchase = async () => {
    if (!selectedPlan) {
      Alert.alert('Error', 'Please select a plan first')
      return
    }

    setIsPurchasing(true)
    try {
      const success = await purchaseSubscription(selectedPlan)
      if (success) {
        setSelectedPlan(null)
      }
    } catch (error) {
      console.error('Purchase error:', error)
    } finally {
      setIsPurchasing(false)
    }
  }

  const handleRestorePurchases = async () => {
    await restorePurchases()
  }

  const handleCancelSubscription = async () => {
    await cancelSubscription()
  }

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Loading subscription plans...</Text>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Ionicons name="diamond" size={48} color="#3b82f6" />
          <Text style={styles.title}>Upgrade to Premium</Text>
          <Text style={styles.subtitle}>
            Unlock all features and enhance your language learning experience
          </Text>
        </View>

        {isPremium && userSubscription && (
          <View style={styles.currentSubscriptionCard}>
            <View style={styles.currentSubscriptionHeader}>
              <Ionicons name="checkmark-circle" size={24} color="#10b981" />
              <Text style={styles.currentSubscriptionTitle}>Active Subscription</Text>
            </View>
            <Text style={styles.currentSubscriptionText}>
              You have an active {userSubscription.planId} subscription
            </Text>
            <Text style={styles.currentSubscriptionDate}>
              Expires: {new Date(userSubscription.endDate).toLocaleDateString()}
            </Text>
            <TouchableOpacity
              style={styles.manageButton}
              onPress={handleCancelSubscription}
            >
              <Text style={styles.manageButtonText}>Manage Subscription</Text>
            </TouchableOpacity>
          </View>
        )}

        {!isPremium && (
          <>
            <View style={styles.plansContainer}>
              {availablePlans.map((plan) => (
                <SubscriptionPlanCard
                  key={plan.id}
                  plan={plan}
                  isSelected={selectedPlan === plan.id}
                  onSelect={handlePlanSelect}
                  isLoading={isPurchasing}
                />
              ))}
            </View>

            {selectedPlan && (
              <View style={styles.purchaseSection}>
                <TouchableOpacity
                  style={[styles.purchaseButton, isPurchasing && styles.disabledButton]}
                  onPress={handlePurchase}
                  disabled={isPurchasing}
                >
                  {isPurchasing ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.purchaseButtonText}>Subscribe Now</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </>
        )}

        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.restoreButton}
            onPress={handleRestorePurchases}
          >
            <Text style={styles.restoreButtonText}>Restore Purchases</Text>
          </TouchableOpacity>

          <Text style={styles.termsText}>
            By subscribing, you agree to our Terms of Service and Privacy Policy.
            Subscription automatically renews unless cancelled at least 24 hours before
            the end of the current period.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#fff',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: 16,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  currentSubscriptionCard: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#10b981',
  },
  currentSubscriptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  currentSubscriptionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#10b981',
    marginLeft: 8,
  },
  currentSubscriptionText: {
    fontSize: 16,
    color: '#374151',
    marginBottom: 4,
  },
  currentSubscriptionDate: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 16,
  },
  manageButton: {
    backgroundColor: '#f3f4f6',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  manageButtonText: {
    color: '#374151',
    fontSize: 14,
    fontWeight: '500',
  },
  plansContainer: {
    paddingHorizontal: 16,
  },
  purchaseSection: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  purchaseButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
  },
  disabledButton: {
    backgroundColor: '#9ca3af',
  },
  purchaseButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  footer: {
    padding: 24,
    alignItems: 'center',
  },
  restoreButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  restoreButtonText: {
    color: '#3b82f6',
    fontSize: 16,
    fontWeight: '500',
  },
  termsText: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 16,
  },
}) 