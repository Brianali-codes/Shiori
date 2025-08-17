import React, { useState, useEffect } from 'react';
import { StyleSheet, View, FlatList, RefreshControl, ScrollView, Alert, Platform, Linking, ToastAndroid, TouchableOpacity, Dimensions } from 'react-native';
import { Card, Text, ActivityIndicator, useTheme, Searchbar, Chip, IconButton } from 'react-native-paper';
import { ThemedView } from '@/components/ThemedComponents';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { wallhavenAPI } from '../services/wallhaven';
import { WallpaperPreview } from '../services/wallhaven';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { Heart, ArrowDown2, InfoCircle, SearchNormal1, Sort, ArrowUp2, ArrowDown, Filter, Add, ArrowLeft2, ArrowRight2 } from 'iconsax-react-nativejs';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import * as Haptics from 'expo-haptics';
import { FontSizes } from '@/constants/FontSizes';

const { width: screenWidth } = Dimensions.get('window');
const COLUMN_COUNT = 2;
const ITEM_MARGIN = 12;
const CONTAINER_PADDING = 12;
const ITEM_WIDTH = (screenWidth - (CONTAINER_PADDING * 2) - (ITEM_MARGIN * (COLUMN_COUNT - 1))) / COLUMN_COUNT;

interface MasonryItem extends WallpaperPreview {
  height: number;
  uniqueId: string;
}

// Custom Masonry Grid Component
const MasonryGrid: React.FC<{
  data: MasonryItem[];
  renderItem: (item: MasonryItem, index: number) => React.ReactElement;
  refreshControl?: React.ReactElement;
  ListFooterComponent?: () => React.ReactElement | null;
}> = ({ data, renderItem, refreshControl, ListFooterComponent }) => {
  const [columnHeights, setColumnHeights] = useState<number[]>(Array(COLUMN_COUNT).fill(0));
  const [columns, setColumns] = useState<MasonryItem[][]>(Array(COLUMN_COUNT).fill([]).map(() => []));

  useEffect(() => {
    // Reset columns when data changes
    const newColumns: MasonryItem[][] = Array(COLUMN_COUNT).fill([]).map(() => []);
    const newColumnHeights = Array(COLUMN_COUNT).fill(0);

    data.forEach((item) => {
      // Find the shortest column
      const shortestColumnIndex = newColumnHeights.indexOf(Math.min(...newColumnHeights));
      
      // Add item to the shortest column
      newColumns[shortestColumnIndex].push(item);
      
      // Update column height (add item height + margin)
      newColumnHeights[shortestColumnIndex] += item.height + ITEM_MARGIN;
    });

    setColumns(newColumns);
    setColumnHeights(newColumnHeights);
  }, [data]);

  const renderColumn = (columnData: MasonryItem[], columnIndex: number) => (
    <View key={columnIndex} style={styles.column}>
      {columnData.map((item, itemIndex) => renderItem(item, itemIndex))}
    </View>
  );

  return (
    <ScrollView
      refreshControl={refreshControl}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.masonryContainer}>
        {columns.map((columnData, columnIndex) => renderColumn(columnData, columnIndex))}
      </View>
      {ListFooterComponent && <ListFooterComponent />}
    </ScrollView>
  );
};

