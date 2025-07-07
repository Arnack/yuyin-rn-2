import { useSubscription } from '@/contexts/SubscriptionContext';
import { useDailyUsageTracker } from '@/hooks/useDailyUsageTracker';
import { Ionicons } from '@expo/vector-icons';
import { HanziWriter, useHanziWriter } from '@jamsch/react-native-hanzi-writer';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
    Alert,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

// Sample characters for practice
const PRACTICE_CHARACTERS = [
  { char: '你', meaning: 'You', pinyin: 'nǐ' },
  { char: '好', meaning: 'Good', pinyin: 'hǎo' },
  { char: '我', meaning: 'I/Me', pinyin: 'wǒ' },
  { char: '爱', meaning: 'Love', pinyin: 'ài' },
  { char: '中', meaning: 'Middle', pinyin: 'zhōng' },
  { char: '国', meaning: 'Country', pinyin: 'guó' },
  { char: '学', meaning: 'Learn', pinyin: 'xué' },
  { char: '生', meaning: 'Student', pinyin: 'shēng' },
  { char: '水', meaning: 'Water', pinyin: 'shuǐ' },
  { char: '火', meaning: 'Fire', pinyin: 'huǒ' },
];

export default function CharacterWritingScreen() {
  const { isPremium } = useSubscription();
  const usageTracker = useDailyUsageTracker('character-writing', 10);
  const [selectedCharacter, setSelectedCharacter] = useState(PRACTICE_CHARACTERS[0]);
  const [score, setScore] = useState(0);
  const [attempts, setAttempts] = useState(0);

  const writer = useHanziWriter({
    character: selectedCharacter.char,
    // Load character data from CDN
    loader(char) {
      return fetch(
        `https://cdn.jsdelivr.net/npm/hanzi-writer-data@2.0/${char}.json`
      ).then((res) => res.json());
    },
  });

  const quizActive = writer.quiz.useStore((s) => s.active);
  const animatorState = writer.animator.useStore((s) => s.state);

  const handleCharacterSelect = (character: typeof PRACTICE_CHARACTERS[0]) => {
    setSelectedCharacter(character);
    setScore(0);
    setAttempts(0);
  };

  const checkUsageLimit = (): boolean => {
    if (isPremium) {
      return true; // Unlimited for premium users
    }

    if (!usageTracker.canUse) {
      Alert.alert(
        'Daily Limit Reached',
        `You've used your daily limit of 10 character writing sessions. Upgrade to Premium for unlimited practice!`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Upgrade to Premium', onPress: () => router.navigate('/(tabs)/subscription' as any) },
        ]
      );
      return false;
    }

    return true;
  };

  const startQuiz = () => {
    if (!checkUsageLimit()) {
      return;
    }

    const quizOptions = {
      leniency: 1,
      quizStartStrokeNum: 0,
      showHintAfterMisses: 2,
      onComplete({ totalMistakes }: { totalMistakes: number }) {
        setAttempts(prev => prev + 1);
        const newScore = Math.max(0, 100 - (totalMistakes * 10));
        setScore(prev => Math.max(prev, newScore));
        
        // Increment usage count when quiz is completed
        usageTracker.incrementUsage();
        
        Alert.alert(
          'Character Complete!',
          `Great job! You made ${totalMistakes} mistakes.\nScore: ${newScore}/100`,
          [
            { text: 'Try Again', onPress: () => {
              if (checkUsageLimit()) {
                writer.quiz.start(quizOptions);
              }
            }},
            { text: 'Next Character', onPress: () => {
              const currentIndex = PRACTICE_CHARACTERS.findIndex(c => c.char === selectedCharacter.char);
              const nextIndex = (currentIndex + 1) % PRACTICE_CHARACTERS.length;
              setSelectedCharacter(PRACTICE_CHARACTERS[nextIndex]);
            }},
          ]
        );
      },
      onCorrectStroke() {
        // Haptic feedback could be added here
        console.log('Correct stroke!');
      },
      onMistake(strokeData: any) {
        console.log('Mistake made:', strokeData);
      },
    };
    
    writer.quiz.start(quizOptions);
  };

  const animateCharacter = () => {
    if (animatorState === 'playing') {
      writer.animator.cancelAnimation();
    } else {
      writer.animator.animateCharacter({
        delayBetweenStrokes: 800,
        strokeDuration: 800,
        onComplete() {
          console.log('Animation complete!');
        },
      });
    }
  };

  if (usageTracker.isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <Ionicons name="brush" size={32} color="#dc2626" />
          <Text style={styles.title}>Character Writing Practice</Text>
          <Text style={styles.subtitle}>Practice writing Chinese characters</Text>
        </View>

        {/* Usage Status */}
        <View style={styles.usageStatus}>
          <View style={styles.usageInfo}>
            <Ionicons 
              name={isPremium ? "diamond" : "hourglass-outline"} 
              size={20} 
              color={isPremium ? "#10b981" : "#f59e0b"} 
            />
            <Text style={styles.usageText}>
              {isPremium 
                ? "Premium: Unlimited Practice" 
                : `Free: ${usageTracker.remainingUses} practices remaining today`
              }
            </Text>
          </View>
          
          {!isPremium && usageTracker.remainingUses <= 3 && (
            <TouchableOpacity 
              style={styles.upgradeButton}
              onPress={() => router.navigate('/(tabs)/subscription' as any)}
            >
              <Text style={styles.upgradeButtonText}>Upgrade</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Character Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select a Character</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.characterList}>
            {PRACTICE_CHARACTERS.map((char, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.characterCard,
                  selectedCharacter.char === char.char && styles.selectedCharacterCard
                ]}
                onPress={() => handleCharacterSelect(char)}
              >
                <Text style={styles.characterText}>{char.char}</Text>
                <Text style={styles.characterMeaning}>{char.meaning}</Text>
                <Text style={styles.characterPinyin}>{char.pinyin}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Current Character Info */}
        <View style={styles.currentCharacterInfo}>
          <View style={styles.characterDetails}>
            <Text style={styles.currentCharacterText}>{selectedCharacter.char}</Text>
            <View style={styles.characterMeta}>
              <Text style={styles.characterMeaning}>Meaning: {selectedCharacter.meaning}</Text>
              <Text style={styles.characterPinyin}>Pinyin: {selectedCharacter.pinyin}</Text>
            </View>
          </View>
          
          {attempts > 0 && (
            <View style={styles.scoreContainer}>
              <Text style={styles.scoreText}>Best Score: {score}/100</Text>
              <Text style={styles.attemptsText}>Attempts: {attempts}</Text>
            </View>
          )}
        </View>

        {/* HanziWriter Component */}
        <View style={styles.writerContainer}>
          <HanziWriter
            writer={writer}
            loading={
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Loading character...</Text>
              </View>
            }
            error={
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>Error loading character</Text>
                <TouchableOpacity style={styles.retryButton} onPress={writer.refetch}>
                  <Text style={styles.retryButtonText}>Retry</Text>
                </TouchableOpacity>
              </View>
            }
            style={styles.hanziWriter}
          >
            <HanziWriter.GridLines color="#ddd" />
            <HanziWriter.Svg>
              <HanziWriter.Outline color="#ccc" />
              <HanziWriter.Character color="#555" radicalColor="#dc2626" />
              <HanziWriter.QuizStrokes />
              <HanziWriter.QuizMistakeHighlighter
                color="#539bf5"
                strokeDuration={400}
              />
            </HanziWriter.Svg>
          </HanziWriter>
        </View>

        {/* Controls */}
        <View style={styles.controls}>
          <TouchableOpacity
            style={[
              styles.controlButton, 
              styles.primaryButton,
              !usageTracker.canUse && !isPremium && styles.disabledButton
            ]}
            onPress={quizActive ? writer.quiz.stop : startQuiz}
            disabled={!usageTracker.canUse && !isPremium && !quizActive}
          >
            <Ionicons
              name={quizActive ? "stop" : "play"}
              size={20}
              color={(!usageTracker.canUse && !isPremium && !quizActive) ? "#9ca3af" : "#fff"}
            />
            <Text style={[
              styles.primaryButtonText,
              !usageTracker.canUse && !isPremium && !quizActive && styles.disabledButtonText
            ]}>
              {quizActive ? 'Stop Quiz' : 'Start Quiz'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.controlButton, styles.secondaryButton]}
            onPress={animateCharacter}
          >
            <Ionicons
              name={animatorState === 'playing' ? "pause" : "eye"}
              size={20}
              color="#dc2626"
            />
            <Text style={styles.secondaryButtonText}>
              {animatorState === 'playing' ? 'Stop Animation' : 'Show Strokes'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Instructions */}
        <View style={styles.instructions}>
          <Text style={styles.instructionsTitle}>How to Practice:</Text>
          <Text style={styles.instructionText}>
            1. Select a character from the list above
          </Text>
          <Text style={styles.instructionText}>
            2. Tap "Show Strokes" to see the correct stroke order
          </Text>
          <Text style={styles.instructionText}>
            3. Tap "Start Quiz" to begin practicing
          </Text>
          <Text style={styles.instructionText}>
            4. Draw each stroke in the correct order
          </Text>
          {!isPremium && (
            <Text style={styles.instructionText}>
              💡 Free users get 10 practices per day. Upgrade to Premium for unlimited practice!
            </Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 4,
  },
  usageStatus: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  usageInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  usageText: {
    fontSize: 14,
    color: '#374151',
    marginLeft: 8,
    fontWeight: '500',
  },
  upgradeButton: {
    backgroundColor: '#dc2626',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  upgradeButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 12,
  },
  characterList: {
    flexDirection: 'row',
  },
  characterCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginRight: 12,
    alignItems: 'center',
    minWidth: 80,
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  selectedCharacterCard: {
    borderColor: '#dc2626',
    backgroundColor: '#fef2f2',
  },
  characterText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  characterMeaning: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
    textAlign: 'center',
  },
  characterPinyin: {
    fontSize: 11,
    color: '#9ca3af',
    marginTop: 2,
    textAlign: 'center',
  },
  currentCharacterInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  characterDetails: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  currentCharacterText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#1f2937',
    marginRight: 16,
  },
  characterMeta: {
    justifyContent: 'center',
  },
  scoreContainer: {
    alignItems: 'flex-end',
  },
  scoreText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#10b981',
  },
  attemptsText: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  writerContainer: {
    alignItems: 'center',
    padding: 16,
  },
  hanziWriter: {
    alignSelf: 'center',
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
  },
  errorContainer: {
    padding: 40,
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#dc2626',
    marginBottom: 12,
  },
  retryButton: {
    backgroundColor: '#dc2626',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    gap: 12,
  },
  controlButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 8,
  },
  primaryButton: {
    backgroundColor: '#dc2626',
  },
  secondaryButton: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#dc2626',
  },
  disabledButton: {
    backgroundColor: '#e5e7eb',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButtonText: {
    color: '#dc2626',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButtonText: {
    color: '#9ca3af',
  },
  instructions: {
    padding: 16,
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  instructionText: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
    lineHeight: 20,
  },
}); 