// If you haven't already, run: npx expo install expo-av
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Audio, Sound } from 'expo-av';
import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const API_URL = 'https://8q3aqjs3v1.execute-api.us-east-2.amazonaws.com/prod/api/';
const speakers = ['MV1', 'MV2', 'MV3', 'FV1', 'FV2'];

function getNewSpeaker(speakers: string[], currentSpeaker: string) {
  const filtered = speakers.filter((s) => s !== currentSpeaker);
  return filtered[Math.floor(Math.random() * filtered.length)];
}

export default function RecogniseTonesScreen() {
  const [currentFile, setCurrentFile] = useState<string | null>(null);
  const [soundInfo, setSoundInfo] = useState<{ sound: string; tone: string; speaker: string }>({ sound: '', tone: '', speaker: '' });
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedTone, setSelectedTone] = useState<string | null>(null);
  const [statistics, setStatistics] = useState<{ correct: number; total: number }>({ correct: 0, total: 0 });
  const soundRef = useRef<Sound | null>(null);

  useEffect(() => {
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
    };
  }, []);

  const playRandomSound = async () => {
    setIsPlaying(true);
    setSelectedTone(null);
    try {
      const response = await fetch(API_URL + 'random-sound');
      const data = await response.json();
      const { sound, tone, speaker, url } = data;
      setSoundInfo({ sound, tone, speaker });
      setCurrentFile(url);
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
      }
      const { sound: playbackObj } = await Audio.Sound.createAsync({ uri: url });
      soundRef.current = playbackObj;
      await playbackObj.playAsync();
    } catch (error) {
      setIsPlaying(false);
    }
  };

  const replaySound = async () => {
    if (soundRef.current) {
      await soundRef.current.replayAsync();
    }
  };

  const handleToneSelection = (tone: string) => {
    setSelectedTone(tone);
    setStatistics((prev) => ({
      correct: prev.correct + (tone === soundInfo.tone ? 1 : 0),
      total: prev.total + 1,
    }));
    setIsPlaying(false);
  };

  const getButtonColor = (tone: string) => {
    if (selectedTone && tone === soundInfo.tone) return styles.buttonCorrect;
    if (tone === selectedTone && tone !== soundInfo.tone) return styles.buttonWrong;
    return styles.buttonDefault;
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.title}>Recognise Tones</ThemedText>
      <View style={styles.centered}>
        <TouchableOpacity style={styles.playButton} onPress={playRandomSound} disabled={isPlaying}>
          <Text style={styles.playButtonText}>{currentFile ? 'Next' : 'Play'}</Text>
        </TouchableOpacity>
        {currentFile && (
          <TouchableOpacity style={styles.replayButton} onPress={replaySound}>
            <Text style={styles.replayButtonText}>Replay</Text>
          </TouchableOpacity>
        )}
      </View>
      {currentFile && (
        <View style={styles.tonesRow}>
          {[1, 2, 3, 4].map((tone) => (
            <TouchableOpacity
              key={tone}
              style={[styles.toneButton, getButtonColor(String(tone))]}
              onPress={() => handleToneSelection(String(tone))}
              disabled={selectedTone !== null}
            >
              <Text style={styles.toneButtonText}>{tone}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
      <View style={styles.statsRow}>
        <ThemedText type="default">Correct: {statistics.correct}</ThemedText>
        <ThemedText type="default">Total: {statistics.total}</ThemedText>
        {statistics.total > 0 && (
          <ThemedText type="default">{Math.round((statistics.correct / statistics.total) * 100)}%</ThemedText>
        )}
      </View>
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
  playButton: {
    backgroundColor: '#4ADE80',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 32,
    marginRight: 8,
  },
  playButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
  },
  replayButton: {
    backgroundColor: '#818CF8',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  replayButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  tonesRow: {
    flexDirection: 'row',
    gap: 16,
    marginVertical: 24,
  },
  toneButton: {
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginHorizontal: 4,
    minWidth: 48,
    alignItems: 'center',
  },
  toneButtonText: {
    color: '#222',
    fontWeight: 'bold',
    fontSize: 20,
  },
  buttonDefault: {
    backgroundColor: '#E0E7FF',
  },
  buttonCorrect: {
    backgroundColor: '#4ADE80',
  },
  buttonWrong: {
    backgroundColor: '#F87171',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 24,
  },
}); 