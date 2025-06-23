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
  Image,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Circle, Svg } from 'react-native-svg';

const { width, height } = Dimensions.get('window');
const api_url = 'https://8q3aqjs3v1.execute-api.us-east-2.amazonaws.com/prod/api/';
const MAX_RECORDING_TIME = 2;
const TIMEOUT_RECORDING = 0.4;

// Pinyin conversion helper (simplified version)
const convertToPinyin = (sound: string, tone: number): string => {
  // This would need a proper pinyin conversion library in production
  const toneMarks = ['', 'ā', 'á', 'ǎ', 'à'];
  return sound + (toneMarks[tone] || '');
};

interface SoundInfo {
  sound: string;
  tone: string;
  speaker: string;
}

export default function SpeakTonesScreen() {
  const router = useRouter();
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  
  const [currentFile, setCurrentFile] = useState<string | null>(null);
  const [soundInfo, setSoundInfo] = useState<SoundInfo>({ sound: '', tone: '', speaker: '' });
  const [isPlaying, setIsPlaying] = useState(false);
  const [soundBlob, setSoundBlob] = useState<string | null>(null);
  
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedTime, setRecordedTime] = useState(0);
  const [spectrumImage, setSpectrumImage] = useState<string | null>(null);
  const [prediction, setPrediction] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [spectrumLoading, setSpectrumLoading] = useState(false);
  
  const [modelType] = useState('Ensemble');
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  
  // Animation values
  const recordingScale = useRef(new Animated.Value(1)).current;
  const recordingOpacity = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    setupAudio();
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, []);

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

  const playRandomSound = async () => {
    try {
      setIsPlaying(true);
      setSpectrumImage(null);
      setPrediction(null);
      setSoundBlob(null);
      setAudioUri(null);
      setLoading(true);

      const response = await fetch(api_url + 'random-sound');
      if (!response.ok) throw new Error('Network response was not ok');
      
      const data = await response.json();
      const { sound: soundChar, tone, speaker, url } = data;
      
      setSoundInfo({ sound: soundChar, tone, speaker });
      setCurrentFile(url);

      // Download and play audio
      if (sound) {
        await sound.unloadAsync();
      }
      const { sound: audioSound } = await Audio.Sound.createAsync({ uri: url });
      setSound(audioSound);
      await audioSound.playAsync();

      // Download audio for spectrum analysis
      setSoundBlob(url);
      
    } catch (error) {
      console.error('Error fetching or playing sound:', error);
      Alert.alert('Error', 'Failed to load audio. Please check your internet connection.');
    } finally {
      setLoading(false);
      setIsPlaying(false);
    }
  };

  const replaySound = async () => {
    if (sound) {
      try {
        await sound.setPositionAsync(0);
        await sound.playAsync();
        
        if (soundBlob) {
          fetchSpectrum(soundBlob);
        }
      } catch (error) {
        console.error('Error replaying audio:', error);
      }
    }
  };

  const startRecording = async () => {
    try {
      if (recording) {
        await recording.stopAndUnloadAsync();
      }

      setIsRecording(false);
      setRecordedTime(0);
      setSpectrumImage(null);
      setPrediction(null);

      const recordingOptions = Audio.RecordingOptionsPresets.HIGH_QUALITY;

      setTimeout(async () => {
        try {
          const newRecording = new Audio.Recording();
          await newRecording.prepareToRecordAsync(recordingOptions);
          await newRecording.startAsync();
          setRecording(newRecording);
          setIsRecording(true);
          
          // Start recording animation
          startRecordingAnimation();
        } catch (error) {
          console.error('Error in timeout recording:', error);
          Alert.alert('Error', 'Failed to start recording. Please check microphone permissions.');
        }
      }, TIMEOUT_RECORDING * 1000);

    } catch (error) {
      console.error('Error starting recording:', error);
      Alert.alert('Error', 'Failed to start recording. Please check microphone permissions.');
    }
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
          await fetchSpectrum(uri);
        }
      } catch (error) {
        console.error('Error stopping recording:', error);
      }
    }
  }, [recording]);

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

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordedTime((prevTime) => {
          if (prevTime >= MAX_RECORDING_TIME) {
            stopRecording();
            return prevTime;
          }
          return prevTime + 0.1;
        });
      }, 100);
    }

    return () => clearInterval(interval);
  }, [isRecording, stopRecording]);

  const fetchSpectrum = async (audioData: string) => {
    try {
      setSpectrumLoading(true);
      
      const formData = new FormData();
      formData.append('audio', {
        uri: audioData,
        type: 'audio/wav',
        name: 'recording.wav',
      } as any);
      formData.append('model_type', modelType);

      const response = await fetch(api_url + "get_spectrum", {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSpectrumImage(data.spectrum);
        setPrediction(data.prediction);
      } else {
        console.error('Failed to fetch spectrum data.');
        Alert.alert('Error', 'Failed to analyze audio');
      }
    } catch (error) {
      console.error('Error fetching spectrum data:', error);
      Alert.alert('Error', 'Failed to analyze audio. Please check your internet connection.');
    } finally {
      setSpectrumLoading(false);
    }
    setRecordedTime(0);
  };

  const getPredictionColor = (): string => {
    if (String(prediction) === soundInfo.tone) return "#22c55e";
    return "#ef4444";
  };

  const playRecordedAudio = async () => {
    if (audioUri) {
      try {
        const { sound: recordedSound } = await Audio.Sound.createAsync({ uri: audioUri });
        await recordedSound.playAsync();
      } catch (error) {
        console.error('Error playing recorded audio:', error);
      }
    }
  };

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.container}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Speak Tones</Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.content}>
          {!currentFile && (
            <>
              <Text style={styles.title}>Chinese Tone Practice</Text>
              <Text style={styles.subtitle}>Perfect your pronunciation</Text>
              
              <TouchableOpacity
                style={styles.startButton}
                onPress={playRandomSound}
                disabled={loading}
              >
                <LinearGradient
                  colors={['#22c55e', '#16a34a']}
                  style={styles.startButtonGradient}
                >
                  {loading ? (
                    <ActivityIndicator color="white" size="large" />
                  ) : (
                    <>
                      <Ionicons name="play" size={32} color="white" />
                      <Text style={styles.startButtonText}>Start Practice</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </>
          )}

          {currentFile && soundInfo.sound && (
            <View style={styles.practiceContainer}>
              <Text style={styles.chineseCharacter}>
                {convertToPinyin(soundInfo.sound, +soundInfo.tone)}
              </Text>
              
              {prediction !== null && prediction < 5 && (
                <View style={[styles.predictionContainer, { borderColor: getPredictionColor() }]}>
                  <Text style={[styles.predictionText, { color: getPredictionColor() }]}>
                    Your pronunciation: {convertToPinyin(soundInfo.sound, prediction)} (Tone {prediction})
                  </Text>
                  <Text style={[styles.predictionSubtext, { color: getPredictionColor() }]}>
                    {String(prediction) === soundInfo.tone ? '✓ Correct!' : '✗ Try again'}
                  </Text>
                </View>
              )}

              {prediction === 5 && (
                <View style={[styles.predictionContainer, { borderColor: '#ef4444' }]}>
                  <Text style={[styles.predictionText, { color: '#ef4444' }]}>
                    Analysis: Background noise detected
                  </Text>
                  <Text style={[styles.predictionSubtext, { color: '#ef4444' }]}>
                    Please try recording in a quieter environment
                  </Text>
                </View>
              )}

              {spectrumImage && (
                <View style={styles.spectrumContainer}>
                  <Text style={styles.spectrumTitle}>Audio Analysis</Text>
                  <Image
                    source={{ uri: `data:image/png;base64,${spectrumImage}` }}
                    style={styles.spectrumImage}
                    resizeMode="contain"
                  />
                </View>
              )}

              {spectrumLoading && (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="white" />
                  <Text style={styles.loadingText}>Analyzing your pronunciation...</Text>
                </View>
              )}

              {audioUri && prediction !== null && !isRecording && !loading && !spectrumLoading && (
                <TouchableOpacity style={styles.playRecordedButton} onPress={playRecordedAudio}>
                  <Ionicons name="volume-high" size={24} color="white" />
                  <Text style={styles.playRecordedText}>Play Your Recording</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        {/* Bottom Controls */}
        <View style={styles.bottomControls}>
          <TouchableOpacity
            style={[styles.controlButton, !currentFile && styles.controlButtonDisabled]}
            onPress={replaySound}
            disabled={!currentFile || isPlaying}
          >
            <Ionicons name="volume-high" size={28} color={currentFile && !isPlaying ? "white" : "#999"} />
            <Text style={[styles.controlButtonText, { color: currentFile && !isPlaying ? "white" : "#999" }]}>
              Replay
            </Text>
          </TouchableOpacity>

          <View style={styles.recordButtonContainer}>
            {currentFile && (
              <Animated.View style={[styles.recordButton, { transform: [{ scale: recordingScale }] }]}>
                <TouchableOpacity
                  style={styles.recordButtonInner}
                  onPress={startRecording}
                  disabled={isRecording || loading}
                >
                  <LinearGradient
                    colors={isRecording ? ['#ef4444', '#dc2626'] : ['#22c55e', '#16a34a']}
                    style={styles.recordButtonGradient}
                  >
                    <Ionicons name="mic" size={36} color="white" />
                  </LinearGradient>
                </TouchableOpacity>
                
                {isRecording && (
                  <Svg style={styles.progressRing} width="88" height="88">
                    <Circle
                      cx="44"
                      cy="44"
                      r="40"
                      stroke="#22c55e"
                      strokeWidth="4"
                      fill="transparent"
                      strokeDasharray={`${2 * Math.PI * 40}`}
                      strokeDashoffset={2 * Math.PI * 40 * (1 - recordedTime / MAX_RECORDING_TIME)}
                      transform="rotate(-90 44 44)"
                    />
                  </Svg>
                )}
              </Animated.View>
            )}
            {currentFile && (
              <Text style={styles.recordHint}>
                {isRecording ? 'Recording...' : 'Hold to Record'}
              </Text>
            )}
          </View>

          <TouchableOpacity
            style={[styles.controlButton, !currentFile && styles.controlButtonDisabled]}
            onPress={playRandomSound}
            disabled={!currentFile || loading}
          >
            <Ionicons name="arrow-forward" size={28} color={currentFile && !loading ? "white" : "#999"} />
            <Text style={[styles.controlButtonText, { color: currentFile && !loading ? "white" : "#999" }]}>
              Next
            </Text>
          </TouchableOpacity>
        </View>
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
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginBottom: 60,
  },
  startButton: {
    borderRadius: 25,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  startButtonGradient: {
    paddingHorizontal: 40,
    paddingVertical: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  startButtonText: {
    color: 'white',
    fontSize: 20,
    fontWeight: '600',
    marginLeft: 12,
  },
  practiceContainer: {
    alignItems: 'center',
    width: '100%',
  },
  chineseCharacter: {
    fontSize: 72,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 30,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  predictionContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    borderWidth: 2,
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginBottom: 20,
    alignItems: 'center',
  },
  predictionText: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  predictionSubtext: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 4,
  },
  spectrumContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    alignItems: 'center',
  },
  spectrumTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  spectrumImage: {
    width: width * 0.8,
    height: 200,
    borderRadius: 8,
  },
  loadingContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  loadingText: {
    color: 'white',
    fontSize: 16,
    marginTop: 8,
    textAlign: 'center',
  },
  playRecordedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  playRecordedText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
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
    justifyContent: 'center',
  },
  recordButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
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
  progressRing: {
    position: 'absolute',
    top: -4,
    left: -4,
  },
  recordHint: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 8,
    textAlign: 'center',
  },
});
