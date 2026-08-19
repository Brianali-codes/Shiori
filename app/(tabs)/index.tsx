import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  StyleSheet,
  ScrollView,
  View,
  Image,
  TouchableOpacity,
  FlatList,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { SearchNormal1, Heart, Star, Flash, Category } from 'iconsax-react-nativejs';
import { Text, useTheme, Button, Avatar } from 'react-native-paper';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ThemedView } from '@/components/ThemedComponents';
import { wallhavenAPI, WallpaperPreview } from '../services/wallhaven';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { FontSizes } from '@/constants/FontSizes';
import LottieView from 'lottie-react-native';

const { width } = Dimensions.get('window');
const LIST_CARD_WIDTH = width * 0.42;
const LIST_CARD_HEIGHT = LIST_CARD_WIDTH * 1.55;
const GRID_CARD_WIDTH = (width - 44) / 2;
const GRID_CARD_HEIGHT = GRID_CARD_WIDTH * 1.55;

const categories = [
  { id: 'all', label: 'All' },
  { id: 'general', label: 'General' },
  { id: 'anime', label: 'Anime' },
  { id: 'people', label: 'People' },
];

export default function HomeScreen() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Safely get bottom tab bar height with fallback if rendered outside tab context
  let tabBarHeight = insets.bottom + 80;
  try {
    tabBarHeight = useBottomTabBarHeight();
  } catch (e) {
    // Uses fallback height
  }

  const [featuredWallpapers, setFeaturedWallpapers] = useState<WallpaperPreview[]>([]);
  const [latestWallpapers, setLatestWallpapers] = useState<WallpaperPreview[]>([]);
  const [topWallpapers, setTopWallpapers] = useState<WallpaperPreview[]>([]);
  const [moreWallpapers, setMoreWallpapers] = useState<WallpaperPreview[]>([]);
  const [morePage, setMorePage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Guard against duplicate concurrent fetches
  const isFetchingRef = useRef(false);

  const getCategoryParam = (category: string) => {
    if (category === 'general') return '100';
    if (category === 'anime') return '010';
    if (category === 'people') return '001';
    return '111';
  };

  const fetchWithFallback = async (primaryParams: any, fallbackParamsList: any[]): Promise<WallpaperPreview[]> => {
    const paramsWithSfw = { ...primaryParams, purity: '100' };
    try {
      const primaryRes = await wallhavenAPI.search(paramsWithSfw);
      if (primaryRes?.data && primaryRes.data.length > 0) {
        return primaryRes.data;
      }
    } catch (e) {
      console.warn('Primary fetch failed, attempting fallbacks...', e);
    }

    for (const fallbackParams of fallbackParamsList) {
      try {
        const fallbackRes = await wallhavenAPI.search({ ...fallbackParams, purity: '100' });
        if (fallbackRes?.data && fallbackRes.data.length > 0) {
          return fallbackRes.data;
        }
      } catch (err) {
        console.warn('Fallback fetch failed:', fallbackParams, err);
      }
    }

    return [];
  };

  const loadWallpapers = useCallback(async (isRefresh = false) => {
    if (isFetchingRef.current && !isRefresh) return;
    isFetchingRef.current = true;

    try {
      if (isRefresh) {
        wallhavenAPI.clearCache();
      } else {
        setLoading(true);
      }

      const categoryParam = getCategoryParam(selectedCategory);

      const featuredData = await (async () => {
        try {
          const randomResponse = await wallhavenAPI.getRandomWallpapers();
          if (randomResponse?.data && randomResponse.data.length > 0) {
            return randomResponse.data;
          }
        } catch (e) {
          console.warn('Random wallpapers fetch failed, trying search fallback...');
        }
        return await fetchWithFallback(
          { categories: categoryParam, sorting: 'hot', page: 1 },
          [{ categories: categoryParam, sorting: 'toplist', page: 1 }]
        );
      })();

      const latestData = await fetchWithFallback(
        { categories: categoryParam, sorting: 'date_added', order: 'desc', page: 1 },
        [{ categories: categoryParam, page: 1 }]
      );

      const topData = await fetchWithFallback(
        { categories: categoryParam, sorting: 'toplist', order: 'desc', page: 1 },
        [{ categories: categoryParam, sorting: 'views', order: 'desc', page: 1 }]
      );

      const moreData = await fetchWithFallback(
        { categories: categoryParam, sorting: 'random', page: 1 },
        [{ categories: categoryParam, page: 1 }]
      );

      setFeaturedWallpapers(featuredData.slice(0, 9));
      setLatestWallpapers(latestData.slice(0, 9));
      setTopWallpapers(topData.slice(0, 9));
      setMoreWallpapers(moreData.slice(0, 16));

      setMorePage(2);
      setHasMore(true);
    } catch (error) {
      console.error('Error loading wallpapers:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
      isFetchingRef.current = false;
    }
  }, [selectedCategory]);

  useEffect(() => {
    loadWallpapers();
  }, [selectedCategory, loadWallpapers]);

  const loadMoreWallpapers = async () => {
    if (loadingMore || !hasMore) return;

    try {
      setLoadingMore(true);
      const categoryParam = getCategoryParam(selectedCategory);

      const data = await fetchWithFallback(
        { categories: categoryParam, sorting: 'random', page: morePage },
        [{ categories: categoryParam, page: morePage }]
      );

      if (data.length === 0) {
        setHasMore(false);
        return;
      }

      setMoreWallpapers(prev => [...prev, ...data]);
      setMorePage(prev => prev + 1);
    } catch (error) {
      console.error('Error loading more wallpapers:', error);
    } finally {
      setLoadingMore(false);
    }
  };

  const navigateToWallpaper = (id: string) => router.push(`/wallpaper/${id}`);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadWallpapers(true);
  };

  const renderListCard = ({ item }: { item: WallpaperPreview }) => (
    <TouchableOpacity
      style={styles.listCard}
      onPress={() => navigateToWallpaper(item.id)}
      activeOpacity={0.88}
    >
      <Image source={{ uri: item.thumbs.large }} style={styles.cardImage} />
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.8)']}
        style={styles.cardGradientCompact}
      >
        <View style={styles.glassBadgeContainerCompact}>
          <Text style={styles.badgeTextSmall}>{item.resolution}</Text>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.loader}>
        <LottieView
          source={require('../../assets/animations/loader.json')}
          autoPlay
          loop
          style={{ width: 140, height: 140 }}
        />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ThemedView style={styles.container}>
        <StatusBar style="light" />
        <Stack.Screen options={{ headerShown: false }} />

        {/* Floating Header */}
        <View style={styles.headerContainer}>
          <View style={styles.headerBrand}>
            <Avatar.Image size={40} source={require('@/assets/images/shiori.png')} />
            <View style={styles.headerTextCol}>
              <Text style={styles.appTitle}>Shiori</Text>
              <Text style={styles.subtitle}>Curated Aesthetics</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.glassIconButton}
            onPress={() => router.push('/explore')}
            activeOpacity={0.7}
          >
            <SearchNormal1 size={18} color="#FFF" variant="Outline" />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={{ paddingBottom: tabBarHeight + 24 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[theme.colors.primary]}
              tintColor={theme.colors.primary}
            />
          }
        >
          {/* Categories Pill Bar */}
          <View style={styles.categoriesSection}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesScroll}>
              {categories.map((category) => {
                const isSelected = selectedCategory === category.id;
                return (
                  <TouchableOpacity
                    key={category.id}
                    onPress={() => setSelectedCategory(category.id)}
                    activeOpacity={0.8}
                    style={[
                      styles.glassCategoryChip,
                      isSelected && styles.glassCategoryChipActive,
                    ]}
                  >
                    <Text style={[styles.categoryText, isSelected && styles.categoryTextActive]}>
                      {category.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Featured Showcase */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.titleRow}>
                <Star size={18} color={theme.colors.primary} variant="Bold" />
                <Text style={styles.sectionTitle}>Featured Showcase</Text>
              </View>
              <Button mode="text" onPress={() => router.push('/explore')} compact labelStyle={styles.seeAllLabel}>
                Explore
              </Button>
            </View>

            <FlatList
              data={featuredWallpapers}
              horizontal
              showsHorizontalScrollIndicator={false}
              renderItem={renderListCard}
              contentContainerStyle={styles.horizontalList}
              snapToInterval={LIST_CARD_WIDTH + 12}
              decelerationRate="fast"
              snapToAlignment="start"
              keyExtractor={(item) => item.id}
            />
          </View>

          {/* Latest Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.titleRow}>
                <Flash size={18} color={theme.colors.primary} variant="Bold" />
                <Text style={styles.sectionTitle}>Fresh Drops</Text>
              </View>
              <Button mode="text" onPress={() => router.push('/explore')} compact labelStyle={styles.seeAllLabel}>
                Explore
              </Button>
            </View>

            <FlatList
              data={latestWallpapers}
              horizontal
              showsHorizontalScrollIndicator={false}
              renderItem={renderListCard}
              contentContainerStyle={styles.horizontalList}
              snapToInterval={LIST_CARD_WIDTH + 12}
              decelerationRate="fast"
              snapToAlignment="start"
              keyExtractor={(item) => item.id}
            />
          </View>

          {/* Top Rated Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.titleRow}>
                <Heart size={18} color={theme.colors.primary} variant="Bold" />
                <Text style={styles.sectionTitle}>Top Rated</Text>
              </View>
              <Button mode="text" onPress={() => router.push('/explore')} compact labelStyle={styles.seeAllLabel}>
                Explore
              </Button>
            </View>

            <FlatList
              data={topWallpapers}
              horizontal
              showsHorizontalScrollIndicator={false}
              renderItem={renderListCard}
              contentContainerStyle={styles.horizontalList}
              snapToInterval={LIST_CARD_WIDTH + 12}
              decelerationRate="fast"
              snapToAlignment="start"
              keyExtractor={(item) => item.id}
            />
          </View>

          {/* Wallpapers Grid */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.titleRow}>
                <Category size={18} color={theme.colors.primary} variant="Bold" />
                <Text style={styles.sectionTitle}>Discover More</Text>
              </View>
            </View>

            <View style={styles.gridContainer}>
              {moreWallpapers.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.gridCard}
                  onPress={() => navigateToWallpaper(item.id)}
                  activeOpacity={0.88}
                >
                  <Image source={{ uri: item.thumbs.large }} style={styles.cardImage} />
                  <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.8)']}
                    style={styles.cardGradientCompact}
                  >
                    <View style={styles.glassBadgeContainerCompact}>
                      <Text style={styles.badgeTextSmall}>{item.resolution}</Text>
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              ))}
            </View>

            {hasMore && (
              <TouchableOpacity
                onPress={loadMoreWallpapers}
                disabled={loadingMore}
                activeOpacity={0.8}
                style={styles.glassLoadMoreBtn}
              >
                <Text style={styles.loadMoreText}>
                  {loadingMore ? 'Loading...' : 'Load More Wallpapers'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
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
  scrollView: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  /* Header Glass Bar */
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerBrand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTextCol: {
    flexDirection: 'column',
  },
  appTitle: {
    fontFamily: 'Nunito-Bold',
    fontSize: FontSizes.h3,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontFamily: 'Nunito-Regular',
    fontSize: FontSizes.caption,
    opacity: 0.6,
  },
  glassIconButton: {
    padding: 10,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },

  /* Categories Section */
  categoriesSection: {
    marginVertical: 8,
  },
  categoriesScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  glassCategoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  glassCategoryChipActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  categoryText: {
    fontFamily: 'Nunito-Bold',
    fontSize: FontSizes.caption,
    opacity: 0.7,
  },
  categoryTextActive: {
    opacity: 1,
  },

  /* Section Styling */
  section: {
    paddingVertical: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontFamily: 'Nunito-Bold',
    fontSize: FontSizes.h4,
  },
  seeAllLabel: {
    fontFamily: 'Nunito-Bold',
    fontSize: FontSizes.caption,
  },

  /* Card Components */
  cardImage: {
    width: '100%',
    height: '100%',
  },
  horizontalList: {
    paddingHorizontal: 16,
    gap: 12,
  },
  listCard: {
    width: LIST_CARD_WIDTH,
    height: LIST_CARD_HEIGHT,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },

  /* Grid Layout */
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 12,
  },
  gridCard: {
    width: GRID_CARD_WIDTH,
    height: GRID_CARD_HEIGHT,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },

  /* Glass Overlays & Badges */
  cardGradientCompact: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
    justifyContent: 'flex-end',
    padding: 8,
  },
  glassBadgeContainerCompact: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  badgeTextSmall: {
    color: '#FFF',
    fontSize: 10,
    fontFamily: 'Nunito-Bold',
  },

  /* Load More */
  glassLoadMoreBtn: {
    alignSelf: 'center',
    marginTop: 20,
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
  },
  loadMoreText: {
    fontFamily: 'Nunito-Bold',
    fontSize: FontSizes.body,
  },
} as const);