import React from 'react';
import { Image, Pressable, StyleSheet } from 'react-native';
import { Link } from 'expo-router';
import { ThemedView, ThemedText } from '../ThemedComponents';
import { fontStyles } from '../../utils/fontStyles';

type WallpaperCardProps = {
  id: string;
  thumbUrl: string;
  resolution: string;
};

export function WallpaperCard({ id, thumbUrl, resolution }: WallpaperCardProps) {
  return (
    <Link href={`/wallpaper/${id}`} asChild>
      <Pressable style={styles.container}>
        <ThemedView style={styles.card}>
          <Image
            source={{ uri: thumbUrl }}
            style={styles.image}
            resizeMode="cover"
          />
          <ThemedView style={styles.overlay}>
            <ThemedText style={[styles.resolution, fontStyles.regular]}>{resolution}</ThemedText>
          </ThemedView>
        </ThemedView>
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    margin: 4,
  },
  card: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    aspectRatio: 16 / 9,
  },
  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 8,
  },
  resolution: {
    fontSize: 12,
    color: '#fff',
  },
}); 