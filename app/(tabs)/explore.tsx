import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  RefreshControl,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { Card, Text, ActivityIndicator, useTheme, Searchbar, Chip } from 'react-native-paper';
import { ThemedView } from '@/components/ThemedComponents';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { wallhavenAPI, WallpaperPreview } from '../services/wallhaven';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import {
  Heart,
  ArrowDown2,
  InfoCircle,
  SearchNormal1,
  Sort,
  ArrowUp2,
  Filter,
  ArrowLeft2,
  ArrowRight2,
  EmojiHappy,
} from 'iconsax-react-nativejs';
import * as Haptics from 'expo-haptics';
import { FontSizes } from '@/constants/FontSizes';

const { width: screenWidth } = Dimensions.get('window');
const COLUMN_COUNT = 2;
const ITEM_MARGIN = 12;
const CONTAINER_PADDING = 12;
const ITEM_WIDTH =
  (screenWidth - CONTAINER_PADDING * 2 - ITEM_MARGIN * (COLUMN_COUNT - 1)) / COLUMN_COUNT;

interface MasonryItem extends WallpaperPreview {
  height: number;
  uniqueId: string;
}

const MasonryGrid: React.FC<{
  data: MasonryItem[];
  renderItem: (item: MasonryItem, index: number) => React.ReactElement;
  refreshControl?: React.ReactElement<any>;
  ListFooterComponent?: () => React.ReactElement | null;
  contentContainerStyle?: StyleProp<ViewStyle>;
}> = ({ data, renderItem, refreshControl, ListFooterComponent, contentContainerStyle }) => {
  const [columns, setColumns] = useState<MasonryItem[][]>(
    Array(COLUMN_COUNT)
      .fill([])
      .map(() => [])
  );

  useEffect(() => {
    const newColumns: MasonryItem[][] = Array(COLUMN_COUNT)
      .fill([])
      .map(() => []);
    const newColumnHeights = Array(COLUMN_COUNT).fill(0);

    data.forEach((item) => {
      const shortestColumnIndex = newColumnHeights.indexOf(Math.min(...newColumnHeights));
      newColumns[shortestColumnIndex].push(item);
      newColumnHeights[shortestColumnIndex] += item.height + ITEM_MARGIN;
    });

    setColumns(newColumns);
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
      contentContainerStyle={contentContainerStyle}
    >
      <View style={styles.masonryContainer}>
        {columns.map((columnData, columnIndex) => renderColumn(columnData, columnIndex))}
      </View>
      {ListFooterComponent && <ListFooterComponent />}
    </ScrollView>
  );
};

export default function ExploreScreen() {
  const params = useLocalSearchParams<{ q?: string }>();
  const tagQuery = Array.isArray(params.q) ? params.q[0] : params.q;

  const [wallpapers, setWallpapers] = useState<MasonryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState(tagQuery || '');
  const [selectedSort, setSelectedSort] = useState('date_added');
  const [selectedOrder, setSelectedOrder] = useState('desc');
  const [favorites, setFavorites] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const floatingTabBarClearance = 60 + Math.max(insets.bottom + 8, 18) + 16;

  // Sync route query parameter updates (e.g. navigating from a tag click)
  useEffect(() => {
    if (tagQuery !== undefined) {
      setSearchQuery(tagQuery);
    }
  }, [tagQuery]);

  useEffect(() => {
    const loadFavorites = async () => {
      try {
        const savedFavorites = await AsyncStorage.getItem('@shiori_favorites');
        if (savedFavorites) {
          const parsedFavorites: WallpaperPreview[] = JSON.parse(savedFavorites);
          const favoriteIds = parsedFavorites.map((item) => String(item.id));
          setFavorites(favoriteIds);
        }
      } catch (error) {
        console.error('Failed to load favorites:', error);
      }
    };

    loadFavorites();
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

  const calculateItemHeight = (resolution: string): number => {
    if (!resolution) return 200;
    const [width, height] = resolution.split('x').map(Number);
    if (!width || !height) return 200;

    const aspectRatio = height / width;
    const calculatedHeight = ITEM_WIDTH * aspectRatio;

    const minHeight = 150;
    const maxHeight = 400;

    return Math.max(minHeight, Math.min(maxHeight, calculatedHeight));
  };

  const toggleFavorite = async (wallpaper: WallpaperPreview) => {
    try {
      const wallpaperId = String(wallpaper.id);
      const savedFavorites = await AsyncStorage.getItem('@shiori_favorites');
      let favoritesArray: WallpaperPreview[] = savedFavorites ? JSON.parse(savedFavorites) : [];

      const isFavorite = favorites.includes(wallpaperId);

      let updatedFavoritesArray: WallpaperPreview[];
      let updatedFavoriteIds: string[];

      if (isFavorite) {
        updatedFavoritesArray = favoritesArray.filter((item) => String(item.id) !== wallpaperId);
        updatedFavoriteIds = favorites.filter((id) => id !== wallpaperId);
      } else {
        updatedFavoritesArray = [...favoritesArray, wallpaper];
        updatedFavoriteIds = [...favorites, wallpaperId];
      }

      setFavorites(updatedFavoriteIds);
      await AsyncStorage.setItem('@shiori_favorites', JSON.stringify(updatedFavoritesArray));

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const fetchWallpapers = useCallback(
    async (targetPage: number, isRefresh = false) => {
      try {
        setErrorMessage(null);
        if (!isRefresh && targetPage === 1) {
          setLoading(true);
        }

        const response = await wallhavenAPI.search({
          q: searchQuery,
          sorting: selectedSort as any,
          order: selectedOrder as any,
          page: targetPage,
          purity: '100', // Strictly SFW only
        });

        if (!response?.data || response.data.length === 0) {
          setWallpapers([]);
          setHasMore(false);
          return;
        }

        const wallpapersWithMasonryData: MasonryItem[] = response.data.map((wallpaper, index) => ({
          ...wallpaper,
          height: calculateItemHeight(wallpaper.resolution),
          uniqueId: `${wallpaper.id}_${targetPage}_${index}`,
        }));

        setWallpapers(wallpapersWithMasonryData);
        setHasMore(response.data.length > 0);
      } catch (error: any) {
        console.error('Error loading wallpapers:', error);
        setErrorMessage(error?.message || 'Unable to load wallpapers. Please check your connection.');
        setWallpapers([]);
      } finally {
        setLoading(false);
        setLoadingMore(false);
        setRefreshing(false);
      }
    },
    [searchQuery, selectedSort, selectedOrder]
  );

  useEffect(() => {
    if (page !== 1) {
      setPage(1);
    } else {
      fetchWallpapers(1);
    }
  }, [searchQuery, selectedSort, selectedOrder]);

  useEffect(() => {
    fetchWallpapers(page);
  }, [page, fetchWallpapers]);

  const onRefresh = async () => {
    setRefreshing(true);
    if (page !== 1) {
      setPage(1);
    } else {
      await fetchWallpapers(1, true);
    }
  };

  const loadMore = () => {
    if (!loadingMore && hasMore) {
      setLoadingMore(true);
      setPage((prev) => prev + 1);
    }
  };

  const loadPrevious = () => {
    if (page > 1 && !loadingMore) {
      setLoadingMore(true);
      setPage((prev) => prev - 1);
    }
  };

  const renderWallpaper = (item: MasonryItem, index: number) => {
    const isFavorite = favorites.includes(String(item.id));

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
              source={{ uri: item.thumbs?.large || item.thumbs?.original }}
              style={[styles.wallpaperImage, { height: item.height }]}
            />

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={(e) => {
                  e.stopPropagation();
                  toggleFavorite(item);
                }}
              >
                <BlurView intensity={25} tint="dark" style={styles.blurView}>
                  <Heart
                    size={22}
                    color={isFavorite ? '#FF4D4D' : '#FFFFFF'}
                    variant={isFavorite ? 'Bold' : 'Broken'}
                    style={styles.heartIcon}
                  />
                </BlurView>
              </TouchableOpacity>
            </View>

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
    <SafeAreaView style={styles.safeArea} edges={['top']}>
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
                          borderColor: theme.colors.primary,
                        },
                      ]}
                      textStyle={[
                        selectedSort === sort.id && {
                          color: theme.colors.primary,
                          fontFamily: 'Nunito-Bold',
                        },
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
                          borderColor: theme.colors.primary,
                        },
                      ]}
                      textStyle={[
                        selectedOrder === order.id && {
                          color: theme.colors.primary,
                          fontFamily: 'Nunito-Bold',
                        },
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
          ) : wallpapers.length === 0 ? (
            <ScrollView
              contentContainerStyle={[styles.emptyScrollContent, { paddingBottom: floatingTabBarClearance }]}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.emptyContainer}>
                <SearchNormal1 size={52} color={theme.colors.primary} variant="Broken" style={styles.emptyIcon} />
                <Text style={[styles.emptyTitle, { color: theme.colors.onSurface, fontFamily: 'Nunito-Bold' }]}>
                  {errorMessage ? 'Connection Error' : 'No Wallpapers Found'}
                </Text>
                <Text style={[styles.emptySubtitle, { color: theme.colors.onSurfaceVariant, fontFamily: 'Nunito-Medium' }]}>
                  {errorMessage
                    ? errorMessage
                    : searchQuery
                    ? `No results match "${searchQuery}". Try using different terms or resetting filters.`
                    : 'No wallpapers were found for the selected category or filters.'}
                </Text>

                {searchQuery.length > 0 && (
                  <TouchableOpacity
                    style={[styles.clearSearchButton, { backgroundColor: theme.colors.primaryContainer }]}
                    onPress={() => setSearchQuery('')}
                  >
                    <Text style={[styles.clearSearchText, { color: theme.colors.primary, fontFamily: 'Nunito-Bold' }]}>
                      Clear Search
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </ScrollView>
          ) : (
            <MasonryGrid
              data={wallpapers}
              renderItem={renderWallpaper}
              contentContainerStyle={{ paddingBottom: floatingTabBarClearance }}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
              }
              ListFooterComponent={() =>
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
              }
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
  emptyScrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  emptyIcon: {
    opacity: 0.8,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: FontSizes.body,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: FontSizes.body,
    textAlign: 'center',
    opacity: 0.7,
    lineHeight: 20,
    marginBottom: 20,
  },
  clearSearchButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  clearSearchText: {
    fontSize: FontSizes.body,
  },
  masonryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
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
    zIndex: 2,
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
  paginationText: {},
});