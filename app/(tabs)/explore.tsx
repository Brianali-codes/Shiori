import React, { useState, useCallback, useEffect } from 'react';
import { StyleSheet, FlatList, RefreshControl, View, ActivityIndicator } from 'react-native';
import { Searchbar, Chip, useTheme, Divider, Text } from 'react-native-paper';
import { Stack, useRouter } from 'expo-router';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { ThemedView } from '@/components/ThemedView';
import { WallpaperCard } from '@/components/ui/WallpaperCard';
import { wallhavenAPI, WallpaperPreview, SearchParams } from '../services/wallhaven';

interface Category {
  id: string;
  label: string;
  icon: string;
}

interface SortOption {
  id: SearchParams['sorting'];
  label: string;
}

const categories: Category[] = [
  { id: '100', label: 'General', icon: 'photo.fill' },
  { id: '010', label: 'Anime', icon: 'sparkles.fill' },
  { id: '001', label: 'People', icon: 'person.fill' },
  { id: '111', label: 'All', icon: 'rectangle.grid.2x2.fill' },
];

const sortOptions: SortOption[] = [
  { id: 'date_added', label: 'Latest' },
  { id: 'toplist', label: 'Top' },
  { id: 'random', label: 'Random' },
  { id: 'views', label: 'Most Viewed' },
  { id: 'favorites', label: 'Most Favorited' },
];

export default function ExploreScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategories, setSelectedCategories] = useState(['111']); // Default to All
  const [selectedSort, setSelectedSort] = useState<SearchParams['sorting']>('toplist');
  const [wallpapers, setWallpapers] = useState<WallpaperPreview[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMorePages, setHasMorePages] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchWallpapers = useCallback(async (pageNum = 1, append = false) => {
    if (pageNum === 1) setLoading(true);
    if (pageNum > 1) setLoadingMore(true);
    
    try {
      const response = await wallhavenAPI.search({
        q: searchQuery,
        categories: selectedCategories[0], // Use first category only
        sorting: selectedSort,
        page: pageNum,
      });
      
      if (response.data) {
        if (append) {
          setWallpapers(prev => [...prev, ...response.data]);
        } else {
          setWallpapers(response.data);
        }
        
        setHasMorePages(response.meta.current_page < response.meta.last_page);
        setPage(response.meta.current_page);
      }
    } catch (error) {
      console.error('Failed to fetch wallpapers:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  }, [searchQuery, selectedCategories, selectedSort]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchWallpapers(1, false);
  }, [fetchWallpapers]);

  const loadMoreWallpapers = useCallback(() => {
    if (!loadingMore && hasMorePages) {
      fetchWallpapers(page + 1, true);
    }
  }, [fetchWallpapers, loadingMore, hasMorePages, page]);

  // Initial load
  useEffect(() => {
    fetchWallpapers(1, false);
  }, [selectedSort, selectedCategories]);

  const toggleCategory = (categoryId: string) => {
    setSelectedCategories([categoryId]); // Set single category
  };

  const navigateToWallpaper = (id: string) => {
    router.push(`/wallpaper/${id}`);
  };

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Explore',
          headerShadowVisible: false,
          headerStyle: { backgroundColor: theme.colors.background },
        }}
      />
      
      <Searchbar
        placeholder="Search wallpapers..."
        onChangeText={(text: string) => setSearchQuery(text)}
        value={searchQuery}
        style={styles.searchBar}
        onSubmitEditing={() => fetchWallpapers(1, false)}
      />

      <View style={styles.filtersContainer}>
        <FlatList
          data={categories}
          horizontal
          showsHorizontalScrollIndicator={false}
          renderItem={({ item }) => (
            <Chip
              style={styles.chip}
              mode="flat"
              selected={selectedCategories.includes(item.id)}
              onPress={() => toggleCategory(item.id)}
              elevation={1}
              showSelectedOverlay
              icon={() => (
                <IconSymbol
                  name={item.icon as any}
                  size={16}
                  color={selectedCategories.includes(item.id) 
                    ? theme.colors.primary 
                    : theme.colors.onSurfaceVariant}
                />
              )}
            >
              {item.label}
            </Chip>
          )}
          contentContainerStyle={styles.filterList}
        />

        <Divider style={styles.divider} />

        <FlatList
          data={sortOptions}
          horizontal
          showsHorizontalScrollIndicator={false}
          renderItem={({ item }) => (
            <Chip
              style={styles.chip}
              mode="outlined"
              selected={selectedSort === item.id}
              onPress={() => setSelectedSort(item.id)}
              showSelectedOverlay
            >
              {item.label}
            </Chip>
          )}
          contentContainerStyle={styles.filterList}
        />
      </View>

      <FlatList
        data={wallpapers}
        numColumns={2}
        renderItem={({ item }) => (
          <WallpaperCard
            id={item.id}
            thumbUrl={item.thumbs.small}
            resolution={item.resolution}
          />
        )}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        onEndReached={loadMoreWallpapers}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          loadingMore ? (
            <View style={styles.loadingMore}>
              <ActivityIndicator size="small" color={theme.colors.primary} />
              <Text variant="labelMedium" style={{ marginLeft: 8 }}>Loading more...</Text>
            </View>
          ) : null
        }
        ListEmptyComponent={
          loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
              <Text style={styles.loadingText}>Fetching wallpapers...</Text>
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <IconSymbol
                name="photo.fill" 
                size={48}
                color={theme.colors.outline}
              />
              <Text variant="titleMedium" style={styles.emptyText}>No wallpapers found</Text>
              <Text variant="bodyMedium" style={styles.emptySubtext}>Try adjusting your search</Text>
            </View>
          )
        }
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchBar: {
    margin: 16,
    borderRadius: 28,
  },
  filtersContainer: {
    paddingHorizontal: 8,
    marginBottom: 8,
  },
  filterList: {
    paddingHorizontal: 8,
  },
  divider: {
    marginVertical: 8,
  },
  chip: {
    marginHorizontal: 4,
    marginVertical: 4,
  },
  list: {
    padding: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    height: 300,
  },
  loadingText: {
    marginTop: 12,
    color: theme => theme.colors.onSurfaceVariant,
  },
  loadingMore: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    height: 300,
  },
  emptyText: {
    marginTop: 16,
    color: theme => theme.colors.onSurfaceVariant,
  },
  emptySubtext: {
    color: theme => theme.colors.outline,
  },
});
