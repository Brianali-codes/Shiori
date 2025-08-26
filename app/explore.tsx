import React, { useEffect, useState } from 'react';
import { StyleSheet, View, FlatList, ActivityIndicator, Dimensions } from 'react-native';
import { Searchbar, useTheme, IconButton } from 'react-native-paper';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ThemedView } from '@/components/ThemedComponents';
import { WallpaperCard } from '@/components/ui/WallpaperCard';
import { wallhavenAPI, WallpaperPreview } from './services/wallhaven';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');
const ITEM_WIDTH = width * 0.8;

export default function ExploreScreen() {
  const theme = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams();
  const [wallpapers, setWallpapers] = useState<WallpaperPreview[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [searchQuery, setSearchQuery] = useState(params.q as string || '');
  const [category, setCategory] = useState(params.category as string || 'all');
  const [purity, setPurity] = useState(params.purity as string || 'sfw');

  const loadWallpapers = async (pageNum: number = 1, shouldRefresh: boolean = false) => {
    try {
      if (pageNum === 1) setLoading(true);
      
      const response = await wallhavenAPI.search({
        q: searchQuery,
        categories: category === 'all' ? '111' : category === 'general' ? '100' : category === 'anime' ? '010' : '001',
        purity: purity === 'sfw' ? '100' : purity === 'sketchy' ? '010' : '001',
        page: pageNum
      });

      if (shouldRefresh) {
        setWallpapers(response.data);
      } else {
        setWallpapers(prev => [...prev, ...response.data]);
      }

      setHasMore(response.data.length === 24); // Wallhaven returns 24 items per page
    } catch (error) {
      console.error('Error loading wallpapers:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleSearch = () => {
    setPage(1);
    setWallpapers([]);
    loadWallpapers(1, true);
  };

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      setPage(prev => prev + 1);
      loadWallpapers(page + 1);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    setPage(1);
    await loadWallpapers(1, true);
  };

  useEffect(() => {
    loadWallpapers(1, true);
  }, [searchQuery, category, purity]);

  const renderWallpaper = ({ item }: { item: WallpaperPreview }) => (
    <WallpaperCard 
      id={item.id}
      thumbUrl={item.thumbs.large}
      resolution={item.resolution}
    />
  );

  const renderFooter = () => {
    if (!loading) return null;
    return (
      <View style={styles.footer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top']}>
      <ThemedView style={styles.container}>
        <StatusBar style="auto" />
        <Stack.Screen
          options={{
            headerShown: false,
            title: 'Explore',
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

        <FlatList
          data={wallpapers}
          renderItem={renderWallpaper}
          keyExtractor={item => item.id}
          numColumns={2}
          contentContainerStyle={styles.grid}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={renderFooter}
          refreshing={refreshing}
          onRefresh={onRefresh}
        />
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerTitle: {
    fontFamily: 'Nunito-Bold',
    fontSize: 20,
  },
  searchBar: {
    margin: 16,
    borderRadius: 16,
  },
  grid: {
    padding: 8,
  },
  footer: {
    paddingVertical: 20,
  },
} as const); 