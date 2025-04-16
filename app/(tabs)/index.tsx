import React, { useEffect, useState } from 'react';
import { StyleSheet, ScrollView, View, Image, TouchableOpacity, FlatList, Dimensions, ActivityIndicator, Alert } from 'react-native';
import { Text, Surface, Card, Button, useTheme, Title, Chip, Badge, Searchbar, IconButton } from 'react-native-paper';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { ThemedView } from '@/components/ThemedComponents';
import { WallpaperCard } from '@/components/ui/WallpaperCard';
import { wallhavenAPI, WallpaperPreview, SearchParams } from '../services/wallhaven';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontSizes } from '@/constants/FontSizes';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');
const ITEM_WIDTH = width * 0.8;

const featuredCollections = [
  { 
    id: '1', 
    title: 'Nature', 
    icon: 'leaf.fill', 
    color: '#4CAF50', 
    query: 'nature landscape forest mountain',
  },
  { 
    id: '2', 
    title: 'Abstract', 
    icon: 'scribble', 
    color: '#9C27B0', 
    query: 'abstract art pattern geometric',
  },
  { 
    id: '3', 
    title: 'Minimal', 
    icon: 'square.fill', 
    color: '#607D8B', 
    query: 'minimal simple clean',
  },
  { 
    id: '4', 
    title: 'Art', 
    icon: 'paintpalette.fill', 
    color: '#FF9800', 
    query: 'art painting illustration digital art',
  },
  { 
    id: '5', 
    title: 'Dark', 
    icon: 'moon.fill', 
    color: '#212121', 
    query: 'dark night black',
  },
  { 
    id: '6', 
    title: 'Anime', 
    icon: 'sparkles.fill', 
    color: '#E91E63', 
    query: 'anime art illustration',
  },
];

