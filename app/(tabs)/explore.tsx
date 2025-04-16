import React, { useState, useEffect } from 'react';
import { StyleSheet, View, FlatList, RefreshControl, ScrollView, Alert, Platform } from 'react-native';
import { Card, Text, ActivityIndicator, useTheme, Searchbar, Chip, IconButton } from 'react-native-paper';
import { ThemedView } from '@/components/ThemedComponents';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { wallhavenAPI } from '../services/wallhaven';
import { WallpaperPreview } from '../services/wallhaven';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { HeartIcon } from '@/components/ui/CustomIcons';

export default function ExploreScreen() {
  const [wallpapers, setWallpapers] = useState<WallpaperPreview[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSort, setSelectedSort] = useState('date_added');
  const [selectedOrder, setSelectedOrder] = useState('desc');
  const [showNsfwContent, setShowNsfwContent] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);
  const theme = useTheme();

  // Load NSFW setting and favorites on component mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        // Load NSFW setting
        const nsfwSetting = await AsyncStorage.getItem('showNsfwContent');
        if (nsfwSetting !== null) {
          setShowNsfwContent(nsfwSetting === 'true');
        }
        
        // Load favorites
        const savedFavorites = await AsyncStorage.getItem('favorites');
        if (savedFavorites) {
          const parsedFavorites = JSON.parse(savedFavorites);
          setFavorites(parsedFavorites.map((item: WallpaperPreview) => item.id));
        }
      } catch (error) {
        console.error('Failed to load settings:', error);
      }
    };
    
    loadSettings();
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
  
  const toggleFavorite = async (wallpaper: WallpaperPreview) => {
    try {
      const savedFavorites = await AsyncStorage.getItem('favorites');
      let favoritesArray: WallpaperPreview[] = [];
      
      if (savedFavorites) {
        favoritesArray = JSON.parse(savedFavorites);
      }
      
      // Check if already in favorites
      const isFavorite = favorites.includes(wallpaper.id);
      
      if (isFavorite) {
        // Remove from favorites
        const updatedFavorites = favoritesArray.filter(item => item.id !== wallpaper.id);
        await AsyncStorage.setItem('favorites', JSON.stringify(updatedFavorites));
        setFavorites(updatedFavorites.map(item => item.id));
      } else {
        // Add to favorites
        favoritesArray.push(wallpaper);
        await AsyncStorage.setItem('favorites', JSON.stringify(favoritesArray));
        setFavorites([...favorites, wallpaper.id]);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const loadWallpapers = async () => {
    try {
      setLoading(true);
      
      // Check if trying to access NSFW content without API key
      if (showNsfwContent && !wallhavenAPI.hasApiKey()) {
        Alert.alert(
          'API Key Required', 
          'You need to set a Wallhaven API key in Settings to access NSFW content.',
          [{ text: 'OK' }]
        );
      }
      
      const response = await wallhavenAPI.search({
        q: searchQuery,
        sorting: selectedSort as any,
        order: selectedOrder as any,
        // Set purity based on NSFW setting
        purity: showNsfwContent ? (wallhavenAPI.hasApiKey() ? '111' : '100') : '100', // If NSFW allowed and has API key, enable all; otherwise only SFW
      });
      setWallpapers(response.data);
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
    // Set the API key
    wallhavenAPI.setApiKey('S9eGuYOS7MOFjXfV91Up30hozbk5kpQR');
    
    loadWallpapers();
  }, [searchQuery, selectedSort, selectedOrder]);

  const renderWallpaper = ({ item }: { item: WallpaperPreview }) => {
    const isFavorite = favorites.includes(item.id);
    
    return (
      <Card style={styles.wallpaperCard} mode="elevated">
        <View style={styles.wallpaperContainer}>
          <Card.Cover source={{ uri: item.thumbs.large }} style={styles.wallpaperImage} />
          
          {/* Glassmorphic favorite button */}
          <TouchableOpacity 
            style={styles.favoriteButton}
            onPress={() => toggleFavorite(item)}
          >
            <BlurView intensity={25} tint="dark" style={styles.blurView}>
              <HeartIcon
                size={22}
                color="#FFFFFF"
                isFilled={isFavorite}
                style={styles.heartIcon}
              />
            </BlurView>
          </TouchableOpacity>
          
          {/* Image info overlay */}
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.7)']}
            style={styles.infoGradient}
          >
            <Text style={styles.resolutionText}>{item.resolution}</Text>
          </LinearGradient>
        </View>
      </Card>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'right', 'left', 'bottom']}>
      <ThemedView style={styles.container}>
        <StatusBar style="auto" />
        <Stack.Screen
          options={{
            title: 'Explore',
            headerShadowVisible: false,
          }}
        />

        <View style={styles.contentContainer}>
          <Searchbar
            placeholder="Search wallpapers..."
            onChangeText={setSearchQuery}
            value={searchQuery}
            style={styles.searchBar}
          />

          <View style={styles.filterContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.sortScroll}>
              {sortOptions.map((sort) => (
                <Chip
                  key={sort.id}
                  selected={selectedSort === sort.id}
                  onPress={() => setSelectedSort(sort.id)}
                  style={styles.sortChip}
                >
                  {sort.label}
                </Chip>
              ))}
            </ScrollView>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.orderScroll}>
              {orderOptions.map((order) => (
                <Chip
                  key={order.id}
                  selected={selectedOrder === order.id}
                  onPress={() => setSelectedOrder(order.id)}
                  style={styles.orderChip}
                >
                  {order.label}
                </Chip>
              ))}
            </ScrollView>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
          ) : (
            <FlatList
              data={wallpapers}
              renderItem={renderWallpaper}
              keyExtractor={(item) => item.id}
              numColumns={2}
              contentContainerStyle={styles.wallpaperList}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
              }
              showsVerticalScrollIndicator={false}
              columnWrapperStyle={styles.columnWrapper}
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
    paddingHorizontal: 12,
  },
  searchBar: {
    margin: 8,
    borderRadius: 16,
    elevation: 2,
  },
  filterContainer: {
    marginHorizontal: 4,
  },
  sortScroll: {
    marginBottom: 8,
  },
  orderScroll: {
    marginBottom: 12,
  },
  sortChip: {
    marginRight: 8,
    marginLeft: 4,
  },
  orderChip: {
    marginRight: 8,
    marginLeft: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  wallpaperList: {
    paddingBottom: Platform.OS === 'ios' ? 20 : 80,
  },
  columnWrapper: {
    justifyContent: 'space-between',
  },
  wallpaperCard: {
    width: '48%',
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 3,
  },
  wallpaperContainer: {
    position: 'relative',
  },
  wallpaperImage: {
    aspectRatio: 1,
    borderRadius: 0,
  },
  favoriteButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 2,
  },
  blurView: {
    borderRadius: 20,
    overflow: 'hidden',
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heartIcon: {
    marginTop: 2, // Visual alignment
  },
  infoGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 50,
    justifyContent: 'flex-end',
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  resolutionText: {
    color: 'white',
    fontSize: 12,
    fontFamily: 'Nunito-Medium',
  },
});
