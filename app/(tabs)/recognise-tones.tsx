// If you haven't already, run: npx expo install expo-av
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Ionicons } from '@expo/vector-icons';
import { Audio, AVPlaybackSource } from 'expo-av';
import { router } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

const API_URL = 'https://8q3aqjs3v1.execute-api.us-east-2.amazonaws.com/prod/api/';
const { width } = Dimensions.get('window');

// Internationalization
const translations = {
  en: {
    title: 'Tone Recognition',
    subtitle: 'Listen and Identify Chinese Tones',
    startPractice: 'Start Practice',
    replay: 'Replay',
    instruction: 'Select the tone you heard:',
    resultShown: 'Correct answer is shown',
    continue: 'Continue',
    correct: 'Correct',
    total: 'Total',
    accuracy: 'Accuracy',
    errorTitle: 'Error',
    errorMessage: 'There was a problem playing the audio. Please try again.',
    tone1: '1st Tone',
    tone2: '2nd Tone', 
    tone3: '3rd Tone',
    tone4: '4th Tone',
    tone1Desc: 'High Level',
    tone2Desc: 'Rising',
    tone3Desc: 'Dipping',
    tone4Desc: 'Falling'
  },
  zh: {
    title: '声调识别',
    subtitle: '听音识调 · Tone Recognition',
    startPractice: '开始练习',
    replay: '重播',
    instruction: '请选择您听到的声调：',
    resultShown: '正确答案已显示',
    continue: '继续',
    correct: '正确',
    total: '总计',
    accuracy: '准确率',
    errorTitle: '错误',
    errorMessage: '播放音频时出现问题，请重试。',
    tone1: '第一声',
    tone2: '第二声',
    tone3: '第三声', 
    tone4: '第四声',
    tone1Desc: '阴平',
    tone2Desc: '阳平',
    tone3Desc: '上声',
    tone4Desc: '去声'
  }
};

