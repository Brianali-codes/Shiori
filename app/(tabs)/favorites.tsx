import React, { useState, useEffect } from 'react';
import { StyleSheet, View, FlatList, RefreshControl } from 'react-native';
import { Card, Text, ActivityIndicator, useTheme, IconButton, Button } from 'react-native-paper';
import { ThemedView, ThemedText } from '@/components/ThemedComponents';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { wallhavenAPI } from '../services/wallhaven';
import { WallpaperPreview } from '../services/wallhaven';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { HeartIcon } from '@/components/ui/CustomIcons';
import { ArrowDown } from 'iconsax-react-nativejs';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function FavoritesScreen() {
  const [favorites, setFavorites] = useState<WallpaperPreview[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const theme = useTheme();

  const loadFavorites = async () => {
    try {
      setLoading(true);
      const savedFavorites = await AsyncStorage.getItem('favorites');
      if (savedFavorites) {
        const parsedFavorites = JSON.parse(savedFavorites);
        setFavorites(parsedFavorites);
      }
    } catch (error) {
      console.error('Error loading favorites:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadFavorites();
    setRefreshing(false);
  };

  const removeFromFavorites = async (id: string) => {
    try {
      const updatedFavorites = favorites.filter(wallpaper => wallpaper.id !== id);
      await AsyncStorage.setItem('favorites', JSON.stringify(updatedFavorites));
      setFavorites(updatedFavorites);
    } catch (error) {
      console.error('Error removing from favorites:', error);
    }
  };

  useEffect(() => {
    loadFavorites();
  }, []);

  const renderFavorite = ({ item }: { item: WallpaperPreview }) => (
    <Card style={styles.favoriteCard} mode="elevated">
      <Card.Cover source={{ uri: item.thumbs.large }} style={styles.favoriteImage} />
      <Card.Content style={styles.favoriteContent}>
        <View style={styles.favoriteInfo}>
          <Text variant="bodyMedium" style={styles.resolution}>
            {item.resolution}
          </Text>
          <View style={styles.actions}>
            <IconButton
              icon={() => <HeartIcon size={20} color={theme.colors.primary} isFilled={true} />}
              size={20}
              onPress={() => removeFromFavorites(item.id)}
            />
            <IconButton
              icon={() => <ArrowDown size={20} color={theme.colors.primary} />}
              size={20}
              onPress={() => {}}
            />
          </View>
        </View>
      </Card.Content>
    </Card>
  );

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top']}>
      <ThemedView style={styles.container}>
        <StatusBar style="auto" />
        <Stack.Screen
          options={{
            title: 'Favorites',
            headerShadowVisible: false,
          }}
        />

        {favorites.length === 0 ? (
          <View style={styles.emptyContainer}>
            <HeartIcon size={64} color={theme.colors.primary} />
            <Text variant="titleMedium" style={styles.emptyText}>
              No favorites yet
            </Text>
            <Text variant="bodyMedium" style={styles.emptySubtext}>
              Start adding wallpapers to your favorites
            </Text>
            <Button
              mode="contained"
              onPress={() => {}}
              style={styles.exploreButton}
            >
              Explore Wallpapers
            </Button>
          </View>
        ) : loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" />
          </View>
        ) : (
          <FlatList
            data={favorites}
            renderItem={renderFavorite}
            keyExtractor={(item) => item.id}
            numColumns={2}
            contentContainerStyle={styles.favoritesList}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
          />
        )}
      </ThemedView>
    </SafeAreaView>
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
    padding: 32,
  },
  emptyText: {
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    opacity: 0.7,
    textAlign: 'center',
    marginBottom: 24,
  },
  exploreButton: {
    borderRadius: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  favoritesList: {
    padding: 8,
  },
  favoriteCard: {
    flex: 1,
    margin: 8,
    borderRadius: 16,
  },
  favoriteImage: {
    aspectRatio: 1,
    borderRadius: 16,
  },
  favoriteContent: {
    padding: 8,
  },
  favoriteInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  resolution: {
    opacity: 0.7,
  },
  actions: {
    flexDirection: 'row',
  },
}); 