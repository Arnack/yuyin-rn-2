// Enhanced Chinese Tone Recognition Screen with improved UI/UX
import { ThemedView } from '@/components/ThemedView';
import { Ionicons } from '@expo/vector-icons';
import { Audio, AVPlaybackSource } from 'expo-av';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

const API_URL = 'https://8q3aqjs3v1.execute-api.us-east-2.amazonaws.com/prod/api/';
const { width, height } = Dimensions.get('window');

// Enhanced theme colors
const colors = {
  primary: '#2563EB',
  primaryLight: '#3B82F6',
  success: '#10B981',
  error: '#EF4444',
  warning: '#F59E0B',
  gray50: '#F9FAFB',
  gray100: '#F3F4F6',
  gray200: '#E5E7EB',
  gray300: '#D1D5DB',
  gray400: '#9CA3AF',
  gray500: '#6B7280',
  gray600: '#4B5563',
  gray700: '#374151',
  gray800: '#1F2937',
  gray900: '#111827',
  white: '#FFFFFF',
  backdrop: 'rgba(0, 0, 0, 0.4)',
};

// Tone colors with better contrast
const toneColors = {
  '1': '#DC2626', // Red-600
  '2': '#059669', // Emerald-600
  '3': '#2563EB', // Blue-600
  '4': '#7C3AED', // Violet-600
};

// Internationalization
const translations = {
  en: {
    title: 'Tone Recognition',
    subtitle: 'Master Chinese Tones Through Practice',
    startPractice: 'Start Practice',
    replay: 'Replay Audio',
    instruction: 'Which tone do you hear?',
    resultShown: 'Answer revealed',
    continue: 'Next',
    correct: 'Correct',
    total: 'Questions',
    accuracy: 'Accuracy',
    errorTitle: 'Audio Error',
    errorMessage: 'Unable to play audio. Please check your connection and try again.',
    tone1: '1st Tone',
    tone2: '2nd Tone', 
    tone3: '3rd Tone',
    tone4: '4th Tone',
    tone1Desc: 'High Level',
    tone2Desc: 'Rising',
    tone3Desc: 'Dipping',
    tone4Desc: 'Falling',
    practiceProgress: 'Accuracy',
    wellDone: 'Well done!',
    keepPracticing: 'Keep practicing!',
    correctAnswer: 'Correct answer:'
  },
  zh: {
    title: '声调识别',
    subtitle: '通过练习掌握中文声调',
    startPractice: '开始练习',
    replay: '重播音频',
    instruction: '请选择您听到的声调',
    resultShown: '答案已显示',
    continue: '下一题',
    correct: '正确',
    total: '题目',
    accuracy: '准确率',
    errorTitle: '音频错误',
    errorMessage: '无法播放音频，请检查网络连接后重试。',
    tone1: '第一声',
    tone2: '第二声',
    tone3: '第三声', 
    tone4: '第四声',
    tone1Desc: '阴平',
    tone2Desc: '阳平',
    tone3Desc: '上声',
    tone4Desc: '去声',
    practiceProgress: '进度',
    wellDone: '做得很好！',
    keepPracticing: '继续练习！',
    correctAnswer: '正确答案：'
  }
};

// Enhanced tone data with visual improvements
const getToneData = (t: typeof translations.en) => [
  { 
    number: '1', 
    mark: 'ā', 
    name: t.tone1, 
    description: t.tone1Desc, 
    color: toneColors['1'],
    example: 'mā 妈',
    icon: '—'
  },
  { 
    number: '2', 
    mark: 'á', 
    name: t.tone2, 
    description: t.tone2Desc, 
    color: toneColors['2'],
    example: 'má 麻',
    icon: '⟋'
  },
  { 
    number: '3', 
    mark: 'ǎ', 
    name: t.tone3, 
    description: t.tone3Desc, 
    color: toneColors['3'],
    example: 'mǎ 马',
    icon: '⌄'
  },
  { 
    number: '4', 
    mark: 'à', 
    name: t.tone4, 
    description: t.tone4Desc, 
    color: toneColors['4'],
    example: 'mà 骂',
    icon: '⟍'
  }
];

