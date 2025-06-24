import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Link } from 'expo-router';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

const tiles = [
  { key: 'recognise', label: 'Recognise Tones' },
  { key: 'speak', label: 'Speak Tones' },
  { key: 'saved', label: 'Saved Words' },
];

export default function PracticeScreen() {
  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.title}>Practice</ThemedText>
      <View style={styles.tilesRow}>
        <Link href="/(tabs)/recognise-tones" asChild>
          <TouchableOpacity style={[styles.tile, styles.tileLarge]}>
            <ThemedText type="subtitle">Recognise Tones</ThemedText>
          </TouchableOpacity>
        </Link>
        <View style={styles.tilesColumn}>
          <Link href="/(tabs)/speak-tones" asChild>
            <TouchableOpacity style={styles.tile}>
              <ThemedText type="subtitle">Speak Tones</ThemedText>
            </TouchableOpacity>
          </Link>
          <Link href="/(tabs)/sentence-reading" asChild>
            <TouchableOpacity style={styles.tile}>
              <ThemedText type="subtitle">Sentence Reading</ThemedText>
            </TouchableOpacity>
          </Link>
        </View>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    gap: 24,
  },
  title: {
    marginBottom: 24,
  },
  tilesRow: {
    flexDirection: 'row',
    gap: 16,
  },
  tilesColumn: {
    flexDirection: 'column',
    gap: 16,
  },
  tile: {
    backgroundColor: '#E0E7FF',
    borderRadius: 16,
    padding: 24,
    minWidth: 120,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  tileLarge: {
    minHeight: 160,
    minWidth: 160,
  },
}); 