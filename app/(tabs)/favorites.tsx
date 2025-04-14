import React from 'react';
import { StyleSheet } from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { FlatList } from 'react-native-gesture-handler';
import { WallpaperCard } from '@/components/ui/WallpaperCard';

// Temporary mock data
const mockFavorites = [
  { id: '10', thumbUrl: 'https://picsum.photos/300/200', resolution: '1920x1080' },
  { id: '11', thumbUrl: 'https://picsum.photos/300/200', resolution: '2560x1440' },
];

export default function FavoritesScreen() {
  if (mockFavorites.length === 0) {
    return (
      <ThemedView style={styles.emptyContainer}>
        <ThemedText type="title">No Favorites Yet</ThemedText>
        <ThemedText>Your favorite wallpapers will appear here</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <FlatList
        data={mockFavorites}
        renderItem={({ item }) => (
          <WallpaperCard
            id={item.id}
            thumbUrl={item.thumbUrl}
            resolution={item.resolution}
          />
        )}
        keyExtractor={item => item.id}
        numColumns={2}
        contentContainerStyle={styles.list}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  list: {
    padding: 4,
  },
}); 