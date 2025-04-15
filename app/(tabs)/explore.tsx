import React, { useState, useEffect } from 'react';
import { StyleSheet, View, FlatList, RefreshControl, ScrollView, Alert } from 'react-native';
import { Card, Text, ActivityIndicator, useTheme, Searchbar, Chip, IconButton, Button } from 'react-native-paper';
import { ThemedView, ThemedText } from '@/components/ThemedComponents';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { wallhavenAPI } from '../services/wallhaven';
import { WallpaperPreview } from '../services/wallhaven';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function ExploreScreen() {
  const [wallpapers, setWallpapers] = useState<WallpaperPreview[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSort, setSelectedSort] = useState('date_added');
  const [selectedOrder, setSelectedOrder] = useState('desc');
  const [showNsfwContent, setShowNsfwContent] = useState(false);
  const theme = useTheme();

  // Load NSFW setting on component mount
  useEffect(() => {
    const loadNsfwSetting = async () => {
      try {
        const nsfwSetting = await AsyncStorage.getItem('showNsfwContent');
        if (nsfwSetting !== null) {
          setShowNsfwContent(nsfwSetting === 'true');
        }
      } catch (error) {
        console.error('Failed to load NSFW setting:', error);
      }
    };
    
    loadNsfwSetting();
  }, []);

  const sortOptions = [
    { id: 'date_added', label: 'Latest' },
    { id: 'relevance', label: 'Relevance' },
    { id: 'random', label: 'Random' },
    { id: 'views', label: 'Views' },
    { id: 'favorites', label: 'Favorites' },
    { id: 'toplist', label: 'Toplist' },
  ];

  const orderOptions = [
    { id: 'desc', label: 'Descending' },
    { id: 'asc', label: 'Ascending' },
  ];

  const loadWallpapers = async () => {
    try {
      setLoading(true);
      
      // Check if trying to access NSFW content without API key
      if (showNsfwContent && !wallhavenAPI.hasApiKey()) {
        Alert.alert(
          'API Key Required', 
          'You need to set a Wallhaven API key in Settings to access NSFW content.',
          [{ text: 'OK' }]
        );
      }
      
      const response = await wallhavenAPI.search({
        q: searchQuery,
        sorting: selectedSort as any,
        order: selectedOrder as any,
        // Set purity based on NSFW setting
        purity: showNsfwContent ? (wallhavenAPI.hasApiKey() ? '111' : '100') : '100', // If NSFW allowed and has API key, enable all; otherwise only SFW
      });
      setWallpapers(response.data);
    } catch (error) {
      console.error('Error loading wallpapers:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadWallpapers();
    setRefreshing(false);
  };

  useEffect(() => {
    // Set the API key
    wallhavenAPI.setApiKey('S9eGuYOS7MOFjXfV91Up30hozbk5kpQR');
    
    loadWallpapers();
  }, [searchQuery, selectedSort, selectedOrder]);

  const renderWallpaper = ({ item }: { item: WallpaperPreview }) => (
    <Card style={styles.wallpaperCard} mode="elevated">
      <Card.Cover source={{ uri: item.thumbs.large }} style={styles.wallpaperImage} />
      <Card.Content style={styles.wallpaperContent}>
        <View style={styles.wallpaperInfo}>
          <Text variant="bodyMedium" style={styles.resolution}>
            {item.resolution}
          </Text>
          <View style={styles.actions}>
            <Button
              mode="contained"
              compact
              onPress={() => {}}
              style={styles.favoriteButton}
              icon="heart"
            >
              Favorite
            </Button>
            <IconButton
              icon={({ size, color }) => (
                <IconSymbol name="square.and.arrow.down.fill" size={size} color={color} />
              )}
              size={20}
              onPress={() => {}}
            />
          </View>
        </View>
      </Card.Content>
    </Card>
  );

  return (
    <ThemedView style={styles.container}>
      <StatusBar style="auto" />
      <Stack.Screen
        options={{
          title: 'Explore',
          headerShadowVisible: false,
        }}
      />

      <Searchbar
        placeholder="Search wallpapers..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchBar}
      />

      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.sortScroll}>
          {sortOptions.map((sort) => (
            <Chip
              key={sort.id}
              selected={selectedSort === sort.id}
              onPress={() => setSelectedSort(sort.id)}
              style={styles.sortChip}
            >
              {sort.label}
            </Chip>
          ))}
        </ScrollView>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.orderScroll}>
          {orderOptions.map((order) => (
            <Chip
              key={order.id}
              selected={selectedOrder === order.id}
              onPress={() => setSelectedOrder(order.id)}
              style={styles.orderChip}
            >
              {order.label}
            </Chip>
          ))}
        </ScrollView>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
        </View>
      ) : (
        <FlatList
          data={wallpapers}
          renderItem={renderWallpaper}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={styles.wallpaperList}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchBar: {
    margin: 16,
    borderRadius: 16,
  },
  filterContainer: {
    paddingHorizontal: 16,
  },
  sortScroll: {
    marginBottom: 8,
  },
  orderScroll: {
    marginBottom: 16,
  },
  sortChip: {
    marginRight: 8,
  },
  orderChip: {
    marginRight: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  wallpaperList: {
    padding: 8,
  },
  wallpaperCard: {
    flex: 1,
    margin: 8,
    borderRadius: 16,
  },
  wallpaperImage: {
    aspectRatio: 1,
    borderRadius: 16,
  },
  wallpaperContent: {
    padding: 8,
  },
  wallpaperInfo: {
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
  favoriteButton: {
    marginRight: 8,
    borderRadius: 8,
  },
});
