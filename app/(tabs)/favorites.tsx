import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, FlatList, RefreshControl, ImageBackground, TouchableOpacity, Modal, Image, Dimensions, AppState } from 'react-native';
import { Card, Text, ActivityIndicator, useTheme, IconButton, Button, Portal, FAB, Avatar } from 'react-native-paper';
import { ThemedView, ThemedText } from '@/components/ThemedComponents';
import { Stack, useRouter, useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { wallhavenAPI } from '../services/wallhaven';
import { WallpaperPreview } from '../services/wallhaven';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { HeartIcon } from '@/components/ui/CustomIcons';
import { ArrowDown, Heart, ArrowDown2, InfoCircle, CloseCircle, Trash, Grid3, Fatrows } from 'iconsax-react-nativejs';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { FontSizes } from '@/constants/FontSizes';
import { useThemeColors } from '@/hooks/useThemeColors';

const { width, height } = Dimensions.get('window');

export default function FavoritesScreen() {
  const [favorites, setFavorites] = useState<WallpaperPreview[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedWallpaper, setSelectedWallpaper] = useState<WallpaperPreview | null>(null);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [isGridLayout, setIsGridLayout] = useState(true); // New state for layout
  const theme = useTheme();
  const colors = useThemeColors();
  const router = useRouter();

  const loadFavorites = async () => {
    try {
      setLoading(true);
      const savedFavorites = await AsyncStorage.getItem('favorites');
      if (savedFavorites) {
        const parsedFavorites = JSON.parse(savedFavorites);
        setFavorites(parsedFavorites);
      } else {
        setFavorites([]);
      }
    } catch (error) {
      console.error('Error loading favorites:', error);
      setFavorites([]);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadFavorites();
    setRefreshing(false);
  };

  const removeFromFavorites = async (id: string) => {
    try {
      const updatedFavorites = favorites.filter(wallpaper => wallpaper.id !== id);
      await AsyncStorage.setItem('favorites', JSON.stringify(updatedFavorites));
      setFavorites(updatedFavorites);
    } catch (error) {
      console.error('Error removing from favorites:', error);
    }
  };

  const handleWallpaperPress = (wallpaper: WallpaperPreview) => {
    router.push(`/wallpaper/${wallpaper.id}`);
  };

  const handleClosePreview = () => {
    setPreviewVisible(false);
    setSelectedWallpaper(null);
  };

  const handleDownload = () => {
    if (selectedWallpaper) {
      router.push(`/wallpaper/${selectedWallpaper.id}`);
    }
  };

  const toggleLayout = () => {
    setIsGridLayout(!isGridLayout);
  };

  // Use useFocusEffect to refresh favorites when the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadFavorites();
    }, [])
  );

  // Initial load
  useEffect(() => {
    loadFavorites();
  }, []);

  const renderFavorite = ({ item }: { item: WallpaperPreview }) => (
    <TouchableOpacity 
      style={isGridLayout ? styles.favoriteCardContainer : styles.listItemContainer}
      onPress={() => handleWallpaperPress(item)}
    >
      <Card style={isGridLayout ? styles.favoriteCard : styles.listCard} mode="elevated">
        <ImageBackground
          source={{ uri: item.thumbs.large }}
          style={isGridLayout ? styles.favoriteImage : styles.listImage}
          imageStyle={isGridLayout ? styles.favoriteImageStyle : styles.listImageStyle}
        >
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.7)']}
            style={isGridLayout ? styles.gradientOverlay : styles.listGradientOverlay}
          >
            <View style={isGridLayout ? styles.favoriteContent : styles.listContent}>
              <View style={styles.favoriteInfo}>
                <View style={styles.resolutionContainer}>
                  <InfoCircle size={16} color="#FFFFFF" variant="Broken" />
                  <Text style={[styles.resolution, { fontFamily: 'Nunito-Medium', fontSize: FontSizes.bodySmall }]}>
                    {item.resolution}
                  </Text>
                </View>
                <View style={styles.actions}>
                  <IconButton
                    icon={({ size, color }) => (
                      <Trash size={size} color={color} variant="Broken" />
                    )}
                    size={20}
                    onPress={() => removeFromFavorites(item.id)}
                    style={styles.actionButton}
                  />
                  <IconButton
                    icon={({ size, color }) => (
                      <ArrowDown2 size={size} color={color} variant="Broken" />
                    )}
                    size={20}
                    onPress={() => handleWallpaperPress(item)}
                    style={styles.actionButton}
                  />
                </View>
              </View>
            </View>
          </LinearGradient>
        </ImageBackground>
      </Card>
    </TouchableOpacity>
  );

  const renderPreviewModal = () => (
    <Portal>
      <Modal
        visible={previewVisible}
        onDismiss={handleClosePreview}
        style={styles.modalContainer}
      >
        <View style={[styles.previewContainer, { backgroundColor: theme.colors.background }]}>
          <TouchableOpacity 
            style={styles.closeButton}
            onPress={handleClosePreview}
          >
            <CloseCircle size={28} color={theme.colors.primary} variant="Broken" />
          </TouchableOpacity>
          
          <Image
            source={{ uri: selectedWallpaper?.path || selectedWallpaper?.thumbs.original }}
            style={styles.previewImage}
            resizeMode="contain"
          />
          
          <View style={styles.previewInfo}>
            <Text style={[styles.previewResolution, { color: colors.text, fontFamily: 'Nunito-Bold', fontSize: FontSizes.h4 }]}>
              {selectedWallpaper?.resolution}
            </Text>
            <Text style={[styles.previewSource, { color: colors.subtext, fontFamily: 'Nunito-Regular', fontSize: FontSizes.body }]}>
              Source: Wallhaven
            </Text>
          </View>
          
          <FAB
            icon={({ size, color }) => <ArrowDown2 size={size} color={color} variant="Broken" />}
            label="Download"
            style={styles.downloadButton}
            onPress={handleDownload}
          />
        </View>
      </Modal>
    </Portal>
  );

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top']}>
      <ThemedView style={styles.container}>
        <StatusBar style="auto" />
        <Stack.Screen
          options={{
            title: 'Favorites',
            headerShadowVisible: false,
            headerTitleStyle: {
              fontFamily: 'Nunito-Bold',
              fontSize: FontSizes.h3
            }
          }}
        />

        {favorites.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Heart size={64} color={theme.colors.primary} variant="Broken" />
            <Text style={[styles.emptyText, { fontFamily: 'Nunito-Bold', fontSize: FontSizes.h4 }]}>
              No favorites yet
            </Text>
            <Text style={[styles.emptySubtext, { fontFamily: 'Nunito-Regular', fontSize: FontSizes.body }]}>
              Start adding wallpapers to your favorites
            </Text>
            <Button
              mode="contained"
              onPress={() => {router.replace('/explore');}}
              style={styles.exploreButton}
              labelStyle={{ fontFamily: 'Nunito-Bold', fontSize: FontSizes.button }}
            >
              Explore Wallpapers
            </Button>
          </View>
        ) : loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" />
          </View>
        ) : (
          <>
            <View style={styles.headerContainer}>
              <View style={styles.headerRow}>
                <Avatar.Image
                  size={38}
                  source={require('@/assets/images/shiori.png')}
                />
                <View style={styles.headerCol}>
                  <Text style={[styles.appTitle, { fontFamily: 'Nunito-Bold', fontSize: FontSizes.h4 }]}>
                    Favorites <Text style={[styles.subtitle, { fontFamily: 'Nunito-Regular', fontSize: FontSizes.body }]}>v1.0.0</Text>
                  </Text>
                  <Text style={[styles.subtitle, { fontFamily: 'Nunito-Regular', fontSize: FontSizes.bodySmall }]}>
                    {favorites.length} {favorites.length === 1 ? 'wallpaper' : 'wallpapers'} saved
                  </Text>
                </View>
              </View>

              <View style={styles.glassIcons}>
                <TouchableOpacity onPress={toggleLayout} style={styles.layoutButton}>
                  {isGridLayout ? (
                    <Fatrows size={20} color="#777" variant="Broken" />
                  ) : (
                    <Grid3 size={20} color="#777" variant="Broken" />
                  )}
                </TouchableOpacity>
              </View>
            </View>
            
            <FlatList
              data={favorites}
              renderItem={renderFavorite}
              keyExtractor={(item) => item.id}
              numColumns={isGridLayout ? 2 : 1}
              key={isGridLayout ? 'grid' : 'list'}
              contentContainerStyle={styles.favoritesList}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
              }
            />
          </>
        )}
        
        {renderPreviewModal()}
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(10px)',
    borderRadius: 20,
    marginHorizontal: 15,
    marginTop: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerCol: {
    marginLeft: 12,
  },
  appTitle: {
    color: '#ffffff',

    marginBottom: 2,
  },
  subtitle: {
    color: '#777',
  },
   glassIcons: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 20,
    padding: 5,
    backdropFilter: 'blur(10px)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  layoutButton: {
    padding: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    opacity: 0.7,
    textAlign: 'center',
    marginBottom: 24,
  },
  exploreButton: {
    borderRadius: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  favoritesList: {
    padding: 8,
  },
  favoriteCardContainer: {
    flex: 1,
    margin: 8,
  },
  favoriteCard: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
  },
  favoriteImage: {
    aspectRatio: 1,
    width: '100%',
  },
  favoriteImageStyle: {
    borderRadius: 16,
  },
  gradientOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
    justifyContent: 'flex-end',
  },
  favoriteContent: {
    padding: 12,
  },
  // List layout styles
  listItemContainer: {
    marginHorizontal: 8,
    marginVertical: 4,
  },
  listCard: {
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
  },
  listImage: {
    height: 120,
    width: '100%',
    flexDirection: 'row',
  },
  listImageStyle: {
    borderRadius: 16,
  },
  listGradientOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
    justifyContent: 'flex-end',
  },
  listContent: {
    padding: 12,
  },
  favoriteInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  resolutionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  resolution: {
    color: '#FFFFFF',
    opacity: 0.9,
    marginLeft: 4,
  },
  actions: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 20,
    padding: 4,
  },
  actionButton: {
    margin: 0,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.9)',
  },
  previewContainer: {
    width: width * 0.9,
    height: height * 0.8,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    padding: 4,
  },
  previewImage: {
    width: '100%',
    height: '80%',
  },
  previewInfo: {
    padding: 16,
  },
  previewResolution: {
    marginBottom: 4,
  },
  previewSource: {
    opacity: 0.7,
  },
  downloadButton: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    borderRadius: 16,
  },
});