export default function ExploreScreen() {
  const [wallpapers, setWallpapers] = useState<MasonryItem[]>([]);
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
  const [filtersExpanded, setFiltersExpanded] = useState(false);
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

  // Function to calculate item height based on aspect ratio
  const calculateItemHeight = (resolution: string): number => {
    const [width, height] = resolution.split('x').map(Number);
    if (!width || !height) return 200; // fallback height
    
    const aspectRatio = height / width;
    const calculatedHeight = ITEM_WIDTH * aspectRatio;
    
    // Add some constraints to prevent extremely tall or short items
    const minHeight = 150;
    const maxHeight = 400;
    
    return Math.max(minHeight, Math.min(maxHeight, calculatedHeight));
  };
  
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

      // Enhance wallpapers with height and unique ID for masonry layout
      const wallpapersWithMasonryData: MasonryItem[] = response.data.map((wallpaper, index) => ({
        ...wallpaper,
        height: calculateItemHeight(wallpaper.resolution),
        uniqueId: `${wallpaper.id}_${Date.now()}_${index}`
      }));

      if (isRefreshing) {
        setWallpapers(wallpapersWithMasonryData);
      } else {
        // Replace previous wallpapers with new ones instead of appending
        setWallpapers(wallpapersWithMasonryData);
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

  const loadPrevious = () => {
    if (page > 1) {
      setLoadingMore(true);
      setPage(prev => prev - 1);
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
      // Check permissions
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Shiori needs storage permission to save wallpapers to your device.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Settings', onPress: () => Linking.openSettings() }
          ]
        );
        return;
      }

      // Get download location preference
      const downloadLocation = await AsyncStorage.getItem('downloadLocation') || 'gallery';
      
      // Generate a unique filename with timestamp to avoid conflicts
      const timestamp = new Date().getTime();
      const fileName = `shiori_${wallpaper.id}_${timestamp}.${wallpaper.file_type.split('/')[1] || 'jpg'}`;
      
      let fileUri: string;
      
      if (downloadLocation === 'gallery') {
        // Download to temporary directory first
        const tempUri = FileSystem.cacheDirectory + fileName;
        const downloadResumable = FileSystem.createDownloadResumable(
          wallpaper.thumbs.large,
          tempUri
        );

        const result = await downloadResumable.downloadAsync();
        if (!result) throw new Error('Download failed');

        // Save to media library
        const asset = await MediaLibrary.createAssetAsync(result.uri);
        
        // Try to save to album
        try {
          const album = await MediaLibrary.getAlbumAsync('Shiori');
          if (album) {
            await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
          } else {
            await MediaLibrary.createAlbumAsync('Shiori', asset, false);
          }
        } catch (error) {
          console.error('Album error:', error);
        }
        
        // Clean up temp file
        await FileSystem.deleteAsync(tempUri);
        
        if (Platform.OS === 'android') {
          ToastAndroid.show('Wallpaper saved to gallery', ToastAndroid.SHORT);
        } else {
          Alert.alert('Success', 'Wallpaper saved to your gallery');
        }
      } else {
        // Download to app's private directory
        const privateDir = FileSystem.documentDirectory + 'wallpapers/';
        
        // Ensure directory exists
        const dirInfo = await FileSystem.getInfoAsync(privateDir);
        if (!dirInfo.exists) {
          await FileSystem.makeDirectoryAsync(privateDir, { intermediates: true });
        }
        
        fileUri = privateDir + fileName;
        const downloadResumable = FileSystem.createDownloadResumable(
          wallpaper.thumbs.large,
          fileUri
        );

        const result = await downloadResumable.downloadAsync();
        if (!result) throw new Error('Download failed');

        if (Platform.OS === 'android') {
          ToastAndroid.show('Wallpaper saved to app storage', ToastAndroid.SHORT);
        } else {
          Alert.alert('Success', 'Wallpaper saved to app storage');
        }
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error('Download error:', error);
      Alert.alert('Error', 'Failed to download the wallpaper. Please try again.');
    }
  };

  const renderWallpaper = (item: MasonryItem, index: number) => {
    const isFavorite = favorites.includes(item.id);
    
    return (
      <Card 
        key={item.uniqueId} 
        style={[styles.wallpaperCard, { height: item.height }]} 
        mode="elevated"
      >
        <TouchableOpacity 
          onPress={() => router.push(`/wallpaper/${item.id}`)}
          activeOpacity={0.9}
          style={styles.touchableContainer}
        >
          <View style={styles.wallpaperContainer}>
            <Card.Cover 
              source={{ uri: item.thumbs.large }} 
              style={[styles.wallpaperImage, { height: item.height }]} 
            />
            
            {/* Glassmorphic buttons */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => toggleFavorite(item)}
              >
                <BlurView intensity={25} tint="dark" style={styles.blurView}>
                  <Heart
                    size={22}
                    color="#FFFFFF"
                    variant={isFavorite ? "Bold" : "Broken"}
                    style={styles.heartIcon}
                  />
                </BlurView>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => downloadWallpaper(item)}
              >
                <BlurView intensity={25} tint="dark" style={styles.blurView}>
                  <ArrowDown2
                    size={22}
                    color="#FFFFFF"
                    variant="Broken"
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
                <View style={styles.resolutionContainer}>
                  <InfoCircle size={16} color="#FFFFFF" variant="Broken" />
                  <Text style={[styles.resolution, { fontFamily: 'Nunito-Medium', fontSize: FontSizes.bodySmall }]}>
                    {item.resolution}
                  </Text>
                </View>
              </View>
            </LinearGradient>
          </View>
        </TouchableOpacity>
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
          <View style={styles.searchContainer}>
            <SearchNormal1 size={20} color={theme.colors.primary} variant="Broken" style={styles.searchIcon} />
            <Searchbar
              placeholder="Search wallpapers..."
              onChangeText={setSearchQuery}
              value={searchQuery}
              style={styles.searchBar}
              icon={() => null}
            />
          </View>

          <View style={styles.filterContainer}>
            <TouchableOpacity 
              style={styles.filterHeaderButton}
              onPress={() => setFiltersExpanded(!filtersExpanded)}
            >
              <View style={styles.filterHeader}>
                <Filter size={18} color={theme.colors.primary} variant="Broken" />
                <Text style={[styles.filterTitle, { fontFamily: 'Nunito-Bold', fontSize: FontSizes.body }]}>
                  Filters
                </Text>
                <View style={styles.filterExpandIcon}>
                  {filtersExpanded ? (
                    <ArrowUp2 size={20} color={theme.colors.primary} variant="Broken" />
                  ) : (
                    <ArrowDown2 size={20} color={theme.colors.primary} variant="Broken" />
                  )}
                </View>
              </View>
            </TouchableOpacity>

            {filtersExpanded && (
              <View style={styles.expandedFilters}>
                <View style={styles.subFilterHeader}>
                  <Sort size={16} color={theme.colors.onSurface} variant="Broken" />
                  <Text style={[styles.subFilterTitle, { fontFamily: 'Nunito-SemiBold', fontSize: FontSizes.bodySmall }]}>
                    Sort by
                  </Text>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.sortScroll}>
                  {sortOptions.map((sort) => (
                    <Chip
                      key={sort.id}
                      selected={selectedSort === sort.id}
                      onPress={() => setSelectedSort(sort.id)}
                      style={[
                        styles.sortChip,
                        selectedSort === sort.id && { 
                          backgroundColor: theme.colors.primaryContainer,
                          borderColor: theme.colors.primary
                        }
                      ]}
                      textStyle={[
                        selectedSort === sort.id && { 
                          color: theme.colors.primary,
                          fontFamily: 'Nunito-Bold'
                        }
                      ]}
                    >
                      {sort.label}
                    </Chip>
                  ))}
                </ScrollView>

                <View style={styles.subFilterHeader}>
                  <ArrowUp2 size={16} color={theme.colors.onSurface} variant="Broken" />
                  <Text style={[styles.subFilterTitle, { fontFamily: 'Nunito-SemiBold', fontSize: FontSizes.bodySmall }]}>
                    Order
                  </Text>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.orderScroll}>
                  {orderOptions.map((order) => (
                    <Chip
                      key={order.id}
                      selected={selectedOrder === order.id}
                      onPress={() => setSelectedOrder(order.id)}
                      style={[
                        styles.orderChip,
                        selectedOrder === order.id && { 
                          backgroundColor: theme.colors.primaryContainer,
                          borderColor: theme.colors.primary
                        }
                      ]}
                      textStyle={[
                        selectedOrder === order.id && { 
                          color: theme.colors.primary,
                          fontFamily: 'Nunito-Bold'
                        }
                      ]}
                    >
                      {order.label}
                    </Chip>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
          ) : (
            <MasonryGrid
              data={wallpapers}
              renderItem={renderWallpaper}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
              }
              ListFooterComponent={() => (
                hasMore ? (
                  <View style={styles.loadMoreContainer}>
                    <View style={styles.paginationButtons}>
                      {page > 1 && (
                        <TouchableOpacity 
                          style={[styles.paginationButton, { backgroundColor: theme.colors.surfaceVariant }]}
                          onPress={loadPrevious}
                          disabled={loadingMore}
                        >
                          <ArrowLeft2 size={20} color={theme.colors.primary} variant="Broken" />
                          <Text style={[styles.paginationText, { color: theme.colors.primary, fontFamily: 'Nunito-Bold', fontSize: FontSizes.body }]}>
                            Previous
                          </Text>
                        </TouchableOpacity>
                      )}
                      
                      <TouchableOpacity 
                        style={[styles.paginationButton, { backgroundColor: theme.colors.surfaceVariant }]}
                        onPress={loadMore}
                        disabled={loadingMore}
                      >
                        {loadingMore ? (
                          <ActivityIndicator size="small" color={theme.colors.primary} />
                        ) : (
                          <>
                            <Text style={[styles.paginationText, { color: theme.colors.primary, fontFamily: 'Nunito-Bold', fontSize: FontSizes.body }]}>
                              Next
                            </Text>
                            <ArrowRight2 size={20} color={theme.colors.primary} variant="Broken" />
                          </>
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : null
              )}
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
    paddingHorizontal: CONTAINER_PADDING,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 8,
  },
  searchIcon: {
    position: 'absolute',
    left: 16,
    zIndex: 1,
  },
  searchBar: {
    flex: 1,
    elevation: 2,
    borderRadius: 22,
    height: 50,
  },
  filterContainer: {
    marginBottom: 16,
  },
  filterHeaderButton: {
    backgroundColor: 'transparent',
    paddingVertical: 1,
    paddingHorizontal: 10,
  },
  filterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  filterTitle: {
    marginLeft: 8,
    flex: 1,
  },
  filterExpandIcon: {
    marginLeft: 'auto',
  },
  expandedFilters: {
    paddingTop: 8,
  },
  subFilterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    marginTop: 8,
  },
  subFilterTitle: {
    marginLeft: 6,
    opacity: 0.7,
  },
  sortScroll: {
    marginBottom: 16,
  },
  sortChip: {
    marginRight: 8,
  },
  orderScroll: {
    marginBottom: 16,
  },
  orderChip: {
    marginRight: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Masonry Grid Styles
  masonryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: Platform.OS === 'ios' ? 8 : 16,
  },
  column: {
    width: ITEM_WIDTH,
  },
  wallpaperCard: {
    width: ITEM_WIDTH,
    marginBottom: ITEM_MARGIN,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 3,
  },
  touchableContainer: {
    flex: 1,
  },
  wallpaperContainer: {
    position: 'relative',
    flex: 1,
  },
  wallpaperImage: {
    borderRadius: 0,
    width: '100%',
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
    height: 60,
    justifyContent: 'flex-end',
    padding: 12,
  },
  wallpaperInfo: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  resolutionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  resolution: {
    color: 'white',
    fontSize: FontSizes.bodySmall,
    fontFamily: 'Nunito-Medium',
  },
  loadMoreContainer: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  paginationButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  paginationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
    minWidth: 120,
    height: 40,
  },
  paginationText: {
    color: '#000000', // This will be overridden by the inline style
  },
});