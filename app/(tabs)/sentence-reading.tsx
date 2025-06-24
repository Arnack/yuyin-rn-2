import { useThemeColor } from '@/hooks/useThemeColor';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

const { width, height } = Dimensions.get('window');
const MAX_RECORDING_TIME = 10;

interface AssessmentResult {
  accuracyScore: number;
  pronunciationScore: number;
  completenessScore: number;
  fluencyScore: number;
  prosodyScore: number;
  words: Array<{
    missingBreak?: boolean;
    incorrenctTone?: boolean;
    word: string;
    accuracyScore: number;
    errorType: string;
    phonemes?: Array<{
      Phoneme: string;
      PronunciationAssessment: {
        AccuracyScore: number;
      };
    }>;
  }>;
}

interface TokenResponse {
  token: string;
  region: string;
}

interface PracticeText {
  zh: string;
  pinyin: string;
  en: string;
}

const difficultyLevels = [
  { key: 'A1', label: 'Simple (A1/A2)', color: '#ef4444' },
  { key: 'B1', label: 'Medium (B1/B2)', color: '#f59e0b' },
  { key: 'C1', label: 'Hard (C1)', color: '#8b5cf6' },
];

export default function SentenceReadingScreen() {
  const router = useRouter();
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  
  const [practiceText, setPracticeText] = useState<PracticeText>({ zh: '', pinyin: '', en: '' });
  const [difficulty, setDifficulty] = useState<string>('A1');
  const [isLoadingText, setIsLoadingText] = useState(false);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customInputText, setCustomInputText] = useState('');
  
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedTime, setRecordedTime] = useState(0);
  const [timeLeft, setTimeLeft] = useState(MAX_RECORDING_TIME);
  
  const [assessmentResult, setAssessmentResult] = useState<AssessmentResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [isPlayingRecording, setIsPlayingRecording] = useState(false);
  const [statistics, setStatistics] = useState({ correct: 0, total: 0 });
  
  // Animation values
  const recordingScale = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const audioElement = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    setupAudio();
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (difficulty !== 'Custom') {
      generatePracticeText(difficulty);
    }
  }, [difficulty]);

  const startRecordingAnimation = () => {
    const scaleAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(recordingScale, {
          toValue: 1.2,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(recordingScale, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ])
    );

    const progressAnimation = Animated.timing(progressAnim, {
      toValue: 1,
      duration: MAX_RECORDING_TIME * 1000,
      useNativeDriver: false,
    });

    scaleAnimation.start();
    progressAnimation.start();
  };

  const stopRecordingAnimation = () => {
    recordingScale.stopAnimation();
    progressAnim.stopAnimation();
    recordingScale.setValue(1);
    progressAnim.setValue(0);
  };

  const stopRecording = useCallback(async () => {
    if (recording) {
      try {
        await recording.stopAndUnloadAsync();
        const uri = recording.getURI();
        setAudioUri(uri);
        setIsRecording(false);
        setRecording(null);
        
        // Stop recording animation
        stopRecordingAnimation();

        if (uri) {
          await assessPronunciation(uri);
        }
      } catch (error) {
        console.error('Error stopping recording:', error);
      }
    }
  }, [recording]);

  useEffect(() => {
    if (isRecording) {
      setTimeLeft(MAX_RECORDING_TIME);
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            stopRecording();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRecording, stopRecording]);

  const setupAudio = async () => {
    try {
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
    } catch (error) {
      console.error('Error setting up audio:', error);
    }
  };

  const generatePracticeText = async (selectedDifficulty: string) => {
    if (!selectedDifficulty || selectedDifficulty === 'Custom') return;
    
    const difficultyContext = {
      'A1': 'basic daily life phrases, simple objects, numbers, basic actions, family members, colors, food',
      'B1': 'opinions, experiences, plans, suggestions, hobbies, work situations, emotions',
      'C1': 'abstract concepts, complex opinions, hypothetical situations, cultural references, idioms'
    };

    // For now, let's use some hardcoded examples since we don't have the OpenAI API in React Native
    const examples = {
      A1: [
        { zh: '这是什么', pinyin: 'zhè shì shénme', en: 'What is this?' },
        { zh: '我很好', pinyin: 'wǒ hěn hǎo', en: 'I am very good' },
        { zh: '谢谢你', pinyin: 'xiè xiè nǐ', en: 'Thank you' },
        { zh: '今天很热', pinyin: 'jīn tiān hěn rè', en: 'Today is very hot' },
        { zh: '我爱你', pinyin: 'wǒ ài nǐ', en: 'I love you' },
      ],
      B1: [
        { zh: '我觉得这很有趣', pinyin: 'wǒ juédé zhè hěn yǒuqù', en: 'I think this is very interesting' },
        { zh: '你能帮我吗', pinyin: 'nǐ néng bāng wǒ ma', en: 'Can you help me?' },
        { zh: '我正在学中文', pinyin: 'wǒ zhèngzài xué zhōngwén', en: 'I am learning Chinese' },
        { zh: '天气真不错', pinyin: 'tiānqì zhēn bùcuò', en: 'The weather is really nice' },
      ],
      C1: [
        { zh: '随着科技的发展', pinyin: 'suízhe kējì de fāzhǎn', en: 'With the development of technology' },
        { zh: '这个问题很复杂', pinyin: 'zhège wèntí hěn fùzá', en: 'This problem is very complex' },
        { zh: '我们需要考虑各种因素', pinyin: 'wǒmen xūyào kǎolǜ gèzhǒng yīnsù', en: 'We need to consider various factors' },
      ]
    };

    try {
      setIsLoadingText(true);
      setError(null);
      
      // Simulate loading time
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const categoryExamples = examples[selectedDifficulty as keyof typeof examples] || examples.A1;
      const randomExample = categoryExamples[Math.floor(Math.random() * categoryExamples.length)];
      
      setPracticeText(randomExample);
      setAssessmentResult(null);
      setAudioUri(null);
    } catch (err) {
      console.error('Error generating text:', err);
      setError('Failed to generate practice text. Please try again.');
    } finally {
      setIsLoadingText(false);
    }
  };

  const generateCustomPracticeText = async (text: string) => {
    try {
      setIsLoadingText(true);
      const response = await fetch('/api/openai-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'user',
              temperature: 0.2,
              content: `Generate the following JSON format: {"zh": "phrase", "pinyin": "pinyin", "en": "translation"}.
              Based on the following text: ${text}`,
            },
          ],
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate practice text');
      }

      const data = await response.json();
      const textData = JSON.parse(data.response);
      
      setPracticeText(textData);
      setAssessmentResult(null);
      setAudioUri(null);
      setShowCustomInput(false);
    } catch (err) {
      console.error('Error generating custom text:', err);
      setError('Failed to generate practice text');
    } finally {
      setIsLoadingText(false);
    }
  };

  const startRecording = async () => {
    try {
      if (recording) {
        await recording.stopAndUnloadAsync();
      }

      setIsRecording(false);
      setAssessmentResult(null);
      setError(null);

      const recordingOptions = Audio.RecordingOptionsPresets.HIGH_QUALITY;

      const newRecording = new Audio.Recording();
      await newRecording.prepareToRecordAsync(recordingOptions);
      await newRecording.startAsync();
      setRecording(newRecording);
      setIsRecording(true);
      
      // Start recording animation
      startRecordingAnimation();

    } catch (error) {
      console.error('Error starting recording:', error);
      Alert.alert('Error', 'Failed to start recording. Please check microphone permissions.');
    }
  };

  const assessPronunciation = async (audioUri: string) => {
    try {
      setIsAnalyzing(true);
      
      // Simulate analysis with mock data for now
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock assessment result
      const mockResult: AssessmentResult = {
        pronunciationScore: 75 + Math.random() * 20,
        accuracyScore: 70 + Math.random() * 25,
        fluencyScore: 80 + Math.random() * 15,
        completenessScore: 85 + Math.random() * 10,
        prosodyScore: 72 + Math.random() * 20,
        words: practiceText.zh.split('').map((char, index) => ({
          word: char,
          accuracyScore: 60 + Math.random() * 35,
          errorType: Math.random() > 0.7 ? 'Mispronunciation' : 'None',
          missingBreak: Math.random() > 0.9,
          incorrenctTone: Math.random() > 0.8,
        })),
      };
      
      setAssessmentResult(mockResult);
      
      // Update statistics
      const overallScore = mockResult.pronunciationScore;
      const isCorrect = overallScore >= 70;
      setStatistics(prev => ({
        correct: prev.correct + (isCorrect ? 1 : 0),
        total: prev.total + 1,
      }));

    } catch (error) {
      console.error('Error assessing pronunciation:', error);
      setError('Failed to analyze pronunciation. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const playRecordedAudio = async () => {
    if (audioUri) {
      try {
        const { sound } = await Audio.Sound.createAsync({ uri: audioUri });
        setIsPlayingRecording(true);
        await sound.playAsync();
        
        sound.setOnPlaybackStatusUpdate((status: any) => {
          if (status.isLoaded && status.didJustFinish) {
            setIsPlayingRecording(false);
            sound.unloadAsync();
          }
        });
      } catch (error) {
        console.error('Error playing recorded audio:', error);
      }
    }
  };

  const playTextToSpeech = async (text: string, rate: number = 1.0) => {
    try {
      // Using Deepgram or another TTS service
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          language: 'zh-CN',
          rate,
        }),
      });

      if (response.ok) {
        const audioBlob = await response.blob();
        // Note: TTS implementation would need to be done through a proper API
        // This is a placeholder for when TTS is properly implemented
        console.log('TTS audio received');
      }
    } catch (error) {
      console.error('Error playing TTS:', error);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#22c55e';
    if (score >= 60) return '#f59e0b';
    return '#ef4444';
  };

  const getWordColor = (word: any) => {
    if (word.errorType !== 'None' || word.incorrenctTone || word.missingBreak) {
      return '#ef4444';
    }
    return '#22c55e';
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };



  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <LinearGradient
        colors={['#4f46e5', '#7c3aed']}
        style={styles.container}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Sentence Reading</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Recording Progress Bar */}
        {isRecording && (
          <View style={styles.recordingProgressContainer}>
            <View style={styles.recordingProgressBar}>
              <Animated.View 
                style={[
                  styles.recordingProgressFill,
                  {
                    width: progressAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0%', '100%'],
                    }),
                  }
                ]}
              />
            </View>
          </View>
        )}

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Difficulty Selection */}
          <View style={styles.difficultyContainer}>
            <View style={styles.difficultyButtons}>
              {difficultyLevels.map((level) => (
                <TouchableOpacity
                  key={level.key}
                  style={[
                    styles.difficultyButton,
                    difficulty === level.key && styles.difficultyButtonActive,
                    { borderColor: level.color }
                  ]}
                  onPress={() => setDifficulty(level.key)}
                >
                  <Text style={[
                    styles.difficultyButtonText,
                    difficulty === level.key && { color: level.color }
                  ]}>
                    {level.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            
            <TouchableOpacity
              style={styles.customInputButton}
              onPress={() => setShowCustomInput(true)}
            >
              <Ionicons name="create" size={20} color="white" />
            </TouchableOpacity>
          </View>

          {/* Practice Text Display */}
          <View style={styles.textContainer}>
            {isLoadingText ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="white" />
                <Text style={styles.loadingText}>Generating practice text...</Text>
              </View>
            ) : practiceText.zh ? (
              <>
                <View style={styles.textWithAudio}>
                  <Text style={styles.chineseText}>{practiceText.zh}</Text>
                  <View style={styles.audioControls}>
                    <TouchableOpacity
                      style={styles.audioButton}
                      onPress={() => playTextToSpeech(practiceText.zh)}
                      disabled={isRecording}
                    >
                      <Ionicons name="volume-high" size={24} color="white" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.audioButton}
                      onPress={() => playTextToSpeech(practiceText.zh, 0.7)}
                      disabled={isRecording}
                    >
                      <Ionicons name="speedometer" size={24} color="white" />
                    </TouchableOpacity>
                  </View>
                </View>
                
                <Text style={styles.pinyinText}>{practiceText.pinyin}</Text>
                <Text style={styles.englishText}>{practiceText.en}</Text>
              </>
            ) : (
              <TouchableOpacity
                style={styles.generateButton}
                onPress={() => generatePracticeText(difficulty)}
              >
                <Text style={styles.generateButtonText}>Generate Practice Text</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Assessment Results */}
          {assessmentResult && (
            <View style={styles.resultsContainer}>
              <Text style={styles.resultsTitle}>Assessment Results</Text>
              
              {/* Score Cards */}
              <View style={styles.scoreCards}>
                <View style={[styles.scoreCard, { borderColor: getScoreColor(assessmentResult.pronunciationScore) }]}>
                  <Text style={styles.scoreLabel}>Overall</Text>
                  <Text style={styles.scoreLabel}>Score</Text>
                  <Text style={[styles.scoreValue, { color: getScoreColor(assessmentResult.pronunciationScore) }]}>
                    {assessmentResult.pronunciationScore.toFixed(1)}
                  </Text>
                </View>
                
                <View style={[styles.scoreCard, { borderColor: getScoreColor(assessmentResult.accuracyScore) }]}>
                  <Text style={styles.scoreLabel}>Accuracy</Text>
                  <Text style={[styles.scoreValue, { color: getScoreColor(assessmentResult.accuracyScore) }]}>
                    {assessmentResult.accuracyScore.toFixed(1)}
                  </Text>
                </View>
                
                <View style={[styles.scoreCard, { borderColor: getScoreColor(assessmentResult.fluencyScore) }]}>
                  <Text style={styles.scoreLabel}>Fluency</Text>
                  <Text style={[styles.scoreValue, { color: getScoreColor(assessmentResult.fluencyScore) }]}>
                    {assessmentResult.fluencyScore.toFixed(1)}
                  </Text>
                </View>

                <View style={[styles.scoreCard, { borderColor: getScoreColor(assessmentResult.prosodyScore) }]}>
                  <Text style={styles.scoreLabel}>Prosody</Text>
                  <Text style={[styles.scoreValue, { color: getScoreColor(assessmentResult.prosodyScore) }]}>
                    {assessmentResult.prosodyScore.toFixed(1)}
                  </Text>
                </View>
              </View>

              {/* Word Analysis */}
              <View style={styles.wordAnalysis}>
                <Text style={styles.wordAnalysisTitle}>Word Analysis</Text>
                <View style={styles.wordsContainer}>
                  {assessmentResult.words.map((word, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[styles.wordButton, { borderColor: getWordColor(word) }]}
                    >
                      <Text style={[styles.wordText, { color: getWordColor(word) }]}>
                        {word.word}
                      </Text>
                      <Text style={styles.wordScore}>
                        {word.accuracyScore.toFixed(0)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Play Recording Button */}
              {audioUri && (
                <TouchableOpacity
                  style={styles.playRecordingButton}
                  onPress={playRecordedAudio}
                >
                  <Ionicons name={isPlayingRecording ? "stop" : "play"} size={20} color="white" />
                  <Text style={styles.playRecordingText}>
                    {isPlayingRecording ? 'Stop' : 'Play Your Recording'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Analysis Loading */}
          {isAnalyzing && (
            <View style={styles.analysisContainer}>
              <ActivityIndicator size="large" color="white" />
              <Text style={styles.analysisText}>Analyzing your pronunciation...</Text>
            </View>
          )}

          {/* Error Display */}
          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}
        </ScrollView>

        {/* Bottom Controls */}
        <View style={styles.bottomControls}>
          <TouchableOpacity
            style={[styles.controlButton, !audioUri && styles.controlButtonDisabled]}
            onPress={playRecordedAudio}
            disabled={!audioUri || isRecording}
          >
            <Ionicons name="play" size={24} color={audioUri && !isRecording ? "white" : "#999"} />
            <Text style={[styles.controlButtonText, { color: audioUri && !isRecording ? "white" : "#999" }]}>
              Play
            </Text>
          </TouchableOpacity>

          <View style={styles.recordButtonContainer}>
            {practiceText.zh && (
              <Animated.View style={[styles.recordButton, { transform: [{ scale: recordingScale }] }]}>
                <TouchableOpacity
                  style={styles.recordButtonInner}
                  onPress={isRecording ? stopRecording : startRecording}
                  disabled={isAnalyzing || !practiceText.zh}
                >
                  <LinearGradient
                    colors={isRecording ? ['#ef4444', '#dc2626'] : ['#22c55e', '#16a34a']}
                    style={styles.recordButtonGradient}
                  >
                    <Ionicons name={isRecording ? "stop" : "mic"} size={32} color="white" />
                  </LinearGradient>
                </TouchableOpacity>
              </Animated.View>
            )}
            {isRecording && (
              <Text style={styles.recordingTime}>{formatTime(timeLeft)}</Text>
            )}
          </View>

          <TouchableOpacity
            style={[styles.controlButton, (!practiceText.zh || isAnalyzing) && styles.controlButtonDisabled]}
            onPress={() => generatePracticeText(difficulty)}
            disabled={!practiceText.zh || isAnalyzing || isLoadingText}
          >
            <Ionicons name="arrow-forward" size={24} color={practiceText.zh && !isAnalyzing && !isLoadingText ? "white" : "#999"} />
            <Text style={[styles.controlButtonText, { color: practiceText.zh && !isAnalyzing && !isLoadingText ? "white" : "#999" }]}>
              Next
            </Text>
          </TouchableOpacity>
        </View>

        {/* Custom Input Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={showCustomInput}
          onRequestClose={() => setShowCustomInput(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Custom Input</Text>
                <TouchableOpacity onPress={() => setShowCustomInput(false)}>
                  <Ionicons name="close" size={24} color="#374151" />
                </TouchableOpacity>
              </View>
              
              <TextInput
                style={styles.customInput}
                value={customInputText}
                onChangeText={setCustomInputText}
                placeholder="Type pinyin, 汉字 or English"
                placeholderTextColor="#9ca3af"
                maxLength={40}
                multiline
              />
              
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.modalSubmitButton}
                  onPress={() => generateCustomPracticeText(customInputText)}
                  disabled={!customInputText.trim()}
                >
                  <Text style={styles.modalSubmitText}>Submit</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </LinearGradient>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
  },
  placeholder: {
    width: 40,
  },
  recordingProgressContainer: {
    paddingHorizontal: 20,
    paddingVertical: 4,
  },
  recordingProgressBar: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  recordingProgressFill: {
    height: '100%',
    backgroundColor: '#22c55e',
    borderRadius: 2,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  difficultyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 20,
  },
  difficultyButtons: {
    flexDirection: 'row',
    flex: 1,
  },
  difficultyButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginRight: 8,
    borderRadius: 20,
    borderWidth: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
  },
  difficultyButtonActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  difficultyButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  customInputButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    alignItems: 'center',
  },
  textWithAudio: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  chineseText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginRight: 16,
  },
  audioControls: {
    flexDirection: 'column',
    gap: 8,
  },
  audioButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pinyinText: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 8,
  },
  englishText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    color: 'white',
    fontSize: 16,
    marginTop: 12,
  },
  generateButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
  },
  generateButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  resultsContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  resultsTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  scoreCards: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  scoreCard: {
    flex: 1,
    marginHorizontal: 2,
    padding: 8,
    borderRadius: 12,
    borderWidth: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
  },
  scoreLabel: {
    color: 'white',
    fontSize: 10,
    textAlign: 'center',
  },
  scoreValue: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 4,
  },
  wordAnalysis: {
    marginBottom: 16,
  },
  wordAnalysisTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  wordsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  wordButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
  },
  wordText: {
    fontSize: 16,
    fontWeight: '500',
  },
  wordScore: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 2,
  },
  playRecordingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
  },
  playRecordingText: {
    color: 'white',
    fontSize: 16,
    marginLeft: 8,
  },
  analysisContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  analysisText: {
    color: 'white',
    fontSize: 16,
    marginTop: 12,
  },
  errorContainer: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  errorText: {
    color: '#fca5a5',
    textAlign: 'center',
  },
  bottomControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    paddingHorizontal: 40,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    paddingTop: 20,
  },
  controlButton: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 60,
  },
  controlButtonDisabled: {
    opacity: 0.5,
  },
  controlButtonText: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 4,
  },
  recordButtonContainer: {
    alignItems: 'center',
  },
  recordButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordButtonInner: {
    borderRadius: 40,
    overflow: 'hidden',
  },
  recordButtonGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },

  recordingTime: {
    color: 'white',
    fontSize: 14,
    marginTop: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    width: width * 0.9,
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
  },
  customInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 20,
  },
  modalButtons: {
    alignItems: 'center',
  },
  modalSubmitButton: {
    backgroundColor: '#4f46e5',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
  },
  modalSubmitText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
}); 