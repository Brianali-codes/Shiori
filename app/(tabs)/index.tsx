import React, { useEffect, useState } from 'react';
import { StyleSheet, ScrollView, View, Image, TouchableOpacity, FlatList, Dimensions, Alert, RefreshControl } from 'react-native';
import { SearchNormal1, ArchiveTick, Sort, Filter, Clock, Like1, More2, HeartCircle, Share } from 'iconsax-react-nativejs';
import { Text, Card, Button, useTheme, Chip, IconButton } from 'react-native-paper';
import { Image as Image1 } from 'iconsax-react-nativejs';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { ThemedView } from '@/components/ThemedComponents';
import { wallhavenAPI, WallpaperPreview } from '../services/wallhaven';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontSizes } from '@/constants/FontSizes';
import { Avatar } from 'react-native-paper';
import LottieView from "lottie-react-native";

const { width } = Dimensions.get('window');
const ITEM_WIDTH = width * 0.8;

const featuredCollections = [
  { id: '1', title: 'Nature', icon: 'leaf.fill', color: '#4CAF50', query: 'nature landscape forest mountain' },
  { id: '2', title: 'Abstract', icon: 'scribble', color: '#9C27B0', query: 'abstract art pattern geometric' },
  { id: '3', title: 'Minimal', icon: 'square.fill', color: '#607D8B', query: 'minimal simple clean' },
  { id: '4', title: 'Art', icon: 'paintpalette.fill', color: '#FF9800', query: 'art painting illustration digital art' },
  { id: '5', title: 'Dark', icon: 'moon.fill', color: '#212121', query: 'dark night black' },
  { id: '6', title: 'Anime', icon: 'sparkles.fill', color: '#E91E63', query: 'anime art illustration' },
];