const popularCategories = [
  {
    id: 'nature',
    name: 'Nature',
    icon: '🌿',
    searchQuery: 'nature landscape forest mountain',
  },
  {
    id: 'anime',
    name: 'Anime',
    icon: '🎌',
    searchQuery: 'anime art illustration',
  },
  {
    id: 'minimal',
    name: 'Minimal',
    icon: '⚪',
    searchQuery: 'minimal simple clean',
  },
  {
    id: 'abstract',
    name: 'Abstract',
    icon: '🎨',
    searchQuery: 'abstract art colorful',
  },
  {
    id: 'space',
    name: 'Space',
    icon: '🌌',
    searchQuery: 'space galaxy stars',
  },
  {
    id: 'architecture',
    name: 'Architecture',
    icon: '🏛️',
    searchQuery: 'architecture building city',
  },
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

  const handleSearch = () => {
    if (searchQuery.trim()) {
      router.push({
        pathname: '/explore',
        params: { 
          q: searchQuery,
          category: selectedCategory,
          purity: selectedPurity
        }
      });
    }
  };

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

  // Filter purity levels based on NSFW setting and API key
  const purityLevels = showNsfwContent && wallhavenAPI.hasApiKey() ? allPurityLevels : [{ id: 'sfw', label: 'SFW' }];

  // Add useEffect to check for changes in NSFW settings and reload data
  useEffect(() => {
    // Monitor changes to showNsfwContent
    const checkNsfwSettingChanges = async () => {
      try {
        const nsfwSetting = await AsyncStorage.getItem('showNsfwContent');
        const newSetting = nsfwSetting === 'true';
        
        if (newSetting !== showNsfwContent) {
          setShowNsfwContent(newSetting);
          console.log('NSFW setting updated:', newSetting);
          
          // Force reload of purity levels
          if (!newSetting || !wallhavenAPI.hasApiKey()) {
            setSelectedPurity('sfw');
          }
          
          // Reload wallpapers to apply new settings
          loadWallpapers();
        }
      } catch (error) {
        console.error('Failed to check NSFW setting changes:', error);
      }
    };
    
    // Initial load
    checkNsfwSettingChanges();
    
    // Check for setting changes when the component is focused
    const interval = setInterval(checkNsfwSettingChanges, 1000);
    return () => clearInterval(interval);
  }, [showNsfwContent]);

  useEffect(() => {
    // Set the API key directly 
    wallhavenAPI.setApiKey('S9eGuYOS7MOFjXfV91Up30hozbk5kpQR');
    
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch random wallpapers for the featured section
        const randomResponse = await wallhavenAPI.getRandomWallpapers();
        setFeaturedWallpapers(randomResponse.data.slice(0, 5));
        
        // Fetch latest wallpapers with proper parameters
        const latestResponse = await wallhavenAPI.search({ 
          sorting: 'date_added',
          order: 'desc',
          page: 1,
          purity: selectedPurity === 'sfw' ? '100' : selectedPurity === 'sketchy' ? '010' : '001'
        });
        setLatestWallpapers(latestResponse.data.slice(0, 6));
        
        // Fetch top wallpapers with proper parameters
        const topResponse = await wallhavenAPI.search({ 
          sorting: 'toplist',
          order: 'desc',
          page: 1,
          purity: selectedPurity === 'sfw' ? '100' : selectedPurity === 'sketchy' ? '010' : '001'
        });
        setTopWallpapers(topResponse.data.slice(0, 6));

        // Fetch initial more wallpapers
        const moreResponse = await wallhavenAPI.search({
          sorting: 'random',
          page: 1,
          purity: selectedPurity === 'sfw' ? '100' : selectedPurity === 'sketchy' ? '010' : '001'
        });
        setMoreWallpapers(moreResponse.data);
      } catch (error) {
        console.error('Failed to fetch home data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [selectedPurity]);

  const navigateToWallpaper = (id: string) => {
    router.push(`/wallpaper/${id}`);
  };

  const navigateToCategory = (query: string) => {
    router.push({
      pathname: '/explore',
      params: { q: query }
    });
  };
  
  const renderFeaturedItem = ({ item }: { item: WallpaperPreview }) => (
    <TouchableOpacity 
      style={styles.featuredItem}
      onPress={() => navigateToWallpaper(item.id)}
      activeOpacity={0.9}
    >
      <Image 
        source={{ uri: item.thumbs.large }} 
        style={styles.featuredImage}
      />
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.8)']}
        style={styles.featuredGradient}
      >
        <View style={styles.featuredInfo}>
          <View style={styles.featuredMeta}>
            <IconSymbol name="rectangle.stack.fill" size={16} color="white" />
            <Text style={styles.featuredText}>{item.resolution}</Text>
          </View>
          <View style={styles.featuredMeta}>
            <IconSymbol name="heart.fill" size={16} color="white" />
            <Text style={styles.featuredText}>{item.favorites}</Text>
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );

  const renderWallpaperItem = ({ item, sectionTitle }: { item: WallpaperPreview, sectionTitle: string }) => (
    <TouchableOpacity 
      style={styles.wallpaperItem}
      onPress={() => navigateToWallpaper(item.id)}
      activeOpacity={0.9}
    >
      <Image 
        source={{ uri: item.thumbs.large }} 
        style={styles.wallpaperImage}
      />
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.8)']}
        style={styles.wallpaperGradient}
      >
        <View style={styles.wallpaperInfo}>
          <Text style={styles.wallpaperSection}>{sectionTitle}</Text>
          <View style={styles.wallpaperMeta}>
            <View style={styles.metaItem}>
              <IconSymbol name="rectangle.stack.fill" size={14} color="white" />
              <Text style={styles.wallpaperText}>{item.resolution}</Text>
            </View>
            <View style={styles.metaItem}>
              <IconSymbol name="heart.fill" size={14} color="white" />
              <Text style={styles.wallpaperText}>{item.favorites}</Text>
            </View>
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );

  const renderCollectionItem = ({ item }: { item: typeof featuredCollections[0] }) => (
    <TouchableOpacity 
      key={item.id}
      style={styles.collectionItem}
      onPress={() => navigateToCategory(item.query)}
    >
      <Image 
        source={{ uri: categoryWallpapers[item.id]?.thumbs.large }} 
        style={styles.collectionImage}
      />
      <Text style={styles.collectionTitle}>{item.title}</Text>
    </TouchableOpacity>
  );

  const loadWallpapers = async () => {
    try {
      setLoading(true);
      
      // Check if trying to access NSFW or sketchy content without API key
      if ((selectedPurity === 'nsfw' || selectedPurity === 'sketchy') && !wallhavenAPI.hasApiKey()) {
        Alert.alert(
          'API Key Required', 
          'You need to set a Wallhaven API key in Settings to access NSFW and sketchy content.',
          [
            { text: 'OK', onPress: () => setSelectedPurity('sfw') }
          ]
        );
        setLoading(false);
        return;
      }
      
      // Determine purity parameter based on selected purity
      let purityParam = '100'; // Default to SFW
      if (selectedPurity === 'sketchy') {
        purityParam = '010'; // Sketchy only
      } else if (selectedPurity === 'nsfw') {
        purityParam = '001'; // NSFW only
      }
      
      const response = await wallhavenAPI.search({
        q: searchQuery,
        categories: selectedCategory === 'all' ? '111' : selectedCategory === 'general' ? '100' : selectedCategory === 'anime' ? '010' : '001',
        purity: purityParam, // Use the specific purity parameter
      });
      
      setFeaturedWallpapers(response.data.slice(0, 5));
      setLatestWallpapers(response.data.slice(5, 11));
      setTopWallpapers(response.data.slice(11, 17));
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
    loadWallpapers();
  }, [searchQuery, selectedCategory, selectedPurity]);

  const renderWallpaper = ({ item }: { item: WallpaperPreview }) => (
    <Card style={styles.wallpaperCard} mode="elevated">
      <Card.Cover source={{ uri: item.thumbs.large }} style={styles.wallpaperImage} />
      <Card.Content style={styles.wallpaperContent}>
        <View style={styles.wallpaperInfo}>
          <Text variant="bodyMedium" style={styles.resolution}>
            {item.resolution}
          </Text>
          <View style={styles.actions}>
            <IconButton
              icon={({ size, color }) => (
                <IconSymbol name="heart.fill" size={size} color={color} />
              )}
              size={20}
              onPress={() => {}}
            />
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

  const loadMoreWallpapers = async () => {
    if (loadingMore || !hasMore) return;
    
    try {
      setLoadingMore(true);
      const response = await wallhavenAPI.search({
        sorting: 'random',
        page: morePage,
        purity: selectedPurity === 'sfw' ? '100' : selectedPurity === 'sketchy' ? '010' : '001'
      });
      
      if (response.data.length === 0) {
        setHasMore(false);
        return;
      }
      
      setMoreWallpapers(prev => [...prev, ...response.data]);
      setMorePage(prev => prev + 1);
    } catch (error) {
      console.error('Error loading more wallpapers:', error);
    } finally {
      setLoadingMore(false);
    }
  };

  const handleMoreWallpaperPress = (id: string) => {
    router.push(`/wallpaper/${id}`);
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ThemedView style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading amazing wallpapers...</Text>
        </ThemedView>
      </SafeAreaView>
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
        
        <Searchbar
          placeholder="Search wallpapers..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
          onSubmitEditing={handleSearch}
          right={() => (
            <IconButton
              icon="magnify"
              onPress={handleSearch}
            />
          )}
        />

        <View style={styles.filterContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
            {categories.map((category) => (
              <Chip
                key={category.id}
                selected={selectedCategory === category.id}
                onPress={() => setSelectedCategory(category.id)}
                style={styles.categoryChip}
              >
                {category.label}
              </Chip>
            ))}
          </ScrollView>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.purityScroll}>
            {purityLevels.map((purity) => (
              <Chip
                key={purity.id}
                selected={selectedPurity === purity.id}
                onPress={() => setSelectedPurity(purity.id)}
                style={styles.purityChip}
              >
                {purity.label}
              </Chip>
            ))}
          </ScrollView>
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Text variant="headlineSmall" style={styles.sectionTitle}>Featured Wallpapers</Text>
            <Button 
              mode="text" 
              onPress={() => router.push('/explore')}
              compact
            >
              See all
            </Button>
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
          />
          
          <View style={styles.section}>
            <View style={styles.header}>
              <Text variant="titleMedium" style={styles.sectionTitle}>Popular Categories</Text>
            </View>
            <View style={styles.categoriesGrid}>
              {popularCategories.map((category) => (
                <TouchableOpacity
                  key={category.id}
                  style={styles.categoryCard}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    router.push({
                      pathname: '/(tabs)/explore',
                      params: { query: category.searchQuery }
                    });
                  }}
                >
                  <View style={styles.categoryIconContainer}>
                    <Text style={styles.categoryIcon}>{category.icon}</Text>
                  </View>
                  <Text variant="labelMedium" style={styles.categoryName}>{category.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          
          <View style={styles.section}>
            <View style={styles.header}>
              <Text variant="titleMedium" style={styles.sectionTitle}>Latest Additions</Text>
              <Button
                mode="text"
                onPress={() => router.push('/explore')}
                compact
              >
                More
              </Button>
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
            />
          </View>
          
          <View style={styles.section}>
            <View style={styles.header}>
              <Text variant="titleMedium" style={styles.sectionTitle}>Top Rated</Text>
              <Button
                mode="text"
                onPress={() => router.push('/explore')}
                compact
              >
                More
              </Button>
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
            />
          </View>
          
          <View style={styles.section}>
            <View style={styles.header}>
              <Text variant="titleMedium" style={styles.sectionTitle}>More Wallpapers</Text>
            </View>
            
            <View style={styles.moreWallpapersGrid}>
              {moreWallpapers.map((item) => (
                <TouchableOpacity 
                  key={item.id}
                  style={styles.moreWallpaperItem}
                  onPress={() => handleMoreWallpaperPress(item.id)}
                >
                  <Image 
                    source={{ uri: item.thumbs.large }} 
                    style={styles.moreWallpaperImage}
                  />
                </TouchableOpacity>
              ))}
            </View>
            
            {hasMore && (
              <Button
                mode="text"
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
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  headerTitle: {
    fontFamily: 'Nunito-Bold',
    fontSize: FontSizes.h2,
    height: 15,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  sectionTitle: {
    fontFamily: 'Nunito-Bold',
    fontSize: FontSizes.h3,
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
  categoriesTitle: {
    fontFamily: 'Nunito-Bold',
    fontSize: FontSizes.h3,
    marginLeft: 16,
    marginTop: 16,
    marginBottom: 12,
  },
  collectionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    marginBottom: 24,
  },
  collectionItem: {
    width: '33.33%',
    alignItems: 'center',
    marginBottom: 16,
  },
  collectionImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    marginBottom: 8,
  },
  collectionTitle: {
    fontFamily: 'Nunito-SemiBold',
    fontSize: FontSizes.bodySmall,
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    opacity: 0.7,
    fontFamily: 'Nunito-Regular',
    fontSize: FontSizes.body,
  },
  footer: {
    height: 50,
  },
  searchBar: {
    margin: 16,
    borderRadius: 16,
  },
  filterContainer: {
    paddingHorizontal: 16,
  },
  categoryScroll: {
    marginBottom: 8,
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
  wallpaperCard: {
    flex: 1,
    margin: 8,
    borderRadius: 16,
  },
  wallpaperContent: {
    padding: 8,
  },
  resolution: {
    opacity: 0.7,
    fontSize: FontSizes.caption,
  },
  actions: {
    flexDirection: 'row',
  },
  moreWallpapersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    marginBottom: 24,
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
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 8,
    paddingHorizontal: 16,
  },
  categoryCard: {
    width: '30%',
    aspectRatio: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  categoryIcon: {
    fontSize: 24,
  },
  categoryName: {
    textAlign: 'center',
    fontFamily: 'Nunito-Medium',
  },
  loadMoreButton: {
    marginTop: 8,
    marginBottom: 16,
  },
} as const);
