import { SubscriptionPlan } from '@/types/subscription'
import { Ionicons } from '@expo/vector-icons'
import React from 'react'
import {
    ActivityIndicator,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native'

interface SubscriptionPlanCardProps {
  plan: SubscriptionPlan
  isSelected?: boolean
  onSelect: (planId: string) => void
  isLoading?: boolean
}

export default function SubscriptionPlanCard({
  plan,
  isSelected = false,
  onSelect,
  isLoading = false,
}: SubscriptionPlanCardProps) {
  return (
    <TouchableOpacity
      style={[
        styles.card,
        isSelected && styles.selectedCard,
        plan.isPopular && styles.popularCard,
      ]}
      onPress={() => onSelect(plan.id)}
      disabled={isLoading}
    >
      {plan.isPopular && (
        <View style={styles.popularBadge}>
          <Text style={styles.popularBadgeText}>MOST POPULAR</Text>
        </View>
      )}
      
      <View style={styles.header}>
        <Text style={styles.planName}>{plan.name}</Text>
        <Text style={styles.planDescription}>{plan.description}</Text>
      </View>
      
      <View style={styles.priceContainer}>
        <Text style={styles.price}>{plan.price}</Text>
        <Text style={styles.duration}>/{plan.duration}</Text>
      </View>
      
      <View style={styles.featuresContainer}>
        {plan.features.map((feature, index) => (
          <View key={index} style={styles.featureItem}>
            <Ionicons name="checkmark-circle" size={20} color="#10b981" />
            <Text style={styles.featureText}>{feature}</Text>
          </View>
        ))}
      </View>
      
      <TouchableOpacity
        style={[
          styles.selectButton,
          isSelected && styles.selectedButton,
          isLoading && styles.disabledButton,
        ]}
        onPress={() => onSelect(plan.id)}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <Text style={[styles.selectButtonText, isSelected && styles.selectedButtonText]}>
            {isSelected ? 'Selected' : 'Select Plan'}
          </Text>
        )}
      </TouchableOpacity>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  selectedCard: {
    borderColor: '#3b82f6',
    backgroundColor: '#f8faff',
  },
  popularCard: {
    borderColor: '#10b981',
    position: 'relative',
  },
  popularBadge: {
    position: 'absolute',
    top: -8,
    right: 20,
    backgroundColor: '#10b981',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  popularBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  header: {
    marginBottom: 16,
  },
  planName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  planDescription: {
    fontSize: 16,
    color: '#6b7280',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 20,
  },
  price: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  duration: {
    fontSize: 16,
    color: '#6b7280',
    marginLeft: 4,
  },
  featuresContainer: {
    marginBottom: 20,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureText: {
    fontSize: 16,
    color: '#374151',
    marginLeft: 12,
    flex: 1,
  },
  selectButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  selectedButton: {
    backgroundColor: '#10b981',
  },
  disabledButton: {
    backgroundColor: '#9ca3af',
  },
  selectButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  selectedButtonText: {
    color: '#fff',
  },
}) 