export default function HomeScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [featuredWallpapers, setFeaturedWallpapers] = useState<WallpaperPreview[]>([]);
  const [latestWallpapers, setLatestWallpapers] = useState<WallpaperPreview[]>([]);
  const [topWallpapers, setTopWallpapers] = useState<WallpaperPreview[]>([]);
  const [categoryWallpapers, setCategoryWallpapers] = useState<{ [key: string]: WallpaperPreview }>({});
  const [moreWallpapers, setMoreWallpapers] = useState<WallpaperPreview[]>([]);
  const [morePage, setMorePage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedPurity, setSelectedPurity] = useState('sfw');
  const [showNsfwContent, setShowNsfwContent] = useState(false);
  const [showFilter, setShowFilter] = useState(false);

  const categories = [
    { id: 'all', label: 'All' },
    { id: 'general', label: 'General' },
    { id: 'anime', label: 'Anime' },
    { id: 'people', label: 'People' },
  ];

  const allPurityLevels = [
    { id: 'sfw', label: 'SFW' },
    { id: 'sketchy', label: 'Sketchy' },
    { id: 'nsfw', label: 'NSFW' },
  ];

  const purityLevels = showNsfwContent && wallhavenAPI.hasApiKey() ? allPurityLevels : [{ id: 'sfw', label: 'SFW' }];

  const getPurityParam = (purity: string) => {
    if (purity === 'sketchy') return '010';
    if (purity === 'nsfw') return '001';
    return '100';
  };

  const getCategoryParam = (category: string) => {
    if (category === 'general') return '100';
    if (category === 'anime') return '010';
    if (category === 'people') return '001';
    return '111';
  };

  // Helper function to try fetching wallpapers with primary and secondary fallback params
  const fetchWithFallback = async (primaryParams: any, fallbackParamsList: any[]): Promise<WallpaperPreview[]> => {
    try {
      const primaryRes = await wallhavenAPI.search(primaryParams);
      if (primaryRes?.data && primaryRes.data.length > 0) {
        return primaryRes.data;
      }
    } catch (e) {
      console.warn('Primary fetch failed, attempting fallbacks...', e);
    }

    for (const fallbackParams of fallbackParamsList) {
      try {
        const fallbackRes = await wallhavenAPI.search(fallbackParams);
        if (fallbackRes?.data && fallbackRes.data.length > 0) {
          return fallbackRes.data;
        }
      } catch (err) {
        console.warn('Fallback fetch failed:', fallbackParams, err);
      }
    }

    return [];
  };

  const loadWallpapers = async () => {
    try {
      setLoading(true);

      if ((selectedPurity === 'nsfw' || selectedPurity === 'sketchy') && !wallhavenAPI.hasApiKey()) {
        Alert.alert(
          'API Key Required',
          'You need to set a Wallhaven API key in Settings to access NSFW and sketchy content.',
          [{ text: 'OK', onPress: () => setSelectedPurity('sfw') }]
        );
        setLoading(false);
        return;
      }

      const purityParam = getPurityParam(selectedPurity);
      const categoryParam = getCategoryParam(selectedCategory);

      // Use Promise.allSettled so failures in one endpoint do not prevent other sections from loading
      const [featuredRes, latestRes, topRes, moreRes] = await Promise.allSettled([
        // Featured Primary & Fallbacks
        (async () => {
          try {
            const randomResponse = await wallhavenAPI.getRandomWallpapers();
            if (randomResponse?.data && randomResponse.data.length > 0) {
              return randomResponse.data;
            }
          } catch (e) {
            console.warn('Random wallpapers fetch failed, trying search fallback...');
          }
          return await fetchWithFallback(
            { q: searchQuery, categories: categoryParam, purity: purityParam, sorting: 'hot', page: 1 },
            [{ q: searchQuery, categories: categoryParam, purity: purityParam, sorting: 'toplist', page: 1 }]
          );
        })(),

        // Latest Primary & Fallbacks
        fetchWithFallback(
          { q: searchQuery, categories: categoryParam, purity: purityParam, sorting: 'date_added', order: 'desc', page: 1 },
          [
            { q: searchQuery, categories: categoryParam, purity: purityParam, sorting: 'relevance', order: 'desc', page: 1 },
            { q: searchQuery, categories: categoryParam, purity: purityParam, page: 1 }
          ]
        ),

        // Top Primary & Fallbacks
        fetchWithFallback(
          { q: searchQuery, categories: categoryParam, purity: purityParam, sorting: 'toplist', order: 'desc', page: 1 },
          [
            { q: searchQuery, categories: categoryParam, purity: purityParam, sorting: 'views', order: 'desc', page: 1 },
            { q: searchQuery, categories: categoryParam, purity: purityParam, sorting: 'favorites', order: 'desc', page: 1 }
          ]
        ),

        // More Wallpapers Primary & Fallbacks
        fetchWithFallback(
          { q: searchQuery, categories: categoryParam, purity: purityParam, sorting: 'random', page: 1 },
          [
            { q: searchQuery, categories: categoryParam, purity: purityParam, sorting: 'relevance', page: 2 },
            { q: searchQuery, categories: categoryParam, purity: purityParam, page: 1 }
          ]
        )
      ]);

      if (featuredRes.status === 'fulfilled') setFeaturedWallpapers(featuredRes.value.slice(0, 9));
      if (latestRes.status === 'fulfilled') setLatestWallpapers(latestRes.value.slice(0, 9));
      if (topRes.status === 'fulfilled') setTopWallpapers(topRes.value.slice(0, 9));
      if (moreRes.status === 'fulfilled') setMoreWallpapers(moreRes.value.slice(0, 15));

      setMorePage(2);
      setHasMore(true);
    } catch (error) {
      console.error('Error loading wallpapers:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const checkNsfwSettingChanges = async () => {
      try {
        const nsfwSetting = await AsyncStorage.getItem('showNsfwContent');
        const newSetting = nsfwSetting === 'true';

        if (newSetting !== showNsfwContent) {
          setShowNsfwContent(newSetting);
          if (!newSetting || !wallhavenAPI.hasApiKey()) {
            setSelectedPurity('sfw');
          }
          loadWallpapers();
        }
      } catch (error) {
        console.error('Failed to check NSFW setting changes:', error);
      }
    };

    checkNsfwSettingChanges();
    const interval = setInterval(checkNsfwSettingChanges, 1000);
    return () => clearInterval(interval);
  }, [showNsfwContent]);

  useEffect(() => {
    wallhavenAPI.setApiKey('S9eGuYOS7MOFjXfV91Up30hozbk5kpQR');
    loadWallpapers();
  }, [searchQuery, selectedCategory, selectedPurity]);

  const loadMoreWallpapers = async () => {
    if (loadingMore || !hasMore) return;

    try {
      setLoadingMore(true);
      const purityParam = getPurityParam(selectedPurity);
      const categoryParam = getCategoryParam(selectedCategory);

      const data = await fetchWithFallback(
        { q: searchQuery, categories: categoryParam, purity: purityParam, sorting: 'random', page: morePage },
        [
          { q: searchQuery, categories: categoryParam, purity: purityParam, sorting: 'relevance', page: morePage },
          { q: searchQuery, categories: categoryParam, purity: purityParam, page: morePage }
        ]
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
  const navigateToCategory = (query: string) => router.push({ pathname: '/explore', params: { q: query } });
  const handleShowFilter = () => setShowFilter(!showFilter);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadWallpapers();
    setRefreshing(false);
  };

  const renderFeaturedItem = ({ item }: { item: WallpaperPreview }) => (
    <TouchableOpacity style={styles.featuredItem} onPress={() => navigateToWallpaper(item.id)} activeOpacity={0.9}>
      <Image source={{ uri: item.thumbs.large }} style={styles.featuredImage} />
      <LinearGradient colors={['transparent', 'rgba(0,0,0,0.8)']} style={styles.featuredGradient}>
        <View style={styles.featuredInfo}>
          <View style={styles.featuredMeta}>
            <Image1 size={18} color={theme.colors.primary} variant="Broken" />
            <Text style={styles.featuredText}>{item.resolution}</Text>
          </View>
          <View style={styles.featuredMeta}>
            <HeartCircle size={18} color={theme.colors.primary} variant="Broken" />
            <Text style={styles.featuredText}>{item.favorites}</Text>
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );

  const renderWallpaperItem = ({ item, sectionTitle }: { item: WallpaperPreview; sectionTitle: string }) => (
    <TouchableOpacity style={styles.wallpaperItem} onPress={() => navigateToWallpaper(item.id)} activeOpacity={0.9}>
      <Image source={{ uri: item.thumbs.large }} style={styles.wallpaperImage} />
      <LinearGradient colors={['transparent', 'rgba(0,0,0,0.8)']} style={styles.wallpaperGradient}>
        <View style={styles.wallpaperInfo}>
          <Text style={styles.wallpaperSection}>{sectionTitle}</Text>
          <View style={styles.wallpaperMeta}>
            <View style={styles.metaItem}>
              <Image1 size={18} color={theme.colors.primary} variant="Broken" />
              <Text style={styles.wallpaperText}>{item.resolution}</Text>
            </View>
            <View style={styles.metaItem}>
              <HeartCircle size={18} color={theme.colors.primary} variant="Broken" />
              <Text style={styles.wallpaperText}>{item.favorites}</Text>
            </View>
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loader}>
        <LottieView
          source={require("../../assets/animations/loader.json")}
          autoPlay
          loop
          style={{ width: 150, height: 150 }}
        />
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top']}>
      <ThemedView style={styles.container}>
        <StatusBar style="auto" />
        <Stack.Screen
          options={{
            headerShown: false,
            title: 'Shiori',
            headerShadowVisible: false,
            headerTitleStyle: styles.headerTitle,
            headerStyle: { backgroundColor: theme.colors.background },
          }}
        />

        <View style={styles.headerContainer}>
          <View style={styles.headerRow}>
            <Avatar.Image size={38} source={require('@/assets/images/shiori.png')} />
            <View style={styles.headerCol}>
              <Text style={styles.appTitle}>Shiori. <Text style={styles.subtitle}>v1.0.0.</Text></Text>
              <Text style={styles.subtitle}>Discover Beautiful Wallpapers.</Text>
            </View>
          </View>

          <View style={styles.glassIcons}>
            <TouchableOpacity onPress={() => { }}>
              <Share size={20} color="#777" variant="Broken" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push('/explore')}>
              <SearchNormal1 size={20} color="#777" variant="Broken" />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleShowFilter}>
              <Filter size={20} color="#777" variant="Broken" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.filterContainer}>
          <View style={styles.filterHeader}>
            <Sort size={18} color={theme.colors.primary} variant="Broken" />
            <Text style={[styles.filterTitle, { fontFamily: 'Nunito-Bold', fontSize: FontSizes.body }]}>
              Categories
            </Text>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
            {categories.map((category) => (
              <Chip
                key={category.id}
                selected={selectedCategory === category.id}
                onPress={() => setSelectedCategory(category.id)}
                style={[
                  styles.categoryChip,
                  selectedCategory === category.id && {
                    backgroundColor: theme.colors.primaryContainer,
                    borderColor: theme.colors.primary
                  }
                ]}
                textStyle={[
                  selectedCategory === category.id && {
                    color: theme.colors.primary,
                    fontFamily: 'Nunito-Bold'
                  }
                ]}
              >
                {category.label}
              </Chip>
            ))}
          </ScrollView>
        </View>

        {showFilter && (
          <View style={styles.openFilter}>
            <View style={styles.filterHeader}>
              <Filter size={18} color={theme.colors.primary} variant="Broken" />
              <Text style={[styles.filterTitle, { fontFamily: 'Nunito-Bold', fontSize: FontSizes.body }]}>
                Content
              </Text>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.purityScroll}>
              {purityLevels.map((purity) => (
                <Chip
                  key={purity.id}
                  selected={selectedPurity === purity.id}
                  onPress={() => setSelectedPurity(purity.id)}
                  style={[
                    styles.purityChip,
                    selectedPurity === purity.id && {
                      backgroundColor: theme.colors.primaryContainer,
                      borderColor: theme.colors.primary
                    }
                  ]}
                  textStyle={[
                    selectedPurity === purity.id && {
                      color: theme.colors.primary,
                      fontFamily: 'Nunito-Bold'
                    }
                  ]}
                >
                  {purity.label}
                </Chip>
              ))}
            </ScrollView>
          </View>
        )}

        <ScrollView
          style={styles.scrollView}
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
          <View style={styles.header}>
            <View style={styles.filterHeader2}>
              <ArchiveTick size={18} color={theme.colors.primary} variant="Broken" />
              <Text variant="headlineSmall" style={styles.sectionTitle}>Featured Wallpapers</Text>
            </View>
            <View style={styles.filterHeader}>
              <Button mode="text" onPress={() => router.push('/explore')} compact>
                See all
              </Button>
            </View>
          </View>

          <FlatList
            data={featuredWallpapers}
            horizontal
            showsHorizontalScrollIndicator={false}
            renderItem={renderFeaturedItem}
            contentContainerStyle={styles.featuredList}
            snapToInterval={ITEM_WIDTH + 16}
            decelerationRate="fast"
            snapToAlignment="center"
            keyExtractor={(item) => item.id}
          />

          <View style={styles.section}>
            <View style={styles.header}>
              <View style={styles.filterHeader2}>
                <Clock size={18} color={theme.colors.primary} variant="Broken" />
                <Text variant="headlineSmall" style={styles.sectionTitle}>Latest Additions</Text>
              </View>
              <View style={styles.filterHeader}>
                <Button mode="text" onPress={() => router.push('/explore')} compact>
                  See all
                </Button>
              </View>
            </View>

            <FlatList
              data={latestWallpapers}
              horizontal
              showsHorizontalScrollIndicator={false}
              renderItem={({ item }) => renderWallpaperItem({ item, sectionTitle: 'Latest' })}
              contentContainerStyle={styles.wallpapersList}
              snapToInterval={width * 0.65 + 12}
              decelerationRate="fast"
              snapToAlignment="center"
              keyExtractor={(item) => item.id}
            />
          </View>

          <View style={styles.section}>
            <View style={styles.header}>
              <View style={styles.filterHeader2}>
                <Like1 size={18} color={theme.colors.primary} variant="Broken" />
                <Text variant="headlineSmall" style={styles.sectionTitle}>Top Rated</Text>
              </View>
              <View style={styles.filterHeader}>
                <Button mode="text" onPress={() => router.push('/explore')} compact>
                  See all
                </Button>
              </View>
            </View>

            <FlatList
              data={topWallpapers}
              horizontal
              showsHorizontalScrollIndicator={false}
              renderItem={({ item }) => renderWallpaperItem({ item, sectionTitle: 'Top' })}
              contentContainerStyle={styles.wallpapersList}
              snapToInterval={width * 0.65 + 12}
              decelerationRate="fast"
              snapToAlignment="center"
              keyExtractor={(item) => item.id}
            />
          </View>

          <View style={styles.section}>
            <View style={styles.header}>
              <View style={styles.filterHeader2}>
                <More2 size={18} color={theme.colors.primary} variant="Broken" />
                <Text variant="headlineSmall" style={styles.sectionTitle}>More Wallpapers</Text>
              </View>
            </View>

            <View style={styles.moreWallpapersGrid}>
              {moreWallpapers.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.moreWallpaperItem}
                  onPress={() => router.push(`/wallpaper/${item.id}`)}
                >
                  <Image source={{ uri: item.thumbs.large }} style={styles.moreWallpaperImage} />
                </TouchableOpacity>
              ))}
            </View>

            {hasMore && (
              <Button
                mode="contained"
                onPress={loadMoreWallpapers}
                loading={loadingMore}
                style={styles.loadMoreButton}
              >
                Load More
              </Button>
            )}
          </View>

          <View style={styles.footer} />
        </ScrollView>
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  headerTitle: {
    fontFamily: 'Nunito-Bold',
    fontSize: FontSizes.h2,
    height: 15,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 10,
    marginBottom: 2,
  },
  sectionTitle: {
    fontFamily: 'Nunito-Bold',
    fontSize: FontSizes.h3,
  },
  openFilter: {
    display: 'flex',
    marginLeft: 16,
    marginTop: -10,
    marginBottom: -5,
  },
  featuredList: {
    paddingLeft: 16,
    paddingRight: 16,
    paddingBottom: 16,
  },
  featuredItem: {
    width: ITEM_WIDTH,
    height: 220,
    marginRight: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  featuredImage: {
    width: '100%',
    height: '100%',
  },
  featuredGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
    justifyContent: 'flex-end',
    padding: 12,
  },
  featuredInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  featuredMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featuredText: {
    color: 'white',
    marginLeft: 4,
    fontSize: FontSizes.caption,
    fontFamily: 'Nunito-Regular',
  },
  section: {
    paddingHorizontal: 0,
    paddingVertical: 8,
  },
  wallpapersList: {
    paddingLeft: 16,
    paddingRight: 16,
    paddingBottom: 16,
  },
  wallpaperItem: {
    width: width * 0.65,
    height: 180,
    marginRight: 12,
    borderRadius: 16,
    overflow: 'hidden',
  },
  wallpaperImage: {
    width: '100%',
    height: '100%',
  },
  wallpaperGradient: {
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
  wallpaperSection: {
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
  footer: {
    height: 10,
  },
  moreWallpapersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  moreWallpaperItem: {
    width: '33.33%',
    aspectRatio: 1,
    padding: 4,
  },
  moreWallpaperImage: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  loadMoreButton: {
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 10,
    fontFamily: 'Nunito-Bold',
    width: '50%',
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerCol: {
    flexDirection: 'column',
  },
  appTitle: {
    fontFamily: 'Nunito-Bold',
    fontSize: FontSizes.h4,
    color: '#777',
  },
  subtitle: {
    fontFamily: 'Nunito-Light',
    fontSize: FontSizes.caption,
    color: '#777',
    marginTop: 2,
  },
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  filterContainer: {
    marginBottom: 10,
    paddingHorizontal: 16,
  },
  filterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 0,
  },
  glassIcons: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 20,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  filterHeader2: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 7,
  },
  filterTitle: {
    marginLeft: 8,
  },
  categoryScroll: {
    marginBottom: 16,
  },
  purityScroll: {
    marginBottom: 16,
  },
  categoryChip: {
    marginRight: 8,
  },
  purityChip: {
    marginRight: 8,
  },
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "transparent",
  },
} as const);