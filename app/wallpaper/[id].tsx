import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState, useRef } from 'react';
import { Image, StyleSheet, View, Dimensions, ActivityIndicator, TouchableOpacity, Share, Animated, Platform, Alert, Linking, ToastAndroid } from 'react-native';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { ThemedView, ThemedText, ThemedScrollView } from '@/components/ThemedComponents';
import { wallhavenAPI, WallpaperPreview } from '../services/wallhaven';
import { Chip, FAB, IconButton, Surface, Text, useTheme, Divider, Button, Portal, Dialog, Avatar, ProgressBar } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
import { useThemeContext } from '../../contexts/ThemeContext';
import { fontStyles } from '../../utils/fontStyles';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import WebView from 'react-native-webview';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DocumentDownload, Heart, Share as ShareIcon, ArrowLeft, Back, ArrowDown2, Personalcard, ArrowCircleDown2, Category, Star1, Eye, DocumentUpload, ArrowLeft2 } from 'iconsax-react-nativejs';
import NetInfo from '@react-native-community/netinfo';
import { Stack } from 'expo-router';
import { Image as Image1 } from 'iconsax-react-nativejs';

export const options = {
  headerShown: false,
};

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
  const [downloading, setDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [webViewVisible, setWebViewVisible] = useState(false);
  const [showFallbackDialog, setShowFallbackDialog] = useState(false);
  const [selectedResolution, setSelectedResolution] = useState('original');

  
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

  const checkPermissions = async () => {
    if (Platform.OS === 'android' || Platform.OS === 'ios') {
      try {
        const { status } = await MediaLibrary.requestPermissionsAsync();
        
        if (status !== 'granted') {
          Alert.alert(
            'Permission Required',
            'Shiori needs storage permission to save wallpapers to your device.',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Settings', onPress: () => Linking.openSettings() }
            ]
          );
          return false;
        }
        return true;
      } catch (error) {
        console.error('Error requesting permissions:', error);
        Alert.alert('Permission Error', 'Could not request storage permissions');
        return false;
      }
    }
    return true;
  };

  const getDownloadUrl = (quality: string): string => {
    if (!wallpaper) return '';
    
    switch (quality) {
      case 'original':
        return wallpaper.path;
      case 'large':
        return wallpaper.thumbs.large;
      case 'small':
        return wallpaper.thumbs.small;
      default:
        return wallpaper.path;
    }
  };

  const getFileNameForQuality = (quality: string): string => {
    if (!wallpaper) return '';
    
    const fileExtension = wallpaper.path.split('.').pop() || 'jpg';
    return `shiori_${wallpaper.id}_${quality}.${fileExtension}`;
  };

  const downloadWallpaper = async (quality = 'original') => {
    if (!wallpaper) return;
    
    setSelectedResolution(quality);
    setDownloadDialogVisible(false);
    
    // Check permissions
    const hasPermission = await checkPermissions();
    if (!hasPermission) return;
    
    // Check if download on WiFi only is enabled
    const downloadOnWifi = await AsyncStorage.getItem('downloadOnWifi') === 'true';
    
    if (downloadOnWifi) {
      // Check network type
      const netInfo = await NetInfo.fetch();
      if (netInfo.type !== 'wifi') {
        if (Platform.OS === 'android') {
          ToastAndroid.show('Please connect to WiFi to download', ToastAndroid.SHORT);
        } else {
          Alert.alert('WiFi Required', 'Please connect to WiFi to download wallpapers');
        }
        return;
      }
    }

    // Start downloading
    setDownloading(true);
    setDownloadProgress(0);
    setDownloadError(null);
    
    const downloadUrl = getDownloadUrl(quality);
    // Generate a unique filename with timestamp to avoid conflicts
    const timestamp = new Date().getTime();
    const fileName = `shiori_${wallpaper.id}_${quality}_${timestamp}.${wallpaper.file_type.split('/')[1] || 'jpg'}`;
    
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      
      // Get download location preference
      const downloadLocation = await AsyncStorage.getItem('downloadLocation') || 'gallery';
      
      if (downloadLocation === 'gallery') {
        // Download to temporary directory first
        const tempUri = FileSystem.cacheDirectory + fileName;
        const downloadResumable = FileSystem.createDownloadResumable(
          downloadUrl,
          tempUri,
          {},
          (downloadProgress) => {
            const progress = downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite;
            setDownloadProgress(progress);
          }
        );

        const result = await downloadResumable.downloadAsync();
        if (!result || !result.uri) {
          throw new Error('Download failed - no file URI returned');
        }
        
        // Save to media library
        const asset = await MediaLibrary.createAssetAsync(result.uri);
        
        // Try to save to album
        try {
          const album = await MediaLibrary.getAlbumAsync('Shiori');
          if (album) {
            await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
          } else {
            await MediaLibrary.createAlbumAsync('Shiori', asset, false);
          }
        } catch (albumError) {
          console.error('Album error:', albumError);
        }
        
        // Clean up temp file
        await FileSystem.deleteAsync(tempUri);
        
        // Success notification
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        
        if (Platform.OS === 'android') {
          ToastAndroid.show(`Wallpaper saved to gallery (${quality})`, ToastAndroid.SHORT);
        } else {
          Alert.alert('Success', `Wallpaper saved to your gallery (${quality})`);
        }
      } else {
        // Download to app's private directory
        const privateDir = FileSystem.documentDirectory + 'wallpapers/';
        
        // Ensure directory exists
        const dirInfo = await FileSystem.getInfoAsync(privateDir);
        if (!dirInfo.exists) {
          await FileSystem.makeDirectoryAsync(privateDir, { intermediates: true });
        }
        
        const fileUri = privateDir + fileName;
        const downloadResumable = FileSystem.createDownloadResumable(
          downloadUrl,
          fileUri,
          {},
          (downloadProgress) => {
            const progress = downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite;
            setDownloadProgress(progress);
          }
        );

        const result = await downloadResumable.downloadAsync();
        if (!result || !result.uri) {
          throw new Error('Download failed - no file URI returned');
        }
        
        // Success notification
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        
        if (Platform.OS === 'android') {
          ToastAndroid.show(`Wallpaper saved to app storage (${quality})`, ToastAndroid.SHORT);
        } else {
          Alert.alert('Success', `Wallpaper saved to app storage (${quality})`);
        }
      }
      
    } catch (error: any) {
      console.error('Download error:', error);
      setDownloadError(`Failed to download the image: ${error.message}`);
      setShowFallbackDialog(true);
    } finally {
      setDownloading(false);
    }
  };

  const openInWebView = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowFallbackDialog(false);
    setWebViewVisible(true);
  };

  const closeWebView = () => {
    setWebViewVisible(false);
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
  
  // Render WebView as fallback
  const renderWebView = () => (
    <Portal>
      <Dialog visible={webViewVisible} onDismiss={closeWebView} style={{ maxHeight: height * 0.9, width: '95%' }}>
        <Dialog.Title>Save Image Manually</Dialog.Title>
        <Dialog.Content>
          <Text style={{ marginBottom: 16, lineHeight: 20 }}>
            The direct download failed. Please use these steps to save the image manually:
            {'\n\n'}
            <Text style={{ fontWeight: 'bold' }}>• Long press</Text> on the image when it loads
            {'\n'}
            <Text style={{ fontWeight: 'bold' }}>• Select "Save Image"</Text> from the menu
            {'\n\n'}
            If the image doesn't load properly below, you can also try opening it in your browser.
          </Text>
          <View style={{ height: height * 0.6, borderWidth: 1, borderColor: 'rgba(0,0,0,0.1)', borderRadius: 8, overflow: 'hidden' }}>
            <WebView
              source={{ uri: getDownloadUrl(selectedResolution) }}
              style={{ width: '100%', height: '100%' }}
              javaScriptEnabled={true}
              domStorageEnabled={true}
              startInLoadingState={true}
              cacheEnabled={true}
              renderLoading={() => (
                <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center' }}>
                  <ActivityIndicator size="large" color={paperTheme.colors.primary} />
                  <Text style={{ marginTop: 16, textAlign: 'center' }}>Loading image...</Text>
                </View>
              )}
              onError={(syntheticEvent) => {
                const { nativeEvent } = syntheticEvent;
                console.error('WebView error:', nativeEvent);
              }}
            />
          </View>
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={() => Linking.openURL(getDownloadUrl(selectedResolution))}>Open in Browser</Button>
          <Button onPress={closeWebView}>Close</Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );

  // Improve the fallback dialog with clearer options
  const renderFallbackDialog = () => (
    <Dialog visible={showFallbackDialog} onDismiss={() => setShowFallbackDialog(false)}>
      <Dialog.Title>Download Failed</Dialog.Title>
      <Dialog.Content>
        <Text style={{ marginBottom: 16, lineHeight: 20 }}>
          The download could not be completed.
          {downloadError ? `\n\nError: ${downloadError}` : ''}
          {'\n\nWould you like to try an alternative method?'}
        </Text>
      </Dialog.Content>
      <Dialog.Actions>
        <Button onPress={() => setShowFallbackDialog(false)}>Cancel</Button>
        <Button onPress={openInWebView}>Try Manual Download</Button>
      </Dialog.Actions>
    </Dialog>
  );

  // Render download progress dialog
  const renderDownloadProgress = () => (
    <Portal>
      <Dialog visible={downloading} dismissable={false}>
        <Dialog.Title>Downloading Wallpaper</Dialog.Title>
        <Dialog.Content>
          <ProgressBar progress={downloadProgress} color={paperTheme.colors.primary} style={{ marginVertical: 20 }} />
          <Text>{Math.round(downloadProgress * 100)}%</Text>
        </Dialog.Content>
      </Dialog>
    </Portal>
  );

  return (
    
    
    <ThemedView style={styles.container}>
      <StatusBar style={isDark ? "light" : "dark"} />
      
      {/* Back Button */}
      <View style={{ position: 'absolute', top: 40, left: 12, zIndex: 10 }}>
        <IconButton
          icon={() => (
            <ArrowLeft2
              size={24} 
              color="white" 
              variant="Broken"
              style={styles.backIcon} 
            />
          )}
          size={40}
          onPress={() => router.back()}
          style={styles.backButton}
        />
      </View>
      
      {/* Header Action Buttons */}
      <View style={{ position: 'absolute', top: 40, right: 12, zIndex: 10, flexDirection: 'row' }}>
        <IconButton
          icon={() => (
            <Heart 
              size={24} 
              color="white" 
              variant={isFavorite ? "Bold" : "Broken"}
              style={styles.headerIcon} 
            />
          )}
          size={40}
          onPress={toggleFavorite}
          style={styles.iconButton}
        />
        <IconButton
          icon={() => (
            <ShareIcon 
              size={24} 
              color="white" 
              variant="Broken"
            />
          )}
          size={40}
          onPress={shareWallpaper}
          style={styles.iconButton}
        />
      </View>
      
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
            
            <Surface style={styles.infoCard}>
              <View style={styles.metaRow}>
                <View style={styles.metaItem}>
                    <Image1
                      size={22}
                      color="#FFFFFF"
                      variant="Broken"
                      style={styles.metaIcon}
                    />
                  <View>
                    <Text style={styles.metaLabel}>RESOLUTION</Text>
                    <Text style={styles.resolutionText}>{wallpaper.resolution}</Text>
                  </View>
                </View>
                
                <View style={styles.metaItem}>
                    <Category
                      size={22}
                      color="#FFFFFF"
                      variant="Broken"
                      style={styles.metaIcon}
                    />
                  <View>
                    <Text style={styles.metaLabel}>CATEGORY</Text>
                    <Text style={styles.categoryText}>
                      {wallpaper.category.charAt(0).toUpperCase() + wallpaper.category.slice(1)}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.metaItem}>
                  <Star1
                      size={22}
                      color="#FFFFFF"
                      variant="Broken"
                      style={styles.metaIcon}
                    />
                  <View>
                    <Text style={styles.metaLabel}>PURITY</Text>
                    <Text style={styles.purityText}>
                      {wallpaper.purity.toUpperCase()}
                    </Text>
                  </View>
                </View>
              </View>
              
              <Divider style={styles.divider} />
              
              <View style={styles.metaRow}>
                <View style={styles.metaItem}>
                <Heart
                      size={22}
                      color="#FFFFFF"
                      variant="Broken"
                      style={styles.metaIcon}
                    />
                  <View>
                    <Text style={styles.metaLabel}>FAVORITES</Text>
                    <Text style={styles.favoritesText}>{wallpaper.favorites}</Text>
                  </View>
                </View>
                
                <View style={styles.metaItem}>
                  <Eye
                      size={22}
                      color="#FFFFFF"
                      variant="Broken"
                      style={styles.metaIcon}
                    />
                  <View>
                    <Text style={styles.metaLabel}>VIEWS</Text>
                    <Text style={styles.viewsText}>{wallpaper.views}</Text>
                  </View>
                </View>
                
                {wallpaper.uploader && (
                  <View style={styles.metaItem}>
                    <DocumentUpload
                      size={22}
                      color="#FFFFFF"
                      variant="Broken"
                      style={styles.metaIcon}
                    />
                    <View>
                      <Text style={styles.metaLabel}>UPLOADER</Text>
                      <Text style={styles.uploaderText}>{wallpaper.uploader.username}</Text>
                    </View>
                  </View>
                )}
              </View>
              
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
                icon={() =>  
                <ArrowCircleDown2
                  size={24} 
                  color="black" 
                  variant="Broken"
                />}
                style={[styles.button, { backgroundColor: paperTheme.colors.primary }]}
              >
                Download
              </Button>
              
              <Button 
                mode="outlined" 
                onPress={applyWallpaper}
                icon={() => 
                <Image1
                  size={24} 
                  color="white" 
                  variant="Broken"
                />}
                style={styles.button}
              >
                Set as Wallpaper
              </Button>
            </View>

            <View style={styles.footer} />
          </ThemedScrollView>
          
          <FAB
            icon={() => 
              <ArrowCircleDown2
              size={24} 
              color="white" 
              variant="Broken"
            />
            }
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
                    icon={() =>  
                    <ArrowCircleDown2
                      size={24} 
                      color="white" 
                      variant="Broken"
                    />}
                  >
                    Original ({wallpaper.resolution})
                  </Button>
                  <Button 
                    mode="outlined" 
                    onPress={() => downloadWallpaper('large')}
                    style={styles.downloadButton}
                    icon={() => 
                      <ArrowCircleDown2
                      size={24} 
                      color="white" 
                      variant="Broken"
                    />
                    }
                  >
                    Large Thumbnail
                  </Button>
                  <Button 
                    mode="outlined" 
                    onPress={() => downloadWallpaper('small')}
                    style={styles.downloadButton}
                    icon={() => 
                      <ArrowCircleDown2
                      size={24} 
                      color="white" 
                      variant="Broken"
                      style={styles.downloadButton}
                    />
                    }
                  >
                    Small Thumbnail
                  </Button>
                </View>
              </Dialog.Content>
              <Dialog.Actions>
                <Button onPress={() => setDownloadDialogVisible(false)}>Cancel</Button>
              </Dialog.Actions>
            </Dialog>
            
            {renderDownloadProgress()}
            {renderFallbackDialog()}
            {renderWebView()}
          </Portal>
        </>
      ) : (
        <View style={styles.errorContainer}>
          <IconSymbol name="exclamationmark.triangle" size={48} color={paperTheme.colors.error} />
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
  scrollView: {
    flex: 1,
  },
  animatedHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 60,
    zIndex: 5,
  },
  backButton: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
  },
  headerButtons: {
    flexDirection: 'row',
  },
  headerIcon: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
  },
  iconButton: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    opacity: 0.7,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    marginVertical: 12,
    textAlign: 'center',
  },
  image: {
    width: width,
    height: width * 1.5,
  },
  imageGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  infoCard: {
    margin: 12,
    padding: 16,
    borderRadius: 12,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaIcon: {
    marginRight: 8,
  },
  metaLabel: {
    fontSize: 10,
    opacity: 0.7,
    fontWeight: 'bold',
  },
  resolutionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '600',
  },
  purityText: {
    fontSize: 14,
    fontWeight: '600',
  },
  favoritesText: {
    fontSize: 14,
    fontWeight: '600',
  },
  viewsText: {
    fontSize: 14,
    fontWeight: '600',
  },
  uploaderText: {
    fontSize: 14,
    fontWeight: '600',
  },
  divider: {
    marginVertical: 16,
  },
  detailGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginVertical: 8,
  },
  detailItem: {
    width: '25%',
    padding: 8,
  },
  detailLabel: {
    opacity: 0.7,
  },
  detailValue: {
    fontWeight: '600',
  },
  sectionTitle: {
    marginTop: 16,
    marginBottom: 8,
  },
  colorsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginVertical: 8,
  },
  colorBox: {
    width: 50,
    height: 50,
    margin: 4,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorText: {
    color: 'white',
    fontSize: 10,
    backgroundColor: 'rgba(0,0,0,0.3)',
    padding: 2,
    borderRadius: 4,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginVertical: 8,
  },
  tagChip: {
    margin: 4,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
  },
  button: {
    flex: 1,
    margin: 4,
  },
  footer: {
    height: 10,
  },
  fab: {
    position: 'absolute',
    bottom: 16,
    right: 16,
  },
  dialog: {
    maxWidth: 400,
    alignSelf: 'center',
    width: '90%',
  },
  downloadOptions: {
    marginTop: 16,
  },
  downloadButton: {
    marginVertical: 8,
  }
}); 