import React, { useState, useEffect } from 'react';
import { StyleSheet, View, FlatList, RefreshControl, ScrollView, Alert, Platform } from 'react-native';
import { Card, Text, ActivityIndicator, useTheme, Searchbar, Chip, IconButton } from 'react-native-paper';
import { ThemedView } from '@/components/ThemedComponents';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { wallhavenAPI } from '../services/wallhaven';
import { WallpaperPreview } from '../services/wallhaven';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { HeartIcon } from '@/components/ui/CustomIcons';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import * as Haptics from 'expo-haptics';
import { FontSizes } from '@/constants/FontSizes';

export default function ExploreScreen() {
  const [wallpapers, setWallpapers] = useState<WallpaperPreview[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSort, setSelectedSort] = useState('date_added');
  const [selectedOrder, setSelectedOrder] = useState('desc');
  const [showNsfwContent, setShowNsfwContent] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const theme = useTheme();

  // Load NSFW setting and favorites on component mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        // Load NSFW setting
        const nsfwSetting = await AsyncStorage.getItem('showNsfwContent');
        if (nsfwSetting !== null) {
          setShowNsfwContent(nsfwSetting === 'true');
        }
        
        // Load favorites
        const savedFavorites = await AsyncStorage.getItem('favorites');
        if (savedFavorites) {
          const parsedFavorites = JSON.parse(savedFavorites);
          setFavorites(parsedFavorites.map((item: WallpaperPreview) => item.id));
        }
      } catch (error) {
        console.error('Failed to load settings:', error);
      }
    };
    
    loadSettings();
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
  
  const toggleFavorite = async (wallpaper: WallpaperPreview) => {
    try {
      const savedFavorites = await AsyncStorage.getItem('favorites');
      let favoritesArray: WallpaperPreview[] = [];
      
      if (savedFavorites) {
        favoritesArray = JSON.parse(savedFavorites);
      }
      
      // Check if already in favorites
      const isFavorite = favorites.includes(wallpaper.id);
      
      if (isFavorite) {
        // Remove from favorites
        const updatedFavorites = favoritesArray.filter(item => item.id !== wallpaper.id);
        await AsyncStorage.setItem('favorites', JSON.stringify(updatedFavorites));
        setFavorites(updatedFavorites.map(item => item.id));
      } else {
        // Add to favorites
        favoritesArray.push(wallpaper);
        await AsyncStorage.setItem('favorites', JSON.stringify(favoritesArray));
        setFavorites([...favorites, wallpaper.id]);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const loadWallpapers = async (isRefreshing = false) => {
    try {
      if (isRefreshing) {
        setPage(1);
        setHasMore(true);
      }
      
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
        page: isRefreshing ? 1 : page,
        purity: showNsfwContent ? (wallhavenAPI.hasApiKey() ? '111' : '100') : '100',
      });

      if (isRefreshing) {
        setWallpapers(response.data);
      } else {
        setWallpapers(prev => [...prev, ...response.data]);
      }

      if (response.data.length === 0) {
        setHasMore(false);
      }
    } catch (error) {
      console.error('Error loading wallpapers:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadMore = () => {
    if (!loadingMore && hasMore) {
      setLoadingMore(true);
      setPage(prev => prev + 1);
    }
  };

  useEffect(() => {
    loadWallpapers();
  }, [page]);

  useEffect(() => {
    setPage(1);
    setHasMore(true);
    loadWallpapers(true);
  }, [searchQuery, selectedSort, selectedOrder, showNsfwContent]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadWallpapers(true);
    setRefreshing(false);
  };

  const downloadWallpaper = async (wallpaper: WallpaperPreview) => {
    try {
      // Request permissions
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Please grant permission to save images to your device.');
        return;
      }

      // Show loading alert
      Alert.alert('Downloading', 'Please wait while we download your wallpaper...');

      // Download the image
      const fileUri = `${FileSystem.documentDirectory}${wallpaper.id}.jpg`;
      const { uri } = await FileSystem.downloadAsync(
        wallpaper.path,
        fileUri
      );

      // Save to media library
      const asset = await MediaLibrary.createAssetAsync(uri);
      await MediaLibrary.createAlbumAsync('Shiori', asset, false);

      // Clean up
      await FileSystem.deleteAsync(fileUri);

      // Show success message
      Alert.alert('Success', 'Wallpaper downloaded successfully!');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error('Error downloading wallpaper:', error);
      Alert.alert('Error', 'Failed to download wallpaper. Please try again.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const renderWallpaper = ({ item }: { item: WallpaperPreview }) => {
    const isFavorite = favorites.includes(item.id);
    
    return (
      <Card style={styles.wallpaperCard} mode="elevated">
        <View style={styles.wallpaperContainer}>
          <Card.Cover source={{ uri: item.thumbs.large }} style={styles.wallpaperImage} />
          
          {/* Glassmorphic buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => toggleFavorite(item)}
            >
              <BlurView intensity={25} tint="dark" style={styles.blurView}>
                <HeartIcon
                  size={22}
                  color="#FFFFFF"
                  isFilled={isFavorite}
                  style={styles.heartIcon}
                />
              </BlurView>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => downloadWallpaper(item)}
            >
              <BlurView intensity={25} tint="dark" style={styles.blurView}>
                <IconButton
                  icon="download"
                  size={22}
                  iconColor="#FFFFFF"
                  style={styles.downloadIcon}
                />
              </BlurView>
            </TouchableOpacity>
          </View>
          
          {/* Image info overlay */}
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.7)']}
            style={styles.infoGradient}
          >
            <View style={styles.wallpaperInfo}>
              <Text style={styles.resolutionText}>{item.resolution}</Text>
              <View style={styles.wallpaperMeta}>
                <View style={styles.metaItem}>
                  <IconButton
                    icon="image-size-select-actual"
                    size={14}
                    iconColor="white"
                    style={styles.metaIcon}
                  />
                  <Text style={styles.wallpaperText}>{item.resolution}</Text>
                </View>
                <View style={styles.metaItem}>
                  <IconButton
                    icon="heart"
                    size={14}
                    iconColor="white"
                    style={styles.metaIcon}
                  />
                  <Text style={styles.wallpaperText}>{item.favorites}</Text>
                </View>
              </View>
            </View>
          </LinearGradient>
        </View>
      </Card>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'right', 'left', 'bottom']}>
      <ThemedView style={styles.container}>
        <StatusBar style="auto" />
        <Stack.Screen
          options={{
            title: 'Explore',
            headerShadowVisible: false,
          }}
        />

        <View style={styles.contentContainer}>
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
              <ActivityIndicator size="large" color={theme.colors.primary} />
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
              onEndReached={loadMore}
              onEndReachedThreshold={0.5}
              ListFooterComponent={() => (
                loadingMore ? (
                  <View style={styles.loadingMoreContainer}>
                    <ActivityIndicator size="small" color={theme.colors.primary} />
                  </View>
                ) : null
              )}
              showsVerticalScrollIndicator={false}
              columnWrapperStyle={styles.columnWrapper}
            />
          )}
        </View>
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 12,
  },
  searchBar: {
    margin: 8,
    borderRadius: 16,
    elevation: 2,
  },
  filterContainer: {
    marginHorizontal: 4,
  },
  sortScroll: {
    marginBottom: 8,
  },
  orderScroll: {
    marginBottom: 12,
  },
  sortChip: {
    marginRight: 8,
    marginLeft: 4,
  },
  orderChip: {
    marginRight: 8,
    marginLeft: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  wallpaperList: {
    paddingBottom: Platform.OS === 'ios' ? 20 : 80,
  },
  columnWrapper: {
    justifyContent: 'space-between',
  },
  wallpaperCard: {
    width: '48%',
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 3,
  },
  wallpaperContainer: {
    position: 'relative',
  },
  wallpaperImage: {
    aspectRatio: 1,
    borderRadius: 0,
  },
  buttonContainer: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
  },
  blurView: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heartIcon: {
    margin: 0,
  },
  downloadIcon: {
    margin: 0,
  },
  infoGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
    justifyContent: 'flex-end',
    padding: 12,
  },
  wallpaperInfo: {
    flex: 1,
    justifyContent: 'space-between',
  },
  resolutionText: {
    color: 'white',
    fontSize: FontSizes.caption,
    fontFamily: 'Nunito-Bold',
    opacity: 0.9,
    marginBottom: 4,
  },
  wallpaperMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  wallpaperText: {
    color: 'white',
    marginLeft: 4,
    fontSize: FontSizes.caption,
    fontFamily: 'Nunito-Regular',
  },
  loadingMoreContainer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  metaIcon: {
    margin: 0,
    padding: 0,
  },
});
