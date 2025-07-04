import { useSubscriptionGuard } from '@/hooks/useSubscriptionGuard'
import { Ionicons } from '@expo/vector-icons'
import React from 'react'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'

export default function PremiumFeatureExample() {
  const { isPremium, requirePremium } = useSubscriptionGuard()

  const handleAdvancedFeature = () => {
    requirePremium('Advanced Tone Recognition', () => {
      // This code only runs if user has premium access
      console.log('Opening advanced tone recognition...')
      // Navigate to advanced feature or perform premium action
    })
  }

  const handleOfflineMode = () => {
    requirePremium('Offline Mode', () => {
      // Enable offline mode functionality
      console.log('Enabling offline mode...')
    })
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Practice Features</Text>
      
      {/* Free Feature */}
      <TouchableOpacity style={styles.featureButton}>
        <View style={styles.featureInfo}>
          <Ionicons name="play-circle" size={24} color="#3b82f6" />
          <Text style={styles.featureTitle}>Basic Practice</Text>
          <Text style={styles.featureDescription}>Free for all users</Text>
        </View>
      </TouchableOpacity>

      {/* Premium Feature with Guard */}
      <TouchableOpacity 
        style={[styles.featureButton, styles.premiumButton]} 
        onPress={handleAdvancedFeature}
      >
        <View style={styles.featureInfo}>
          <Ionicons 
            name={isPremium ? "diamond" : "lock-closed"} 
            size={24} 
            color={isPremium ? "#10b981" : "#6b7280"} 
          />
          <Text style={styles.featureTitle}>Advanced Tone Recognition</Text>
          <Text style={styles.featureDescription}>
            {isPremium ? 'Premium Feature' : 'Premium Required'}
          </Text>
        </View>
        {!isPremium && (
          <View style={styles.premiumBadge}>
            <Text style={styles.premiumBadgeText}>PRO</Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Another Premium Feature */}
      <TouchableOpacity 
        style={[styles.featureButton, styles.premiumButton]} 
        onPress={handleOfflineMode}
      >
        <View style={styles.featureInfo}>
          <Ionicons 
            name={isPremium ? "cloud-offline" : "lock-closed"} 
            size={24} 
            color={isPremium ? "#10b981" : "#6b7280"} 
          />
          <Text style={styles.featureTitle}>Offline Mode</Text>
          <Text style={styles.featureDescription}>
            {isPremium ? 'Download for offline use' : 'Premium Required'}
          </Text>
        </View>
        {!isPremium && (
          <View style={styles.premiumBadge}>
            <Text style={styles.premiumBadgeText}>PRO</Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Subscription Status Display */}
      <View style={styles.statusContainer}>
        <Text style={styles.statusText}>
          {isPremium ? '✨ Premium Active' : '🔒 Free Plan'}
        </Text>
        {!isPremium && (
          <Text style={styles.upgradeText}>
            Upgrade to Premium to unlock all features
          </Text>
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#f9fafb',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 20,
  },
  featureButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  premiumButton: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  featureInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginLeft: 12,
  },
  featureDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 8,
  },
  premiumBadge: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  premiumBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  statusContainer: {
    marginTop: 20,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    alignItems: 'center',
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  upgradeText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
}) 