import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import React, { useEffect, useState, useRef } from 'react';
import { Image, StyleSheet, View, Dimensions, ActivityIndicator, TouchableOpacity, Share, Animated, Platform } from 'react-native';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { ThemedView, ThemedText, ThemedScrollView } from '@/components/ThemedComponents';
import { wallhavenAPI, WallpaperPreview } from '../services/wallhaven';
import { Chip, FAB, IconButton, Surface, Text, useTheme, Divider, Button, Portal, Dialog, Avatar } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
import { useThemeContext } from '../../contexts/ThemeContext';

const { width, height } = Dimensions.get('window');

export default function WallpaperScreen() {
  const { id } = useLocalSearchParams();
  const paperTheme = useTheme();
  const { theme } = useThemeContext();
  const isDark = theme === 'dark';
  const router = useRouter();
  const scrollY = useRef(new Animated.Value(0)).current;
  const [wallpaper, setWallpaper] = useState<WallpaperPreview | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [showFullscreen, setShowFullscreen] = useState(false);
  const [downloadDialogVisible, setDownloadDialogVisible] = useState(false);

  // Calculate header opacity based on scroll position
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 100, 200],
    outputRange: [0, 0.5, 1],
    extrapolate: 'clamp',
  });

  useEffect(() => {
    const fetchWallpaperDetails = async () => {
      try {
        setLoading(true);
        const data = await wallhavenAPI.getWallpaper(id as string);
        setWallpaper(data);
      } catch (error) {
        console.error('Failed to fetch wallpaper details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchWallpaperDetails();
  }, [id]);

  const toggleFavorite = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsFavorite(!isFavorite);
    // Here you would implement the actual favorite logic with Redux/AsyncStorage
  };

  const shareWallpaper = async () => {
    if (wallpaper) {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        await Share.share({
          message: `Check out this wallpaper: ${wallpaper.short_url || wallpaper.url}`,
          url: wallpaper.url,
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    }
  };

  const showDownloadOptions = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setDownloadDialogVisible(true);
  };

  const downloadWallpaper = (quality = 'original') => {
    // Implement download functionality
    setDownloadDialogVisible(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    console.log(`Downloading ${quality} wallpaper:`, wallpaper?.path);
  };

  const applyWallpaper = () => {
    // Implement wallpaper setting functionality
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    console.log('Applying wallpaper as background');
  };

  const toggleFullscreen = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowFullscreen(!showFullscreen);
  };

  // Animated header background
  const AnimatedSurface = Animated.createAnimatedComponent(Surface);

  return (
    <ThemedView style={styles.container}>
      <StatusBar style={isDark ? "light" : "dark"} />
      
      {/* Animated Header */}
      <AnimatedSurface 
        style={[
          styles.animatedHeader, 
          { 
            opacity: headerOpacity,
            backgroundColor: paperTheme.colors.elevation.level2 
          }
        ]} 
        elevation={4}
      >
        <View />
      </AnimatedSurface>
      
      <Stack.Screen
        options={{
          headerTransparent: true,
          title: '',
          headerLeft: () => (
            <IconButton
              icon={() => (
                <IconSymbol 
                  name="chevron.backward" 
                  size={24} 
                  color={isDark ? "white" : "black"} 
                  style={styles.backIcon}
                />
              )}
              onPress={() => router.back()}
              style={styles.backButton}
            />
          ),
          headerRight: () => (
            <View style={styles.headerButtons}>
              <IconButton
                icon={() => (
                  <IconSymbol 
                    name={isFavorite ? "heart.fill" : "heart"} 
                    size={24} 
                    color={isFavorite ? "#FF3B30" : isDark ? "white" : "black"}
                    style={styles.headerIcon}
                  />
                )}
                onPress={toggleFavorite}
                style={styles.iconButton}
              />
              <IconButton
                icon={() => (
                  <IconSymbol 
                    name="square.and.arrow.up" 
                    size={24} 
                    color={isDark ? "white" : "black"}
                    style={styles.headerIcon} 
                  />
                )}
                onPress={shareWallpaper}
                style={styles.iconButton}
              />
            </View>
          ),
        }}
      />
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={paperTheme.colors.primary} />
          <Text style={styles.loadingText}>Loading wallpaper...</Text>
        </View>
      ) : wallpaper ? (
        <>
          <ThemedScrollView 
            style={styles.scrollView}
            onScroll={Animated.event(
              [{ nativeEvent: { contentOffset: { y: scrollY } } }],
              { useNativeDriver: false }
            )}
            scrollEventThrottle={16}
          >
            <TouchableOpacity activeOpacity={0.9} onPress={toggleFullscreen}>
              <Image
                source={{ uri: wallpaper.path }}
                style={styles.image}
                resizeMode="cover"
              />
              <LinearGradient
                colors={['rgba(0,0,0,0.7)', 'transparent', 'transparent', 'rgba(0,0,0,0.7)']}
                style={styles.imageGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
              />
            </TouchableOpacity>
            
            <Surface style={styles.infoCard} elevation={0} mode="flat">
              <View style={styles.metaRow}>
                <View style={styles.metaItem}>
                  <Avatar.Icon 
                    icon={() => <IconSymbol name="photo" size={16} color={theme.colors.onSurfaceVariant} />} 
                    size={32} 
                    style={styles.metaIcon} 
                  />
                  <View>
                    <Text variant="labelSmall" style={styles.metaLabel}>Category</Text>
                    <Text variant="bodyMedium" style={styles.metaValue}>
                      {wallpaper.category.charAt(0).toUpperCase() + wallpaper.category.slice(1)}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.metaItem}>
                  <Avatar.Icon 
                    icon={() => <IconSymbol name="heart.fill" size={16} color={theme.colors.onSurfaceVariant} />} 
                    size={32} 
                    style={styles.metaIcon} 
                  />
                  <View>
                    <Text variant="labelSmall" style={styles.metaLabel}>Favorites</Text>
                    <Text variant="bodyMedium" style={styles.metaValue}>
                      {wallpaper.favorites.toLocaleString()}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.metaItem}>
                  <Avatar.Icon 
                    icon={() => <IconSymbol name="eye.fill" size={16} color={theme.colors.onSurfaceVariant} />} 
                    size={32} 
                    style={styles.metaIcon} 
                  />
                  <View>
                    <Text variant="labelSmall" style={styles.metaLabel}>Views</Text>
                    <Text variant="bodyMedium" style={styles.metaValue}>
                      {wallpaper.views.toLocaleString()}
                    </Text>
                  </View>
                </View>
              </View>

              <Divider style={styles.divider} />
              
              <Text variant="titleMedium" style={styles.sectionTitle}>Details</Text>
              
              <View style={styles.detailGrid}>
                <View style={styles.detailItem}>
                  <Text variant="labelSmall" style={styles.detailLabel}>Resolution</Text>
                  <Text variant="bodyMedium" style={styles.detailValue}>{wallpaper.resolution}</Text>
                </View>
                
                <View style={styles.detailItem}>
                  <Text variant="labelSmall" style={styles.detailLabel}>Size</Text>
                  <Text variant="bodyMedium" style={styles.detailValue}>
                    {(wallpaper.file_size / (1024 * 1024)).toFixed(2)} MB
                  </Text>
                </View>
                
                <View style={styles.detailItem}>
                  <Text variant="labelSmall" style={styles.detailLabel}>Ratio</Text>
                  <Text variant="bodyMedium" style={styles.detailValue}>{wallpaper.ratio}</Text>
                </View>
                
                <View style={styles.detailItem}>
                  <Text variant="labelSmall" style={styles.detailLabel}>Type</Text>
                  <Text variant="bodyMedium" style={styles.detailValue}>{wallpaper.file_type.split('/')[1]}</Text>
                </View>
              </View>
              
              {wallpaper.colors && wallpaper.colors.length > 0 && (
                <>
                  <Text variant="titleMedium" style={styles.sectionTitle}>Colors</Text>
                  <View style={styles.colorsContainer}>
                    {wallpaper.colors.map((color, index) => (
                      <View
                        key={index}
                        style={[styles.colorBox, { backgroundColor: color }]}
                      >
                        <Text style={styles.colorText}>{color}</Text>
                      </View>
                    ))}
                  </View>
                </>
              )}
              
              {wallpaper.tags && wallpaper.tags.length > 0 && (
                <>
                  <Text variant="titleMedium" style={styles.sectionTitle}>Tags</Text>
                  <View style={styles.tagsContainer}>
                    {wallpaper.tags.map(tag => (
                      <Chip
                        key={tag.id}
                        style={styles.tagChip}
                        mode="outlined"
                      >
                        {tag.name}
                      </Chip>
                    ))}
                  </View>
                </>
              )}
            </Surface>
            
            <View style={styles.actions}>
              <Button 
                mode="contained" 
                onPress={showDownloadOptions}
                icon={() => <IconSymbol name="arrow.down.to.line" size={18} color="white" />}
                style={[styles.button, { backgroundColor: theme.colors.primary }]}
              >
                Download
              </Button>
              
              <Button 
                mode="outlined" 
                onPress={applyWallpaper}
                icon={() => <IconSymbol name="photo" size={18} color={theme.colors.primary} />}
                style={styles.button}
              >
                Set as Wallpaper
              </Button>
            </View>

            <View style={styles.footer} />
          </ThemedScrollView>
          
          <FAB
            icon={() => <IconSymbol name="arrow.down.to.line" size={20} color="white" />}
            style={styles.fab}
            onPress={showDownloadOptions}
            mode="elevated"
          />
          
          <Portal>
            <Dialog visible={downloadDialogVisible} onDismiss={() => setDownloadDialogVisible(false)} style={styles.dialog}>
              <Dialog.Title>Download Wallpaper</Dialog.Title>
              <Dialog.Content>
                <Text variant="bodyMedium">Select quality to download:</Text>
                <View style={styles.downloadOptions}>
                  <Button 
                    mode="outlined" 
                    onPress={() => downloadWallpaper('original')}
                    style={styles.downloadButton}
                  >
                    Original ({wallpaper.resolution})
                  </Button>
                  <Button 
                    mode="outlined" 
                    onPress={() => downloadWallpaper('large')}
                    style={styles.downloadButton}
                  >
                    Large Thumbnail
                  </Button>
                  <Button 
                    mode="outlined" 
                    onPress={() => downloadWallpaper('small')}
                    style={styles.downloadButton}
                  >
                    Small Thumbnail
                  </Button>
                </View>
              </Dialog.Content>
              <Dialog.Actions>
                <Button onPress={() => setDownloadDialogVisible(false)}>Cancel</Button>
              </Dialog.Actions>
            </Dialog>
          </Portal>
        </>
      ) : (
        <View style={styles.errorContainer}>
          <IconSymbol name="exclamationmark.triangle" size={48} color={theme.colors.error} />
          <Text variant="titleMedium" style={styles.errorText}>
            Could not load wallpaper
          </Text>
          <Button mode="contained" onPress={() => router.back()}>
            Go Back
          </Button>
        </View>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  animatedHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 100,
    zIndex: 1,
  },
  backIcon: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
  },
  backButton: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 20,
    margin: 4,
  },
  headerButtons: {
    flexDirection: 'row',
  },
  headerIcon: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
  },
  iconButton: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 20,
    margin: 4,
  },
  scrollView: {
    flex: 1,
  },
  image: {
    width: width,
    height: width * 1.5,
    maxHeight: height * 0.7,
  },
  imageGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: width * 1.5,
    maxHeight: height * 0.7,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  infoCard: {
    margin: 16,
    borderRadius: 28,
    padding: 20,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    marginTop: 8,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaIcon: {
    backgroundColor: theme => theme.colors.surfaceVariant,
    marginRight: 8,
  },
  metaLabel: {
    color: theme => theme.colors.outline,
  },
  metaValue: {
    fontWeight: '500',
  },
  divider: {
    marginVertical: 16,
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginBottom: 16,
  },
  detailGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
  },
  detailItem: {
    width: '50%',
    marginBottom: 16,
  },
  detailLabel: {
    color: theme => theme.colors.outline,
    marginBottom: 4,
  },
  detailValue: {
    fontWeight: '500',
  },
  colorsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
  },
  colorBox: {
    width: 60,
    height: 60,
    borderRadius: 12,
    margin: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorText: {
    fontSize: 8,
    color: 'white',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
  },
  tagChip: {
    margin: 4,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    paddingHorizontal: 24,
  },
  button: {
    flex: 1,
    marginHorizontal: 8,
    borderRadius: 24,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  errorText: {
    marginBottom: 16,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    borderRadius: 28,
  },
  dialog: {
    borderRadius: 28,
  },
  downloadOptions: {
    marginTop: 16,
  },
  downloadButton: {
    marginVertical: 8,
    borderRadius: 12,
  },
  footer: {
    height: 80,
  },
}); 