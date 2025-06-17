import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Audio } from 'expo-av';
import React, { useRef, useState } from 'react';
import { ActivityIndicator, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const API_URL = 'https://8q3aqjs3v1.execute-api.us-east-2.amazonaws.com/prod/api/';
const MAX_RECORDING_TIME = 2; // seconds

export default function SpeakTonesScreen() {
  const [isRecording, setIsRecording] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [prediction, setPrediction] = useState<string | null>(null);
  const [spectrumImage, setSpectrumImage] = useState<string | null>(null);
  const [playback, setPlayback] = useState<Audio.Sound | null>(null);
  const [playbackStatus, setPlaybackStatus] = useState<'idle' | 'playing' | 'paused'>('idle');

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const startRecording = async () => {
    try {
      setPrediction(null);
      setSpectrumImage(null);
      setAudioUri(null);
      setIsRecording(true);
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        setIsRecording(false);
        return;
      }
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const rec = new Audio.Recording();
      await rec.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      await rec.startAsync();
      setRecording(rec);
      timerRef.current = setTimeout(() => stopRecording(), MAX_RECORDING_TIME * 1000);
    } catch (err) {
      setIsRecording(false);
    }
  };

  const stopRecording = async () => {
    if (!recording) return;
    try {
      timerRef.current && clearTimeout(timerRef.current);
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setAudioUri(uri);
      setIsRecording(false);
      setRecording(null);
    } catch (err) {
      setIsRecording(false);
    }
  };

  const playAudio = async () => {
    if (!audioUri) return;
    if (playback) {
      await playback.unloadAsync();
      setPlayback(null);
    }
    const { sound } = await Audio.Sound.createAsync({ uri: audioUri });
    setPlayback(sound);
    setPlaybackStatus('playing');
    sound.setOnPlaybackStatusUpdate((status) => {
      if (!status.isLoaded || status.isPlaying) return;
      setPlaybackStatus('idle');
    });
    await sound.playAsync();
  };

  const sendForAnalysis = async () => {
    if (!audioUri) return;
    setIsLoading(true);
    setPrediction(null);
    setSpectrumImage(null);
    try {
      const formData = new FormData();
      // @ts-ignore
      formData.append('audio', { uri: audioUri, name: 'audio.wav', type: 'audio/wav' });
      formData.append('model_type', 'Ensemble');
      const response = await fetch(API_URL + 'get_spectrum', {
        method: 'POST',
        body: formData,
      });
      if (response.ok) {
        const data = await response.json();
        setPrediction(data.prediction);
        setSpectrumImage(data.spectrum);
      }
    } catch (err) {
      // handle error
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.title}>Speak Tones</ThemedText>
      <View style={styles.centered}>
        {!isRecording && (
          <TouchableOpacity style={styles.recordButton} onPress={startRecording}>
            <Text style={styles.recordButtonText}>Record</Text>
          </TouchableOpacity>
        )}
        {isRecording && (
          <TouchableOpacity style={[styles.recordButton, styles.recording]} onPress={stopRecording}>
            <Text style={styles.recordButtonText}>Stop</Text>
          </TouchableOpacity>
        )}
      </View>
      {audioUri && !isRecording && (
        <View style={styles.audioActions}>
          <TouchableOpacity style={styles.actionButton} onPress={playAudio}>
            <Text style={styles.actionButtonText}>{playbackStatus === 'playing' ? 'Playing...' : 'Play'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={sendForAnalysis} disabled={isLoading}>
            <Text style={styles.actionButtonText}>{isLoading ? 'Analyzing...' : 'Analyze'}</Text>
          </TouchableOpacity>
        </View>
      )}
      {isLoading && <ActivityIndicator size="large" style={{ marginTop: 24 }} />}
      {prediction && (
        <ThemedText type="subtitle" style={{ color: prediction === '5' ? 'red' : 'green', marginTop: 24 }}>
          {prediction === '5' ? 'Noise detected' : `Predicted Tone: ${prediction}`}
        </ThemedText>
      )}
      {spectrumImage && (
        <Image
          source={{ uri: `data:image/png;base64,${spectrumImage}` }}
          style={{ width: 320, height: 80, marginTop: 16, borderRadius: 8 }}
          resizeMode="contain"
        />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 24,
  },
  title: {
    marginBottom: 24,
  },
  centered: {
    flexDirection: 'row',
    gap: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  recordButton: {
    backgroundColor: '#818CF8',
    borderRadius: 16,
    paddingVertical: 24,
    paddingHorizontal: 40,
  },
  recording: {
    backgroundColor: '#F87171',
  },
  recordButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 20,
  },
  audioActions: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 16,
  },
  actionButton: {
    backgroundColor: '#4ADE80',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
}); 