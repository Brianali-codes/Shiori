import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import {
  StyleSheet,
  ScrollView,
  View,
  Image,
  TouchableOpacity,
  FlatList,
  Dimensions,
  RefreshControl,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Animated,
  Modal,
} from 'react-native';
import {
  SunFog,
  Heart,
  Star,
  Flash,
  Category,
  ArrowRight2,
  SearchNormal1,
  Star1,
} from 'iconsax-react-nativejs';
import { Text, useTheme as usePaperTheme, Avatar } from 'react-native-paper';
import { useThemeContext } from '@/contexts/ThemeContext';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ThemedView } from '@/components/ThemedComponents';
import { wallhavenAPI, WallpaperPreview } from '../services/wallhaven';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { FontSizes } from '@/constants/FontSizes';

const { width } = Dimensions.get('window');
const LIST_CARD_WIDTH = width * 0.42;
const LIST_CARD_HEIGHT = LIST_CARD_WIDTH * 1.55;
const CARD_GAP = 12;
const SNAP_INTERVAL = LIST_CARD_WIDTH + CARD_GAP;

const GRID_CARD_WIDTH = (width - 44) / 2;
const GRID_CARD_HEIGHT = GRID_CARD_WIDTH * 1.55;

const categories = [
  { id: 'all', label: 'All' },
  { id: 'general', label: 'General' },
  { id: 'anime', label: 'Anime' },
  { id: 'people', label: 'People' },
];

interface FeaturedItem extends WallpaperPreview {
  virtualId?: string;
}

// Adaptive Skeleton Item
const SkeletonItem = ({ style, isLight }: { style: any; isLight: boolean }) => {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.7,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        style,
        {
          opacity,
          backgroundColor: isLight ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.12)',
        },
      ]}
    />
  );
};

