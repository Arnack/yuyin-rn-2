import { ThemedView } from '@/components/ThemedView';
import { LinearGradient } from 'expo-linear-gradient';
import { Link } from 'expo-router';
import React from 'react';
import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.greeting}>你好</Text>
        <Text style={styles.subtitle}>Ready to practice?</Text>
        
        <View style={styles.progressContainer}>
          <View style={styles.circularProgress}>
            <View style={styles.progressRing}>
              <Text style={styles.progressNumber}>8</Text>
              <Text style={styles.progressSubtext}>of 10 today</Text>
            </View>
          </View>
        </View>
        
        <View style={styles.streakBadge}>
          <Text style={styles.streakText}>🔥 7 day streak</Text>
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.activitiesContainer}>
          <Link href="/(tabs)/recognise-tones" asChild>
            <TouchableOpacity style={styles.activityTile}>
              <View style={[styles.activityIcon, { backgroundColor: '#FF6B9D' }]}>
                <Text style={styles.iconEmoji}>👂</Text>
              </View>
              <View style={styles.activityContent}>
                <Text style={styles.activityTitle}>听声辨调</Text>
                <Text style={styles.activitySubtitle}>Tone Recognition</Text>
              </View>
              <View style={styles.progressIndicator}>
                <View style={[styles.progressDot, { backgroundColor: '#FF6B9D' }]} />
              </View>
              <Text style={styles.arrowIcon}>▶</Text>
            </TouchableOpacity>
          </Link>

          <Link href="/(tabs)/speak-tones" asChild>
            <TouchableOpacity style={styles.activityTile}>
              <View style={[styles.activityIcon, { backgroundColor: '#4ECDC4' }]}>
                <Text style={styles.iconEmoji}>🗣️</Text>
              </View>
              <View style={styles.activityContent}>
                <Text style={styles.activityTitle}>开口说话</Text>
                <Text style={styles.activitySubtitle}>Pronunciation</Text>
              </View>
              <View style={styles.progressIndicator}>
                <View style={[styles.progressDot, { backgroundColor: '#4ECDC4' }]} />
              </View>
              <Text style={styles.arrowIcon}>▶</Text>
            </TouchableOpacity>
          </Link>

          <Link href="/(tabs)/sentence-reading" asChild>
            <TouchableOpacity style={styles.activityTile}>
              <View style={[styles.activityIcon, { backgroundColor: '#45B7D1' }]}>
                <Text style={styles.iconEmoji}>📖</Text>
              </View>
              <View style={styles.activityContent}>
                <Text style={styles.activityTitle}>朗读句子</Text>
                <Text style={styles.activitySubtitle}>Sentence Reading</Text>
              </View>
              <View style={styles.progressIndicator}>
                <View style={[styles.progressDot, { backgroundColor: '#45B7D1' }]} />
              </View>
              <Text style={styles.arrowIcon}>▶</Text>
            </TouchableOpacity>
          </Link>
        </View>

        <LinearGradient
          colors={['#9C27B0', '#E91E63']}
          style={styles.todayWinCard}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.winHeader}>
            <Text style={styles.winIcon}>⭐</Text>
            <Text style={styles.winTitle}>Today's Win</Text>
          </View>
          <Text style={styles.winAccuracy}>87% accuracy</Text>
          <Text style={styles.winSubtext}>Your best score this week!</Text>
        </LinearGradient>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  header: {
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
  },
  greeting: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#7F8C8D',
    marginBottom: 30,
  },
  progressContainer: {
    marginBottom: 20,
  },
  circularProgress: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 8,
    borderColor: '#FFE0E6',
  },
  progressRing: {
    alignItems: 'center',
  },
  progressNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  progressSubtext: {
    fontSize: 12,
    color: '#7F8C8D',
    marginTop: 2,
  },
  streakBadge: {
    backgroundColor: '#FF6B35',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  streakText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  activitiesContainer: {
    marginBottom: 20,
  },
  activityTile: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  activityIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  iconEmoji: {
    fontSize: 24,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 2,
  },
  activitySubtitle: {
    fontSize: 14,
    color: '#7F8C8D',
  },
  progressIndicator: {
    marginRight: 12,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  arrowIcon: {
    fontSize: 16,
    color: '#BDC3C7',
  },
  todayWinCard: {
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
  },
  winHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  winIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  winTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  winAccuracy: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  winSubtext: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
  },
});

