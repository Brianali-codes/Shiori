import React, { useEffect, useState } from 'react';
import { StyleSheet, ScrollView, View, Image, TouchableOpacity, FlatList, Dimensions, ActivityIndicator } from 'react-native';
import { Text, Surface, Card, Button, useTheme, Title, Chip, Badge } from 'react-native-paper';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { ThemedView } from '@/components/ThemedView';
import { WallpaperCard } from '@/components/ui/WallpaperCard';
import { wallhavenAPI, WallpaperPreview, SearchParams } from '../services/wallhaven';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');
const ITEM_WIDTH = width * 0.8;

const featuredCollections = [
  { id: '1', title: 'Nature', icon: 'leaf.fill', color: '#4CAF50', query: 'nature' },
  { id: '2', title: 'Abstract', icon: 'scribble', color: '#9C27B0', query: 'abstract' },
  { id: '3', title: 'Minimal', icon: 'square.fill', color: '#607D8B', query: 'minimal' },
  { id: '4', title: 'Landscapes', icon: 'mountain.2.fill', color: '#FF9800', query: 'landscape' },
  { id: '5', title: 'Dark', icon: 'moon.fill', color: '#212121', query: 'dark' },
  { id: '6', title: 'Anime', icon: 'sparkles.fill', color: '#E91E63', query: 'anime' },
];

export default function HomeScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [featuredWallpapers, setFeaturedWallpapers] = useState<WallpaperPreview[]>([]);
  const [latestWallpapers, setLatestWallpapers] = useState<WallpaperPreview[]>([]);
  const [topWallpapers, setTopWallpapers] = useState<WallpaperPreview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
      <Surface style={[styles.collectionIcon, { backgroundColor: item.color }]}>
        <IconSymbol name={item.icon as any} size={24} color="white" />
      </Surface>
      <Text style={styles.collectionTitle}>{item.title}</Text>
    </TouchableOpacity>
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
              <Surface style={[styles.collectionIcon, { backgroundColor: item.color }]}>
                <IconSymbol name={item.icon as any} size={24} color="white" />
              </Surface>
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
    fontFamily: 'SpaceMono',
    fontWeight: 'bold',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  sectionTitle: {
    fontWeight: 'bold',
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
  },
  categoriesTitle: {
    fontWeight: 'bold',
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
  collectionIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    elevation: 2,
  },
  collectionTitle: {
    fontWeight: '500',
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
  },
  footer: {
    height: 50,
  },
});