export default function HomeScreen() {
  const paperTheme = usePaperTheme();
  const { theme, setTheme } = useThemeContext();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const isLight = theme === 'light';
  const dynamicIconColor = isLight ? paperTheme.colors.onSurface : '#FFF';

  // Dynamic Theme Colors
  const dynamicGlassBg = isLight ? 'rgba(0, 0, 0, 0.03)' : 'rgba(255, 255, 255, 0.04)';
  const dynamicGlassBorder = isLight ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.08)';
  const dynamicBadgeBg = isLight ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.06)';
  const dynamicBadgeBorder = isLight ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.1)';
  const dynamicSubtextColor = isLight ? 'rgba(0, 0, 0, 0.65)' : 'rgba(255, 255, 255, 0.75)';

  let tabBarHeight = insets.bottom + 80;
  try {
    tabBarHeight = useBottomTabBarHeight();
  } catch (e) {
    // Fallback height
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

  const [themeModalVisible, setThemeModalVisible] = useState(false);
  const [featuredIndex, setFeaturedIndex] = useState(0);
  const featuredFlatListRef = useRef<FlatList<FeaturedItem>>(null);
  const isFetchingRef = useRef(false);

  const displayFeaturedWallpapers: FeaturedItem[] = useMemo(() => {
    if (featuredWallpapers.length <= 1) return featuredWallpapers;
    return Array.from({ length: 30 }, (_, i) => ({
      ...featuredWallpapers[i % featuredWallpapers.length],
      virtualId: `${featuredWallpapers[i % featuredWallpapers.length].id}-v-${i}`,
    }));
  }, [featuredWallpapers]);

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
        [{ categories: categoryParam, page: 1 }]
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

  useEffect(() => {
    if (featuredWallpapers.length > 1) {
      const initialIndex = Math.floor(15 / featuredWallpapers.length) * featuredWallpapers.length;
      setFeaturedIndex(initialIndex);
      setTimeout(() => {
        featuredFlatListRef.current?.scrollToIndex({
          index: initialIndex,
          animated: false,
        });
      }, 100);
    }
  }, [featuredWallpapers]);

  useEffect(() => {
    if (featuredWallpapers.length <= 1) return;

    const interval = setInterval(() => {
      setFeaturedIndex((prevIndex) => {
        const nextIndex = prevIndex + 1;
        featuredFlatListRef.current?.scrollToIndex({
          index: nextIndex,
          animated: true,
        });
        return nextIndex;
      });
    }, 3500);

    return () => clearInterval(interval);
  }, [featuredWallpapers]);

  const onFeaturedScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const currentIndex = Math.round(contentOffsetX / SNAP_INTERVAL);
    if (currentIndex >= 0 && currentIndex < displayFeaturedWallpapers.length && currentIndex !== featuredIndex) {
      setFeaturedIndex(currentIndex);
    }
  };

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

      setMoreWallpapers((prev) => [...prev, ...data]);
      setMorePage((prev) => prev + 1);
    } catch (error) {
      console.error('Error loading more wallpapers:', error);
    } finally {
      setLoadingMore(false);
    }
  };

  const navigateToWallpaper = useCallback(
    (id: string) => router.push(`/wallpaper/${id}`),
    [router]
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadWallpapers(true);
  };

  const renderListCard = useCallback(
    ({ item }: { item: WallpaperPreview }) => (
      <TouchableOpacity
        style={[
          styles.listCard,
          {
            backgroundColor: dynamicGlassBg,
            borderColor: dynamicGlassBorder,
          },
        ]}
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
    ),
    [navigateToWallpaper, dynamicGlassBg, dynamicGlassBorder]
  );

 if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ThemedView style={styles.container}>
          <StatusBar style={isLight ? 'dark' : 'light'} />
          <Stack.Screen options={{ headerShown: false }} />

          {/* Header Skeleton */}
          <View
            style={[
              styles.headerContainer,
              { backgroundColor: dynamicGlassBg, borderColor: dynamicGlassBorder },
            ]}
          >
            <View style={styles.headerBrand}>
              <SkeletonItem isLight={isLight} style={{ width: 42, height: 42, borderRadius: 21 }} />
              <View style={styles.headerTextCol}>
                <SkeletonItem isLight={isLight} style={{ width: 120, height: 18, borderRadius: 6, marginBottom: 6 }} />
                <SkeletonItem isLight={isLight} style={{ width: 90, height: 12, borderRadius: 4 }} />
              </View>
            </View>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <SkeletonItem isLight={isLight} style={{ width: 38, height: 38, borderRadius: 16 }} />
              <SkeletonItem isLight={isLight} style={{ width: 38, height: 38, borderRadius: 16 }} />
            </View>
          </View>

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={{ paddingBottom: tabBarHeight + 24 }}
            showsVerticalScrollIndicator={false}
          >
            {/* Categories Skeleton */}
            <View style={styles.categoriesSection}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesScroll}>
                {[1, 2, 3, 4, 5].map((i) => (
                  <SkeletonItem isLight={isLight} key={i} style={{ width: 80, height: 34, borderRadius: 20 }} />
                ))}
              </ScrollView>
            </View>

            {/* Horizontal Sections Skeleton (Featured Showcase, Fresh Drops, Top Rated) */}
            {[1, 2, 3].map((sectionKey) => (
              <View style={styles.section} key={sectionKey}>
                <View style={styles.sectionHeader}>
                  <SkeletonItem isLight={isLight} style={{ width: 140, height: 20, borderRadius: 6 }} />
                  <SkeletonItem isLight={isLight} style={{ width: 32, height: 32, borderRadius: 12 }} />
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalList}>
                  {[1, 2, 3].map((i) => (
                    <SkeletonItem isLight={isLight} key={i} style={styles.listCard} />
                  ))}
                </ScrollView>
              </View>
            ))}

            {/* Discover More Grid Skeleton */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <SkeletonItem isLight={isLight} style={{ width: 130, height: 20, borderRadius: 6 }} />
              </View>
              <View style={styles.gridContainer}>
                {[1, 2, 3, 4].map((i) => (
                  <SkeletonItem isLight={isLight} key={i} style={styles.gridCard} />
                ))}
              </View>
            </View>
          </ScrollView>
        </ThemedView>
      </SafeAreaView>
    );
  }

  const activeRealIndex = featuredWallpapers.length > 0 ? featuredIndex % featuredWallpapers.length : 0;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ThemedView style={styles.container}>
        <StatusBar style={isLight ? 'dark' : 'light'} />
        <Stack.Screen options={{ headerShown: false }} />

        {/* Dynamic Floating Header */}
        <View
          style={[
            styles.headerContainer,
            {
              backgroundColor: dynamicGlassBg,
              borderColor: dynamicGlassBorder,
            },
          ]}
        >
          <View style={styles.headerBrand}>
            <LinearGradient
              colors={[paperTheme.colors.primary, isLight ? 'rgba(0, 0, 0, 0.15)' : 'rgba(255, 255, 255, 0.2)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.logoGradientRing}
            >
              <Avatar.Image size={38} source={require('@/assets/images/shiori.png')} />
            </LinearGradient>

            <View style={styles.headerTextCol}>
              <Text style={[styles.appTitle, { color: paperTheme.colors.onSurface }]}>
                Shiori Wallpapers
              </Text>

              <View
                style={[
                  styles.subtitleBadge,
                  {
                    backgroundColor: dynamicBadgeBg,
                    borderColor: dynamicBadgeBorder,
                  },
                ]}
              >
                <Star1 size={10} color={paperTheme.colors.primary} variant="Bold" />
                <Text style={[styles.subtitleBadgeText, { color: dynamicSubtextColor }]}>
                  Curated Aesthetics
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.actionGroup}>
            <TouchableOpacity
              style={[
                styles.glassIconButton,
                {
                  backgroundColor: dynamicBadgeBg,
                  borderColor: dynamicBadgeBorder,
                },
              ]}
              onPress={() => router.push('/explore')}
              activeOpacity={0.7}
            >
              <SearchNormal1 size={18} color={dynamicIconColor} variant="Outline" />
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.glassIconButton,
                {
                  backgroundColor: dynamicBadgeBg,
                  borderColor: dynamicBadgeBorder,
                },
              ]}
              onPress={() => setThemeModalVisible(true)}
              activeOpacity={0.7}
            >
              <SunFog size={18} color={dynamicIconColor} variant="Outline" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Theme Modal */}
        <Modal
          visible={themeModalVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setThemeModalVisible(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setThemeModalVisible(false)}
          >
            <View
              style={[
                styles.modalContent,
                {
                  backgroundColor: paperTheme.colors.elevation.level3,
                  borderColor: dynamicGlassBorder,
                },
              ]}
              onStartShouldSetResponder={() => true}
            >
              <Text style={[styles.modalTitle, { color: paperTheme.colors.onSurface }]}>
                Choose Theme
              </Text>

              {[
                { id: 'dark', label: 'Dark' },
                { id: 'light', label: 'Light' },
                { id: 'amoled', label: 'AMOLED' },
              ].map((item) => {
                const isSelected = theme === item.id;
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      styles.themeOption,
                      {
                        backgroundColor: isSelected
                          ? paperTheme.colors.primaryContainer
                          : dynamicBadgeBg,
                        borderColor: isSelected
                          ? paperTheme.colors.primary
                          : dynamicBadgeBorder,
                      },
                    ]}
                    onPress={() => {
                      setTheme(item.id as 'dark' | 'light' | 'amoled');
                      setThemeModalVisible(false);
                    }}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.themeOptionText,
                        {
                          color: isSelected
                            ? paperTheme.colors.onPrimaryContainer
                            : paperTheme.colors.onSurface,
                        },
                      ]}
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </TouchableOpacity>
        </Modal>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={{ paddingBottom: tabBarHeight + 24 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[paperTheme.colors.primary]}
              tintColor={paperTheme.colors.primary}
            />
          }
        >
          {/* Dynamic Categories Bar */}
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
                      {
                        backgroundColor: isSelected
                          ? paperTheme.colors.primary
                          : dynamicBadgeBg,
                        borderColor: isSelected
                          ? paperTheme.colors.primary
                          : dynamicBadgeBorder,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.categoryText,
                        {
                          color: isSelected
                            ? paperTheme.colors.onPrimary
                            : paperTheme.colors.onSurface,
                          opacity: isSelected ? 1 : 0.7,
                        },
                      ]}
                    >
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
                <Star size={18} color={paperTheme.colors.primary} variant="Bold" />
                <Text style={[styles.sectionTitle, { color: paperTheme.colors.onSurface }]}>
                  Featured Showcase
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => router.push('/explore')}
                activeOpacity={0.7}
                style={[styles.exploreIconBtn, { backgroundColor: dynamicBadgeBg }]}
              >
                <ArrowRight2 size={20} color={paperTheme.colors.primary} variant="Outline" />
              </TouchableOpacity>
            </View>

            <FlatList
              ref={featuredFlatListRef}
              data={displayFeaturedWallpapers}
              horizontal
              showsHorizontalScrollIndicator={false}
              renderItem={renderListCard}
              contentContainerStyle={styles.horizontalList}
              snapToInterval={SNAP_INTERVAL}
              decelerationRate="fast"
              snapToAlignment="start"
              keyExtractor={(item) => item.virtualId || item.id}
              onMomentumScrollEnd={onFeaturedScroll}
              getItemLayout={(_, index) => ({
                length: SNAP_INTERVAL,
                offset: SNAP_INTERVAL * index,
                index,
              })}
              initialNumToRender={4}
              maxToRenderPerBatch={4}
              windowSize={5}
              removeClippedSubviews={true}
            />

            {/* Indicator */}
            {featuredWallpapers.length > 0 && (
              <View style={styles.indicatorContainer}>
                {featuredWallpapers.map((_, index) => (
                  <View
                    key={index}
                    style={[
                      styles.indicatorDot,
                      { backgroundColor: isLight ? 'rgba(0, 0, 0, 0.15)' : 'rgba(255, 255, 255, 0.2)' },
                      index === activeRealIndex && [
                        styles.indicatorDotActive,
                        { backgroundColor: paperTheme.colors.primary },
                      ],
                    ]}
                  />
                ))}
              </View>
            )}
          </View>

          {/* Fresh Drops */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.titleRow}>
                <Flash size={18} color={paperTheme.colors.primary} variant="Bold" />
                <Text style={[styles.sectionTitle, { color: paperTheme.colors.onSurface }]}>
                  Fresh Drops
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => router.push('/explore')}
                activeOpacity={0.7}
                style={[styles.exploreIconBtn, { backgroundColor: dynamicBadgeBg }]}
              >
                <ArrowRight2 size={20} color={paperTheme.colors.primary} variant="Outline" />
              </TouchableOpacity>
            </View>

            <FlatList
              data={latestWallpapers}
              horizontal
              showsHorizontalScrollIndicator={false}
              renderItem={renderListCard}
              contentContainerStyle={styles.horizontalList}
              snapToInterval={SNAP_INTERVAL}
              decelerationRate="fast"
              snapToAlignment="start"
              keyExtractor={(item) => item.id}
            />
          </View>

          {/* Top Rated */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.titleRow}>
                <Heart size={18} color={paperTheme.colors.primary} variant="Bold" />
                <Text style={[styles.sectionTitle, { color: paperTheme.colors.onSurface }]}>
                  Top Rated
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => router.push('/explore')}
                activeOpacity={0.7}
                style={[styles.exploreIconBtn, { backgroundColor: dynamicBadgeBg }]}
              >
                <ArrowRight2 size={20} color={paperTheme.colors.primary} variant="Outline" />
              </TouchableOpacity>
            </View>

            <FlatList
              data={topWallpapers}
              horizontal
              showsHorizontalScrollIndicator={false}
              renderItem={renderListCard}
              contentContainerStyle={styles.horizontalList}
              snapToInterval={SNAP_INTERVAL}
              decelerationRate="fast"
              snapToAlignment="start"
              keyExtractor={(item) => item.id}
            />
          </View>

          {/* Grid View */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.titleRow}>
                <Category size={18} color={paperTheme.colors.primary} variant="Bold" />
                <Text style={[styles.sectionTitle, { color: paperTheme.colors.onSurface }]}>
                  Discover More
                </Text>
              </View>
            </View>

            <View style={styles.gridContainer}>
              {moreWallpapers.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.gridCard,
                    {
                      backgroundColor: dynamicGlassBg,
                      borderColor: dynamicGlassBorder,
                    },
                  ]}
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
                style={[
                  styles.glassLoadMoreBtn,
                  {
                    backgroundColor: dynamicBadgeBg,
                    borderColor: dynamicBadgeBorder,
                  },
                ]}
              >
                <Text style={[styles.loadMoreText, { color: paperTheme.colors.onSurface }]}>
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
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 4,
    borderRadius: 24,
    borderWidth: 1,
  },
  headerBrand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoGradientRing: {
    padding: 2,
    borderRadius: 22,
  },
  headerTextCol: {
    flexDirection: 'column',
    gap: 2,
  },
  appTitle: {
    fontFamily: 'Nunito-Bold',
    fontSize: FontSizes.h3,
    letterSpacing: 0.8,
    lineHeight: 22,
  },
  subtitleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  subtitleBadgeText: {
    fontFamily: 'Nunito-Bold',
    fontSize: 10,
    letterSpacing: 0.3,
  },
  actionGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  glassIconButton: {
    padding: 10,
    borderRadius: 16,
    borderWidth: 1,
  },

  /* Theme Modal */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  modalContent: {
    width: '100%',
    maxWidth: 300,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    elevation: 10,
  },
  modalTitle: {
    fontFamily: 'Nunito-Bold',
    fontSize: FontSizes.h4,
    marginBottom: 16,
    textAlign: 'center',
  },
  themeOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginVertical: 4,
    borderWidth: 1,
    alignItems: 'center',
  },
  themeOptionText: {
    fontFamily: 'Nunito-Bold',
    fontSize: FontSizes.body,
  },

  /* Categories */
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
    borderWidth: 1,
  },
  categoryText: {
    fontFamily: 'Nunito-Bold',
    fontSize: FontSizes.caption,
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
  exploreIconBtn: {
    padding: 6,
    borderRadius: 12,
  },

  /* Scroll Indicator */
  indicatorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
    gap: 6,
  },
  indicatorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  indicatorDotActive: {
    width: 18,
    height: 6,
    borderRadius: 3,
  },

  /* Card Components */
  cardImage: {
    width: '100%',
    height: '100%',
  },
  horizontalList: {
    paddingHorizontal: 16,
    gap: CARD_GAP,
  },
  listCard: {
    width: LIST_CARD_WIDTH,
    height: LIST_CARD_HEIGHT,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
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
    borderWidth: 1,
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
    borderWidth: 1,
  },
  loadMoreText: {
    fontFamily: 'Nunito-Bold',
    fontSize: FontSizes.body,
  },
} as const);