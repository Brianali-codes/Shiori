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

const { width } = Dimensions.get('window');
const ITEM_WIDTH = width * 0.8;

const featuredCollections = [
  { 
    id: '1', 
    title: 'Nature', 
    icon: 'leaf.fill', 
    color: '#4CAF50', 
    query: 'nature',
  },
  { 
    id: '2', 
    title: 'Abstract', 
    icon: 'scribble', 
    color: '#9C27B0', 
    query: 'abstract',
  },
  { 
    id: '3', 
    title: 'Minimal', 
    icon: 'square.fill', 
    color: '#607D8B', 
    query: 'minimal',
  },
  { 
    id: '4', 
    title: 'Landscapes', 
    icon: 'mountain.2.fill', 
    color: '#FF9800', 
    query: 'landscape',
  },
  { 
    id: '5', 
    title: 'Dark', 
    icon: 'moon.fill', 
    color: '#212121', 
    query: 'dark',
  },
  { 
    id: '6', 
    title: 'Anime', 
    icon: 'sparkles.fill', 
    color: '#E91E63', 
    query: 'anime',
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
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedPurity, setSelectedPurity] = useState('sfw');
  const [showNsfwContent, setShowNsfwContent] = useState(false);

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

  // Filter purity levels based on NSFW setting
  const purityLevels = showNsfwContent ? allPurityLevels : [{ id: 'sfw', label: 'SFW' }];

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
          if (!newSetting && (selectedPurity === 'sketchy' || selectedPurity === 'nsfw')) {
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
        
        // Fetch latest wallpapers
        const latestResponse = await wallhavenAPI.getLatest();
        setLatestWallpapers(latestResponse.data.slice(0, 6));
        
        // Fetch top wallpapers
        const topResponse = await wallhavenAPI.getToplist();
        setTopWallpapers(topResponse.data.slice(0, 6));

        // Fetch category preview images
        const categoryPreviews: { [key: string]: WallpaperPreview } = {};
        for (const category of featuredCollections) {
          const response = await wallhavenAPI.search({ 
            q: category.query, 
            page: 1
          });
          if (response.data.length > 0) {
            categoryPreviews[category.id] = response.data[0];
          }
        }
        setCategoryWallpapers(categoryPreviews);

        // Fetch more wallpapers for the bottom section
        const moreResponse = await wallhavenAPI.search({ 
          page: 1
        });
        setMoreWallpapers(moreResponse.data);
      } catch (error) {
        console.error('Failed to fetch home data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

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
      
      // Check if trying to access NSFW content without API key
      if ((selectedPurity === 'nsfw' || selectedPurity === 'sketchy') && !wallhavenAPI.hasApiKey()) {
        Alert.alert(
          'API Key Required', 
          'You need to set a Wallhaven API key in Settings to access NSFW content.',
          [
            { text: 'OK', onPress: () => setSelectedPurity('sfw') }
          ]
        );
        setLoading(false);
        return;
      }
      
      const response = await wallhavenAPI.search({
        q: searchQuery,
        categories: selectedCategory === 'all' ? '111' : selectedCategory === 'general' ? '100' : selectedCategory === 'anime' ? '010' : '001',
        purity: selectedPurity === 'sfw' ? '100' : selectedPurity === 'sketchy' ? '010' : '001',
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
          
          <Text variant="titleMedium" style={styles.categoriesTitle}>Popular Categories</Text>
          
          <View style={styles.collectionsGrid}>
            {featuredCollections.map(item => (
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
            ))}
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
                  onPress={() => navigateToWallpaper(item.id)}
                >
                  <Image 
                    source={{ uri: item.thumbs.large }} 
                    style={styles.moreWallpaperImage}
                  />
                </TouchableOpacity>
              ))}
            </View>
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
    marginBottom: 24,
  },
  wallpapersList: {
    paddingLeft: 16,
    paddingRight: 8,
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
    paddingHorizontal: 12,
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
} as const);