// Chinese tone information with proper marks and descriptions
const getToneData = (t: typeof translations.en) => [
  { 
    number: '1', 
    mark: 'ā', 
    name: t.tone1, 
    description: t.tone1Desc, 
    color: '#E53E3E',
    example: 'mā 妈'
  },
  { 
    number: '2', 
    mark: 'á', 
    name: t.tone2, 
    description: t.tone2Desc, 
    color: '#38A169',
    example: 'má 麻'
  },
  { 
    number: '3', 
    mark: 'ǎ', 
    name: t.tone3, 
    description: t.tone3Desc, 
    color: '#3182CE',
    example: 'mǎ 马'
  },
  { 
    number: '4', 
    mark: 'à', 
    name: t.tone4, 
    description: t.tone4Desc, 
    color: '#805AD5',
    example: 'mà 骂'
  }
];

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
  const soundRef = useRef<Audio.Sound | null>(null);

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

  const playRandomSound = async () => {
    setIsLoading(true);
    setSelectedTone(null);
    setShowResult(false);
    
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
      } catch (error) {
        console.error('Error replaying sound:', error);
      }
    }
  };

  const handleToneSelection = (tone: string) => {
    if (selectedTone) return; // Prevent multiple selections
    
    setSelectedTone(tone);
    setShowResult(true);
    
    const isCorrect = tone === soundInfo.tone;
    setStatistics((prev) => ({
      correct: prev.correct + (isCorrect ? 1 : 0),
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
      return [...baseStyle, { backgroundColor: '#F7FAFC', borderColor: toneInfo?.color }];
    }
    
    // Always use green for correct answers
    if (toneNumber === soundInfo.tone) {
      return [...baseStyle, styles.correctTone];
    }
    
    if (toneNumber === selectedTone && toneNumber !== soundInfo.tone) {
      return [...baseStyle, styles.wrongTone];
    }
    
    return [...baseStyle, styles.fadedTone];
  };

  const getToneButtonTextStyle = (toneNumber: string) => {
    if (!showResult) {
      return styles.toneButtonText;
    }
    
    if (toneNumber === soundInfo.tone || 
        (toneNumber === selectedTone && toneNumber !== soundInfo.tone)) {
      return [styles.toneButtonText, { color: '#FFFFFF' }];
    }
    
    return [styles.toneButtonText, { opacity: 0.5 }];
  };

  const accuracyPercentage = statistics.total > 0 
    ? Math.round((statistics.correct / statistics.total) * 100) 
    : 0;

  return (
    <ThemedView style={styles.container}>
      {/* Top Navigation Bar */}
      <View style={styles.topNav}>
        <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
          <Ionicons name="arrow-back" size={24} color="#4A5568" />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.languageButton} 
          onPress={toggleLanguage}
        >
          <Text style={styles.languageButtonText}>
            {language === 'zh' ? 'EN' : '中文'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Compact Statistics at Top */}
      {statistics.total > 0 && (
        <View style={styles.compactStats}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{statistics.correct}</Text>
            <Text style={styles.statLabel}>{t.correct}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{statistics.total}</Text>
            <Text style={styles.statLabel}>{t.total}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: accuracyPercentage >= 80 ? '#38A169' : '#E53E3E' }]}>
              {accuracyPercentage}%
            </Text>
            <Text style={styles.statLabel}>{t.accuracy}</Text>
          </View>
        </View>
      )}

      {/* Header */}
      <View style={styles.header}>
        <ThemedText type="title" style={styles.title}>{t.title}</ThemedText>
        <ThemedText type="default" style={styles.subtitle}>
          {t.subtitle}
        </ThemedText>
      </View>

      {/* Sound Control Area - Only show Start Practice if no current file */}
      {!currentFile && (
        <View style={styles.soundSection}>
          <TouchableOpacity 
            style={[styles.playButton, isLoading && styles.playButtonDisabled]} 
            onPress={playRandomSound} 
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.playButtonText}>
                {t.startPractice}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* Tone Selection */}
      {currentFile && !isLoading && (
        <View style={styles.tonesSection}>
          <Text style={styles.instructionText}>
            {showResult ? t.resultShown : t.instruction}
          </Text>
          
          <View style={styles.tonesGrid}>
            {toneData.map((tone) => (
              <TouchableOpacity
                key={tone.number}
                style={getToneButtonStyle(tone.number)}
                onPress={() => handleToneSelection(tone.number)}
                disabled={showResult}
              >
                <Text style={[styles.toneMark, { color: tone.color }]}>
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
          </View>
        </View>
      )}

      {/* Bottom Controls - Show replay always when audio is loaded, continue only after answer */}
      {currentFile && !isLoading && (
        <View style={styles.bottomControls}>
          <TouchableOpacity style={styles.replayButton} onPress={replaySound}>
            <View style={styles.replayButtonContent}>
              <Ionicons name="refresh" size={16} color="#4A5568" />
              <Text style={styles.replayButtonText}>{t.replay}</Text>
            </View>
          </TouchableOpacity>
          
          {showResult && (
            <TouchableOpacity 
              style={styles.continueButton} 
              onPress={getNextRound}
            >
              <Text style={styles.continueButtonText}>{t.continue}</Text>
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
    paddingHorizontal: 20,
    paddingTop: 40,
  },
  topNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#F7FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  languageButton: {
    backgroundColor: '#F7FAFC',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  languageButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4A5568',
  },
  compactStats: {
    backgroundColor: '#F7FAFC',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2D3748',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    color: '#718096',
    textTransform: 'uppercase',
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#E2E8F0',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.7,
    textAlign: 'center',
  },
  soundSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  playButton: {
    backgroundColor: '#3182CE',
    borderRadius: 25,
    paddingVertical: 16,
    paddingHorizontal: 40,
    minWidth: 160,
    alignItems: 'center',
  },
  playButtonDisabled: {
    opacity: 0.7,
  },
  playButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  tonesSection: {
    flex: 1,
    alignItems: 'center',
  },
  instructionText: {
    fontSize: 16,
    color: '#4A5568',
    marginBottom: 24,
    textAlign: 'center',
  },
  tonesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 32,
  },
  toneButton: {
    width: (width - 80) / 2,
    aspectRatio: 1,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  toneMark: {
    fontSize: 36,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  toneButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2D3748',
    marginBottom: 4,
  },
  toneDescription: {
    fontSize: 12,
    color: '#718096',
  },
  correctTone: {
    backgroundColor: '#38A169',
    borderColor: '#38A169',
  },
  wrongTone: {
    backgroundColor: '#E53E3E',
    borderColor: '#E53E3E',
  },
  fadedTone: {
    opacity: 0.3,
  },
  bottomControls: {
    flexDirection: 'row',
    gap: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 20,
  },
  replayButton: {
    backgroundColor: '#F7FAFC',
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  replayButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  replayButtonText: {
    color: '#4A5568',
    fontSize: 16,
    fontWeight: '500',
  },
  continueButton: {
    backgroundColor: '#3182CE',
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 