// Compact Progress Component
const ProgressBar = ({ progress, color = colors.primary }: { progress: number; color?: string }) => (
  <View style={styles.progressBarContainer}>
    <View style={styles.progressBarBackground}>
      <Animated.View 
        style={[
          styles.progressBarFill, 
          { 
            width: `${progress}%`,
            backgroundColor: color 
          }
        ]} 
      />
    </View>
  </View>
);

export default function RecogniseTonesScreen() {
  const [language, setLanguage] = useState<'en' | 'zh'>('en');
  const [currentFile, setCurrentFile] = useState<string | null>(null);
  const [soundInfo, setSoundInfo] = useState<{ 
    sound: string; 
    tone: string; 
    speaker: string 
  }>({ sound: '', tone: '', speaker: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTone, setSelectedTone] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [statistics, setStatistics] = useState<{ 
    correct: number; 
    total: number 
  }>({ correct: 0, total: 0 });
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  
  const soundRef = useRef<Audio.Sound | null>(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const t = translations[language];
  const toneData = getToneData(t);

  useEffect(() => {
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
    };
  }, []);

  const handleGoBack = () => {
    router.replace('/(tabs)');
  };

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'en' ? 'zh' : 'en');
  };

  const animateTransition = () => {
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 0.3,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const playRandomSound = async () => {
    setIsLoading(true);
    setSelectedTone(null);
    setShowResult(false);
    setIsCorrect(null);
    animateTransition();
    
    try {
      const response = await fetch(API_URL + 'random-sound');
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      
      const data = await response.json();
      const { sound, tone, speaker, url } = data;
      
      setSoundInfo({ sound, tone, speaker });
      setCurrentFile(url);
      
      // Unload previous sound
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
      }
      
      // Create and play new sound
      const { sound: playbackObj } = await Audio.Sound.createAsync(
        { uri: url } as AVPlaybackSource,
        { shouldPlay: true }
      );
      soundRef.current = playbackObj;
      
    } catch (error) {
      console.error('Error playing sound:', error);
      Alert.alert(t.errorTitle, t.errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const replaySound = async () => {
    if (soundRef.current) {
      try {
        await soundRef.current.replayAsync();
        // Haptic feedback
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch (error) {
        console.error('Error replaying sound:', error);
      }
    }
  };

  const handleToneSelection = (tone: string) => {
    if (selectedTone) return; // Prevent multiple selections
    
    setSelectedTone(tone);
    setShowResult(true);
    
    const correct = tone === soundInfo.tone;
    setIsCorrect(correct);
    
    // Enhanced haptic feedback
    if (correct) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
    
    // Button animation
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
    
    setStatistics((prev) => ({
      correct: prev.correct + (correct ? 1 : 0),
      total: prev.total + 1,
    }));
  };

  const getNextRound = () => {
    playRandomSound();
  };

  const getToneButtonStyle = (toneNumber: string) => {
    const toneInfo = toneData.find(t => t.number === toneNumber);
    const baseStyle = [styles.toneButton];
    
    if (!showResult) {
      return [
        ...baseStyle, 
        { 
          backgroundColor: colors.white,
          borderColor: toneInfo?.color,
          shadowColor: toneInfo?.color,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 2,
        }
      ];
    }
    
    // Correct answer styling
    if (toneNumber === soundInfo.tone) {
      return [
        ...baseStyle, 
        { 
          backgroundColor: colors.success,
          borderColor: colors.success,
          shadowColor: colors.success,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 6,
        }
      ];
    }
    
    // Wrong selection styling
    if (toneNumber === selectedTone && toneNumber !== soundInfo.tone) {
      return [
        ...baseStyle, 
        { 
          backgroundColor: colors.error,
          borderColor: colors.error,
          shadowColor: colors.error,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 6,
        }
      ];
    }
    
    // Unselected options
    return [
      ...baseStyle, 
      { 
        backgroundColor: colors.gray100,
        borderColor: colors.gray200,
        opacity: 0.4,
      }
    ];
  };

  const getToneButtonTextStyle = (toneNumber: string) => {
    const baseStyle = styles.toneButtonText;
    
    if (!showResult) {
      return baseStyle;
    }
    
    if (toneNumber === soundInfo.tone || 
        (toneNumber === selectedTone && toneNumber !== soundInfo.tone)) {
      return [baseStyle, { color: colors.white }];
    }
    
    return [baseStyle, { opacity: 0.4 }];
  };

  const accuracyPercentage = statistics.total > 0 
    ? Math.round((statistics.correct / statistics.total) * 100) 
    : 0;

  const getAccuracyColor = () => {
    if (accuracyPercentage >= 80) return colors.success;
    if (accuracyPercentage >= 60) return colors.warning;
    return colors.error;
  };

  const getEncouragementText = () => {
    if (accuracyPercentage >= 80) return t.wellDone;
    return t.keepPracticing;
  };

  const getCorrectToneInfo = () => {
    return toneData.find(tone => tone.number === soundInfo.tone);
  };

  return (
    <ThemedView style={styles.container}>
      {/* Enhanced Status Bar Spacer */}
      <View style={styles.statusBarSpacer} />
      
      {/* Top Navigation Bar */}
      <View style={styles.topNav}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={handleGoBack}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color={colors.gray600} />
        </TouchableOpacity>
        
        <View style={styles.navCenter}>
          <Text style={styles.navTitle}>{t.title}</Text>
        </View>
        
        <TouchableOpacity 
          style={styles.languageButton} 
          onPress={toggleLanguage}
          activeOpacity={0.7}
        >
          <Text style={styles.languageButtonText}>
            {language === 'zh' ? 'EN' : '中'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Compact Progress Panel */}
      {statistics.total > 0 && (
        <View style={styles.compactProgressPanel}>
          <View style={styles.progressInfo}>
            <Text style={styles.progressLabel}>{t.practiceProgress}</Text>
            <Text style={styles.progressStats}>
              {statistics.correct}/{statistics.total} ({accuracyPercentage}%)
            </Text>
          </View>
          <ProgressBar 
            progress={accuracyPercentage} 
            color={getAccuracyColor()} 
          />
        </View>
      )}

      {/* Main Content */}
      <Animated.View style={[styles.mainContent, { opacity: fadeAnim }]}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.subtitle}>{t.subtitle}</Text>
        </View>

        {/* Sound Control Area */}
        {!currentFile && (
          <View style={styles.soundSection}>
            <TouchableOpacity 
              style={[styles.startButton, isLoading && styles.startButtonDisabled]} 
              onPress={playRandomSound} 
              disabled={isLoading}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator color={colors.white} size="small" />
                  <Text style={styles.startButtonText}>Loading...</Text>
                </View>
              ) : (
                <View style={styles.startButtonContent}>
                  <Ionicons name="play-circle" size={24} color={colors.white} />
                  <Text style={styles.startButtonText}>{t.startPractice}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Tone Selection */}
        {currentFile && !isLoading && (
          <View style={styles.tonesSection}>
              {/* Show result section with correct tone */}
            {/* <View style={styles.instructionContainer}>
              {showResult && soundInfo.sound && (
                <View style={styles.resultDisplay}>
                  <Text style={styles.resultLabel}>{t.correctAnswer}</Text>
                  <View style={styles.correctToneDisplay}>
                    <Text style={styles.correctToneMark}>
                      {getCorrectToneInfo()?.mark}
                    </Text>
                    <View style={styles.correctToneInfo}>
                      <Text style={styles.correctToneName}>
                        {getCorrectToneInfo()?.name}
                      </Text>
                      <Text style={styles.correctToneExample}>
                        {soundInfo.sound}
                      </Text>
                    </View>
                  </View>
                </View>
              )}
            </View> */}
            
            <Animated.View style={[styles.tonesGrid, { transform: [{ scale: scaleAnim }] }]}>
              {toneData.map((tone, index) => (
                <TouchableOpacity
                  key={tone.number}
                  style={getToneButtonStyle(tone.number)}
                  onPress={() => handleToneSelection(tone.number)}
                  disabled={showResult}
                  activeOpacity={0.8}
                >
                  <View style={styles.toneIcon}>
                    <Text style={[styles.toneIconText, { color: showResult ? colors.white : tone.color }]}>
                      {tone.icon}
                    </Text>
                  </View>
                  <Text style={[styles.toneMark, getToneButtonTextStyle(tone.number)]}>
                    {tone.mark}
                  </Text>
                  <Text style={getToneButtonTextStyle(tone.number)}>
                    {tone.name}
                  </Text>
                  <Text style={[styles.toneDescription, getToneButtonTextStyle(tone.number)]}>
                    {tone.description}
                  </Text>
                </TouchableOpacity>
              ))}
            </Animated.View>
          </View>
        )}
      </Animated.View>

      {/* Enhanced Bottom Controls */}
      {currentFile && !isLoading && (
        <View style={styles.bottomControls}>
          <TouchableOpacity 
            style={styles.replayButton} 
            onPress={replaySound}
            activeOpacity={0.7}
          >
            <Ionicons name="refresh" size={20} color={colors.primary} />
            <Text style={styles.replayButtonText}>{t.replay}</Text>
          </TouchableOpacity>
          
          {showResult && (
            <TouchableOpacity 
              style={styles.continueButton} 
              onPress={getNextRound}
              activeOpacity={0.8}
            >
              <Text style={styles.continueButtonText}>{t.continue}</Text>
              <Ionicons name="arrow-forward" size={20} color={colors.white} />
            </TouchableOpacity>
          )}
        </View>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray50,
  },
  statusBarSpacer: {
    height: 44,
  },
  topNav: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.gray100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navCenter: {
    flex: 1,
    alignItems: 'center',
  },
  navTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.gray900,
  },
  languageButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  languageButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },
  compactProgressPanel: {
    backgroundColor: colors.white,
    marginHorizontal: 20,
    marginTop: 12,
    borderRadius: 12,
    padding: 16,
    shadowColor: colors.gray900,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray700,
  },
  progressStats: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.gray600,
  },
  progressBarContainer: {
    height: 6,
  },
  progressBarBackground: {
    height: 6,
    backgroundColor: colors.gray200,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  mainContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  subtitle: {
    fontSize: 16,
    color: colors.gray600,
    textAlign: 'center',
    lineHeight: 24,
  },
  soundSection: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  startButton: {
    backgroundColor: colors.primary,
    borderRadius: 28,
    paddingVertical: 16,
    paddingHorizontal: 32,
    minWidth: 200,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  startButtonDisabled: {
    opacity: 0.7,
  },
  startButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  startButtonText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '600',
  },
  tonesSection: {
    flex: 1,
    alignItems: 'center',
  },
  instructionContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  resultDisplay: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 20,
    shadowColor: colors.gray900,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    minWidth: 200,
  },
  resultLabel: {
    fontSize: 14,
    color: colors.gray600,
    marginBottom: 12,
    fontWeight: '500',
  },
  correctToneDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  correctToneMark: {
    fontSize: 40,
    fontWeight: 'bold',
    color: colors.success,
  },
  correctToneInfo: {
    alignItems: 'flex-start',
  },
  correctToneName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.gray900,
    marginBottom: 4,
  },
  correctToneExample: {
    fontSize: 16,
    color: colors.gray600,
    fontStyle: 'italic',
  },
  tonesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 16,
    maxWidth: width - 40,
  },
  toneButton: {
    width: (width - 80) / 2,
    aspectRatio: 0.85,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    paddingVertical: 16,
  },
  toneIcon: {
    marginBottom: 8,
  },
  toneIconText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  toneMark: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
    color: colors.gray900,
  },
  toneButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.gray900,
    marginBottom: 4,
    textAlign: 'center',
  },
  toneDescription: {
    fontSize: 10,
    opacity: 0.8,
    color: colors.gray600,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  bottomControls: {
    flexDirection: 'row',
    gap: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingBottom: 32,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.gray200,
    paddingTop: 20,
  },
  replayButton: {
    backgroundColor: colors.gray100,
    borderRadius: 24,
    paddingVertical: 12,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  replayButtonText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '500',
  },
  continueButton: {
    backgroundColor: colors.primary,
    borderRadius: 24,
    paddingVertical: 12,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  continueButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
});