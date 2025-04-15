import React, { useEffect, useState } from 'react';
import { StyleSheet, ScrollView, View, Image, TouchableOpacity, FlatList, Dimensions, ActivityIndicator } from 'react-native';
import { Text, Surface, Card, Button, useTheme, Title, Chip, Badge, Searchbar, IconButton } from 'react-native-paper';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { ThemedView } from '@/components/ThemedComponents';
import { WallpaperCard } from '@/components/ui/WallpaperCard';
import { wallhavenAPI, WallpaperPreview, SearchParams } from '../services/wallhaven';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');
const ITEM_WIDTH = width * 0.8;

const featuredCollections = [
  { 
    id: '1', 
    title: 'Nature', 
    icon: 'leaf.fill', 
    color: '#4CAF50', 
    query: 'nature',
    imageUrl: 'https://w.wallhaven.cc/full/9d/wallhaven-9djej1.jpg'
  },
  { 
    id: '2', 
    title: 'Abstract', 
    icon: 'scribble', 
    color: '#9C27B0', 
    query: 'abstract',
    imageUrl: 'https://w.wallhaven.cc/full/j3/wallhaven-j3m8y5.png'
  },
  { 
    id: '3', 
    title: 'Minimal', 
    icon: 'square.fill', 
    color: '#607D8B', 
    query: 'minimal',
    imageUrl: 'https://w.wallhaven.cc/full/4x/wallhaven-4xjrl9.jpg'
  },
  { 
    id: '4', 
    title: 'Landscapes', 
    icon: 'mountain.2.fill', 
    color: '#FF9800', 
    query: 'landscape',
    imageUrl: 'https://w.wallhaven.cc/full/x8/wallhaven-x8ye3z.jpg'
  },
  { 
    id: '5', 
    title: 'Dark', 
    icon: 'moon.fill', 
    color: '#212121', 
    query: 'dark',
    imageUrl: 'https://w.wallhaven.cc/full/4g/wallhaven-4g6e1l.jpg'
  },
  { 
    id: '6', 
    title: 'Anime', 
    icon: 'sparkles.fill', 
    color: '#E91E63', 
    query: 'anime',
    imageUrl: 'https://w.wallhaven.cc/full/pk/wallhaven-pkw77p.jpg'
  },
];

export default function HomeScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [featuredWallpapers, setFeaturedWallpapers] = useState<WallpaperPreview[]>([]);
  const [latestWallpapers, setLatestWallpapers] = useState<WallpaperPreview[]>([]);
  const [topWallpapers, setTopWallpapers] = useState<WallpaperPreview[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedPurity, setSelectedPurity] = useState('sfw');

  const categories = [
    { id: 'all', label: 'All' },
    { id: 'general', label: 'General' },
    { id: 'anime', label: 'Anime' },
    { id: 'people', label: 'People' },
  ];

  const purityLevels = [
    { id: 'sfw', label: 'SFW' },
    { id: 'sketchy', label: 'Sketchy' },
    { id: 'nsfw', label: 'NSFW' },
  ];

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

  const renderCollectionItem = ({ item }: { item: typeof featuredCollections[0] }) => (
    <TouchableOpacity 
      style={styles.collectionItem}
      onPress={() => navigateToCategory(item.query)}
    >
      <Image 
        source={{ uri: item.imageUrl }} 
        style={styles.collectionImage}
      />
      <Text style={styles.collectionTitle}>{item.title}</Text>
    </TouchableOpacity>
  );

  const loadWallpapers = async () => {
    try {
      setLoading(true);
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
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading amazing wallpapers...</Text>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <StatusBar style="auto" />
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Fresco',
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
                source={{ uri: item.imageUrl }} 
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
          
          <View style={styles.wallpapersGrid}>
            {latestWallpapers.map(wallpaper => (
              <WallpaperCard
                key={wallpaper.id}
                id={wallpaper.id}
                thumbUrl={wallpaper.thumbs.small}
                resolution={wallpaper.resolution}
              />
            ))}
          </View>
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
          
          <View style={styles.wallpapersGrid}>
            {topWallpapers.map(wallpaper => (
              <WallpaperCard
                key={wallpaper.id}
                id={wallpaper.id}
                thumbUrl={wallpaper.thumbs.small}
                resolution={wallpaper.resolution}
              />
            ))}
          </View>
        </View>
        
        <View style={styles.footer} />
      </ScrollView>
    </ThemedView>
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
    fontSize: 20,
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
    fontSize: 18,
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
    fontSize: 12,
    fontFamily: 'Nunito-Regular',
  },
  categoriesTitle: {
    fontFamily: 'Nunito-Bold',
    fontSize: 18,
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
    fontSize: 13,
  },
  section: {
    marginBottom: 24,
  },
  wallpapersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 8,
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
});
