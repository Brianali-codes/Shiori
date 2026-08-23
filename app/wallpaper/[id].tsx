import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState, useRef } from 'react';
import {
  Image,
  StyleSheet,
  View,
  Dimensions,
  ActivityIndicator,
  Share as RNShare,
  Platform,
  Alert,
  ToastAndroid,
  TouchableOpacity,
} from 'react-native';
import { ThemedView, ThemedScrollView } from '@/components/ThemedComponents';
import { wallhavenAPI, WallpaperPreview } from '../services/wallhaven';
import {
  Chip,
  Surface,
  Text,
  useTheme,
  Button,
  Portal,
  Dialog,
  ProgressBar,
} from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
import { BlurView } from 'expo-blur';
import { useThemeContext } from '../../contexts/ThemeContext';
import * as FileSystem from 'expo-file-system/legacy';
import * as IntentLauncher from 'expo-intent-launcher';
import * as MediaLibrary from 'expo-media-library';
import WebView from 'react-native-webview';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Heart,
  Share as ShareIcon,
  Category,
  Star1,
  Eye,
  DocumentUpload,
  ArrowLeft2,
  ArrowCircleDown2,
  Image as ImageIcon,
  Tag as TagIcon,
  Maximize4,
} from 'iconsax-react-nativejs';
import NetInfo from '@react-native-community/netinfo';

const { width, height } = Dimensions.get('window');
const FAVORITES_STORAGE_KEY = '@shiori_favorites';

export default function WallpaperScreen() {
  const params = useLocalSearchParams();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;

  const paperTheme = useTheme();
  const { theme } = useThemeContext();
  const router = useRouter();

  const [wallpaper, setWallpaper] = useState<WallpaperPreview | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [downloadDialogVisible, setDownloadDialogVisible] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [webViewVisible, setWebViewVisible] = useState(false);
  const [showFallbackDialog, setShowFallbackDialog] = useState(false);
  const [selectedResolution, setSelectedResolution] = useState('original');
  const [downloading, setDownloading] = useState(false);
  const [applyingLoading, setApplyingLoading] = useState(false);

  const [downloadProgress, setDownloadProgress] = useState(0);
  const [isDownloadingModalVisible, setIsDownloadingModalVisible] = useState(false);

  const downloadResumableRef = useRef<FileSystem.DownloadResumable | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchWallpaperDetails = async () => {
      if (!id) {
        if (isMounted) setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const data = await wallhavenAPI.getWallpaper(id);
        if (isMounted) {
          if (data) {
            setWallpaper(data);
            await checkIfFavorite(id);
          } else {
            console.warn(`No data returned for wallpaper ID: ${id}`);
          }
        }
      } catch (error) {
        console.error(`Failed to fetch wallpaper details for ID ${id}:`, error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchWallpaperDetails();

    return () => {
      isMounted = false;
      if (downloadResumableRef.current) {
        downloadResumableRef.current.cancelAsync().catch(() => {});
        downloadResumableRef.current = null;
      }
    };
  }, [id]);

  const checkIfFavorite = async (wallpaperId: string) => {
    try {
      const storedFavorites = await AsyncStorage.getItem(FAVORITES_STORAGE_KEY);
      if (storedFavorites) {
        const favoritesList: WallpaperPreview[] = JSON.parse(storedFavorites);
        const exists = favoritesList.some((item) => String(item.id) === String(wallpaperId));
        setIsFavorite(exists);
      }
    } catch (error) {
      console.error('Error checking favorites:', error);
    }
  };

  const toggleFavorite = async () => {
    if (!wallpaper) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const storedFavorites = await AsyncStorage.getItem(FAVORITES_STORAGE_KEY);
      let favoritesList: WallpaperPreview[] = storedFavorites
        ? JSON.parse(storedFavorites)
        : [];

      if (isFavorite) {
        favoritesList = favoritesList.filter((item) => String(item.id) !== String(wallpaper.id));
        setIsFavorite(false);
        if (Platform.OS === 'android') {
          ToastAndroid.show('Removed from Favorites', ToastAndroid.SHORT);
        }
      } else {
        favoritesList.push(wallpaper);
        setIsFavorite(true);
        if (Platform.OS === 'android') {
          ToastAndroid.show('Saved to Favorites', ToastAndroid.SHORT);
        }
      }

      await AsyncStorage.setItem(
        FAVORITES_STORAGE_KEY,
        JSON.stringify(favoritesList)
      );
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const shareWallpaperLink = async () => {
    if (wallpaper) {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        await RNShare.share({
          message: `Check out this wallpaper on Shiori: ${
            wallpaper.short_url || wallpaper.url
          }`,
          url: wallpaper.url,
        });
      } catch (error) {
        console.error('Error sharing link:', error);
      }
    }
  };

  const handleTagPress = (tagName: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({
      pathname: '/(tabs)/explore',
      params: { q: tagName },
    });
  };

  const getDownloadUrl = (quality: string): string => {
    if (!wallpaper) return '';
    switch (quality) {
      case 'original':
        return wallpaper.path || wallpaper.thumbs?.large || '';
      case 'large':
        return wallpaper.thumbs?.large || wallpaper.path || '';
      case 'small':
        return wallpaper.thumbs?.small || wallpaper.path || '';
      default:
        return wallpaper.path || '';
    }
  };

  const saveFileLocally = async (
    quality = 'original',
    onProgress?: (progress: number) => void
  ): Promise<string | null> => {
    if (!wallpaper) return null;
    const downloadUrl = getDownloadUrl(quality);

    if (!downloadUrl) {
      throw new Error('Image URL is missing or invalid');
    }

    let ext = 'jpg';
    if (wallpaper.file_type && wallpaper.file_type.includes('/')) {
      ext = wallpaper.file_type.split('/')[1];
    } else if (downloadUrl) {
      const match = downloadUrl.match(/\.(jpg|jpeg|png|webp)(\?.*)?$/i);
      if (match) ext = match[1].toLowerCase();
    }

    const cacheDir = FileSystem.cacheDirectory;
    if (!cacheDir) {
      throw new Error('Cache directory is unavailable');
    }

    const fileName = `shiori_${wallpaper.id}_${quality}.${ext}`;
    const cleanCacheDir = cacheDir.endsWith('/') ? cacheDir : `${cacheDir}/`;
    const tempUri = `${cleanCacheDir}${fileName}`;

    const existingFile = await FileSystem.getInfoAsync(tempUri);
    if (existingFile.exists && existingFile.size && existingFile.size > 0) {
      if (onProgress) onProgress(1);
      return tempUri;
    }

    downloadResumableRef.current = FileSystem.createDownloadResumable(
      downloadUrl,
      tempUri,
      {},
      (downloadProgressData) => {
        const progress =
          downloadProgressData.totalBytesWritten /
          downloadProgressData.totalBytesExpectedToWrite;
        if (onProgress) {
          onProgress(isNaN(progress) || progress < 0 ? 0 : progress);
        }
      }
    );

    const result = await downloadResumableRef.current.downloadAsync();
    downloadResumableRef.current = null;

    if (!result?.uri) return null;

    const fileInfo = await FileSystem.getInfoAsync(result.uri);
    if (!fileInfo.exists) {
      throw new Error('Downloaded file could not be verified in cache');
    }

    return result.uri;
  };

  const saveToGallery = async (fileUri: string) => {
    try {
      const permission = await MediaLibrary.requestPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(
          'Permission Required',
          'Shiori needs media library permissions to save wallpapers.'
        );
        throw new Error('Media library permission denied');
      }

      const asset = await MediaLibrary.createAssetAsync(fileUri);
      let album = await MediaLibrary.getAlbumAsync('Shiori');

      if (!album) {
        await MediaLibrary.createAlbumAsync('Shiori', asset, false);
      } else {
        await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
      }

      return asset;
    } catch (error) {
      console.error('Save wallpaper error:', error);
      throw error;
    }
  };

  const cancelDownload = async () => {
    if (downloadResumableRef.current) {
      try {
        await downloadResumableRef.current.cancelAsync();
      } catch (e) {
        // Ignored cancellation error
      }
      downloadResumableRef.current = null;
    }
    setDownloading(false);
    setIsDownloadingModalVisible(false);
    setDownloadProgress(0);
    if (Platform.OS === 'android') {
      ToastAndroid.show('Download canceled', ToastAndroid.SHORT);
    }
  };

  const downloadWallpaper = async (quality = 'original') => {
    if (!wallpaper || downloading) return;

    setSelectedResolution(quality);
    setDownloadDialogVisible(false);

    const downloadOnWifi =
      (await AsyncStorage.getItem('downloadOnWifi')) === 'true';

    if (downloadOnWifi) {
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

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    setDownloading(true);
    setDownloadProgress(0);
    setIsDownloadingModalVisible(true);

    try {
      const localUri = await saveFileLocally(quality, (progress) => {
        setDownloadProgress(progress);
      });

      if (!localUri) throw new Error('Download failed - invalid URI');

      const savedAssetInfo = await saveToGallery(localUri);

      if (savedAssetInfo) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        if (Platform.OS === 'android') {
          ToastAndroid.show('Wallpaper saved to gallery', ToastAndroid.SHORT);
        } else {
          Alert.alert('Success', 'Wallpaper saved to your gallery in "Shiori" album.');
        }
      }
    } catch (error: any) {
      if (
        error?.message?.includes('canceled') ||
        error?.message?.includes('cancelled')
      ) {
        return;
      }
      console.error('Download error:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

      setDownloadError(`Failed to download: ${error.message || 'Unknown error'}`);
      setShowFallbackDialog(true);
    } finally {
      setDownloading(false);
      setIsDownloadingModalVisible(false);
    }
  };

  const applyWallpaper = async () => {
    if (!wallpaper || applyingLoading) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    setApplyingLoading(true);

    if (Platform.OS === 'android') {
      ToastAndroid.show('Preparing wallpaper...', ToastAndroid.SHORT);
    }

    try {
      // 1. Download/Cache file locally using existing helper function
      const localUri = await saveFileLocally('original');
      if (!localUri) throw new Error('Failed to prepare wallpaper image');

      if (Platform.OS === 'android') {
        // 2. Convert file:// URI to content:// URI so Android OS can read it
        const contentUri = await FileSystem.getContentUriAsync(localUri);

        // 3. Launch Android system wallpaper launcher chooser
        await IntentLauncher.startActivityAsync('android.intent.action.ATTACH_DATA', {
          data: contentUri,
          type: 'image/*',
          flags: 1, // FLAG_GRANT_READ_URI_PERMISSION
        });
      } else {
        Alert.alert(
          'Set Wallpaper',
          'On iOS, please download the image and set it as wallpaper via your Photos app.'
        );
      }
    } catch (error: any) {
      console.error('Apply wallpaper error:', error);
      if (Platform.OS === 'android') {
        ToastAndroid.show('Failed to launch wallpaper application', ToastAndroid.SHORT);
      } else {
        Alert.alert('Error', 'Failed to prepare wallpaper image.');
      }
    } finally {
      setApplyingLoading(false);
    }
  };

  const previewImageSource = wallpaper
    ? wallpaper.path || wallpaper.thumbs?.large || wallpaper.thumbs?.original
    : null;

  return (
    <ThemedView style={styles.container}>
      <StatusBar style="light" translucent />

      {/* Floating Header */}
      <View style={styles.topHeader}>
        <TouchableOpacity
          style={styles.circleIconButton}
          onPress={() => router.back()}
          activeOpacity={0.8}
        >
          <ArrowLeft2 size={22} color="#FFFFFF" variant="Broken" />
        </TouchableOpacity>

        <View style={styles.topRightGroup}>
          <TouchableOpacity
            style={styles.circleIconButton}
            onPress={toggleFavorite}
            activeOpacity={0.8}
          >
            <Heart
              size={22}
              color={isFavorite ? '#FF5252' : '#FFFFFF'}
              variant={isFavorite ? 'Bold' : 'Broken'}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.circleIconButton}
            onPress={shareWallpaperLink}
            activeOpacity={0.8}
          >
            <ShareIcon size={22} color="#FFFFFF" variant="Broken" />
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={paperTheme.colors.primary} />
          <Text style={styles.loadingText}>Loading wallpaper details...</Text>
        </View>
      ) : wallpaper && previewImageSource ? (
        <>
          <ThemedScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Top Image Showcase */}
            <View style={styles.heroImageContainer}>
              <Image
                source={{ uri: previewImageSource }}
                style={styles.heroImage}
                resizeMode="cover"
              />
              <LinearGradient
                colors={['rgba(0,0,0,0.5)', 'transparent', paperTheme.colors.background]}
                locations={[0, 0.6, 1]}
                style={styles.heroGradient}
              />
            </View>

            {/* Content Details Panel */}
            <View style={styles.contentContainer}>
              <Surface
                style={[
                  styles.card,
                  { backgroundColor: paperTheme.colors.surfaceVariant + '70' },
                ]}
                elevation={0}
              >
                <View style={styles.statsRow}>
                  <View style={styles.statBox}>
                    <Maximize4 size={20} color={paperTheme.colors.primary} />
                    <Text variant="titleMedium" style={styles.statValue}>
                      {wallpaper.resolution || 'N/A'}
                    </Text>
                    <Text variant="bodySmall" style={styles.statLabel}>
                      Resolution
                    </Text>
                  </View>

                  <View style={styles.verticalDivider} />

                  <View style={styles.statBox}>
                    <Category size={20} color={paperTheme.colors.primary} />
                    <Text variant="titleMedium" style={styles.statValue}>
                      {wallpaper.category || 'General'}
                    </Text>
                    <Text variant="bodySmall" style={styles.statLabel}>
                      Category
                    </Text>
                  </View>

                  <View style={styles.verticalDivider} />

                  <View style={styles.statBox}>
                    <Star1 size={20} color={paperTheme.colors.primary} />
                    <Text variant="titleMedium" style={styles.statValue}>
                      {wallpaper.purity ? wallpaper.purity.toUpperCase() : 'SFW'}
                    </Text>
                    <Text variant="bodySmall" style={styles.statLabel}>
                      Purity
                    </Text>
                  </View>
                </View>

                <View style={styles.horizontalDivider} />

                <View style={styles.statsRow}>
                  <View style={styles.statBox}>
                    <Eye size={18} color={paperTheme.colors.onSurfaceVariant} />
                    <Text variant="bodyMedium" style={styles.subStatValue}>
                      {wallpaper.views ? wallpaper.views.toLocaleString() : 0}
                    </Text>
                    <Text variant="bodySmall" style={styles.statLabel}>
                      Views
                    </Text>
                  </View>

                  <View style={styles.statBox}>
                    <Heart size={18} color={paperTheme.colors.onSurfaceVariant} />
                    <Text variant="bodyMedium" style={styles.subStatValue}>
                      {wallpaper.favorites ? wallpaper.favorites.toLocaleString() : 0}
                    </Text>
                    <Text variant="bodySmall" style={styles.statLabel}>
                      Favorites
                    </Text>
                  </View>

                  <View style={styles.statBox}>
                    <ImageIcon size={18} color={paperTheme.colors.onSurfaceVariant} />
                    <Text variant="bodyMedium" style={styles.subStatValue}>
                      {wallpaper.file_size
                        ? `${(wallpaper.file_size / (1024 * 1024)).toFixed(1)} MB`
                        : 'N/A'}
                    </Text>
                    <Text variant="bodySmall" style={styles.statLabel}>
                      Size
                    </Text>
                  </View>

                  {wallpaper.uploader && (
                    <View style={styles.statBox}>
                      <DocumentUpload size={18} color={paperTheme.colors.onSurfaceVariant} />
                      <Text
                        variant="bodyMedium"
                        style={styles.subStatValue}
                        numberOfLines={1}
                      >
                        {wallpaper.uploader.username}
                      </Text>
                      <Text variant="bodySmall" style={styles.statLabel}>
                        Uploader
                      </Text>
                    </View>
                  )}
                </View>
              </Surface>

              {wallpaper.colors && wallpaper.colors.length > 0 && (
                <View style={styles.section}>
                  <Text variant="titleSmall" style={styles.sectionHeader}>
                    Color Palette
                  </Text>
                  <View style={styles.paletteRow}>
                    {wallpaper.colors.map((hex, index) => (
                      <View
                        key={index}
                        style={[styles.colorSwatch, { backgroundColor: hex }]}
                      >
                        <Text style={styles.colorHexText}>{hex}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {wallpaper.tags && wallpaper.tags.length > 0 && (
                <View style={styles.section}>
                  <View style={styles.sectionHeaderRow}>
                    <TagIcon size={16} color={paperTheme.colors.primary} />
                    <Text variant="titleSmall" style={styles.sectionHeaderWithIcon}>
                      Tags
                    </Text>
                  </View>
                  <View style={styles.tagsFlexWrapper}>
                    {wallpaper.tags.map((tag) => (
                      <Chip
                        key={tag.id}
                        mode="outlined"
                        onPress={() => handleTagPress(tag.name)}
                        style={styles.interactiveTag}
                        textStyle={{ fontSize: 13 }}
                      >
                        #{tag.name}
                      </Chip>
                    ))}
                  </View>
                </View>
              )}
            </View>
          </ThemedScrollView>

          {/* Separate Floating Glassmorphic Buttons */}
          <View style={styles.floatingActionRow}>
            <View style={styles.floatingButtonWrapper}>
              <BlurView
                intensity={Platform.OS === 'ios' ? 60 : 90}
                tint={theme === 'dark' ? 'dark' : 'light'}
                style={styles.separateGlassButton}
              >
                <TouchableOpacity
                  style={styles.innerTouchable}
                  onPress={() => setDownloadDialogVisible(true)}
                  disabled={downloading}
                  activeOpacity={0.7}
                >
                  {downloading ? (
                    <ActivityIndicator size="small" color={paperTheme.colors.primary} />
                  ) : (
                    <ArrowCircleDown2 size={20} color={paperTheme.colors.primary} variant="Broken" />
                  )}
                  <Text style={[styles.buttonLabel, { color: paperTheme.colors.onSurface }]}>
                    Download
                  </Text>
                </TouchableOpacity>
              </BlurView>
            </View>

            <View style={styles.floatingButtonWrapper}>
              <BlurView
                intensity={Platform.OS === 'ios' ? 60 : 90}
                tint={theme === 'dark' ? 'dark' : 'light'}
                style={styles.separateGlassButton}
              >
                <TouchableOpacity
                  style={styles.innerTouchable}
                  onPress={applyWallpaper}
                  disabled={applyingLoading}
                  activeOpacity={0.7}
                >
                  {applyingLoading ? (
                    <ActivityIndicator size="small" color={paperTheme.colors.primary} />
                  ) : (
                    <ImageIcon size={20} color={paperTheme.colors.primary} variant="Broken" />
                  )}
                  <Text style={[styles.buttonLabel, { color: paperTheme.colors.onSurface }]}>
                    Apply Wallpaper
                  </Text>
                </TouchableOpacity>
              </BlurView>
            </View>
          </View>

          <Portal>
            <Dialog
              visible={downloadDialogVisible}
              onDismiss={() => setDownloadDialogVisible(false)}
              style={styles.dialogContainer}
            >
              <Dialog.Title>Select Resolution</Dialog.Title>
              <Dialog.Content>
                <Button
                  mode="outlined"
                  onPress={() => downloadWallpaper('original')}
                  style={styles.downloadOptionBtn}
                >
                  Original ({wallpaper.resolution || 'High Quality'})
                </Button>
                {wallpaper.thumbs?.large && (
                  <Button
                    mode="outlined"
                    onPress={() => downloadWallpaper('large')}
                    style={styles.downloadOptionBtn}
                  >
                    Large Preview
                  </Button>
                )}
                {wallpaper.thumbs?.small && (
                  <Button
                    mode="outlined"
                    onPress={() => downloadWallpaper('small')}
                    style={styles.downloadOptionBtn}
                  >
                    Small Thumbnail
                  </Button>
                )}
              </Dialog.Content>
              <Dialog.Actions>
                <Button onPress={() => setDownloadDialogVisible(false)}>
                  Cancel
                </Button>
              </Dialog.Actions>
            </Dialog>

            {/* Dismissable Download Progress Modal */}
            <Dialog
              visible={isDownloadingModalVisible}
              onDismiss={cancelDownload}
              dismissable={true}
              style={styles.dialogContainer}
            >
              <Dialog.Title>Downloading Wallpaper</Dialog.Title>
              <Dialog.Content>
                <Text variant="bodyMedium" style={{ marginBottom: 12 }}>
                  {Math.round(downloadProgress * 100)}% completed
                </Text>
                <ProgressBar
                  progress={downloadProgress}
                  color={paperTheme.colors.primary}
                  style={{ height: 8, borderRadius: 4 }}
                />
              </Dialog.Content>
              <Dialog.Actions>
                <Button onPress={cancelDownload}>Cancel</Button>
              </Dialog.Actions>
            </Dialog>

            <Dialog
              visible={showFallbackDialog}
              onDismiss={() => setShowFallbackDialog(false)}
            >
              <Dialog.Title>Download Issue</Dialog.Title>
              <Dialog.Content>
                <Text>{downloadError || 'Could not download the file.'}</Text>
              </Dialog.Content>
              <Dialog.Actions>
                <Button onPress={() => setShowFallbackDialog(false)}>Cancel</Button>
                <Button
                  onPress={() => {
                    setShowFallbackDialog(false);
                    setWebViewVisible(true);
                  }}
                >
                  Manual Option
                </Button>
              </Dialog.Actions>
            </Dialog>

            <Dialog
              visible={webViewVisible}
              onDismiss={() => setWebViewVisible(false)}
              style={styles.fullWebViewDialog}
            >
              <Dialog.Title>Long press image to save</Dialog.Title>
              <Dialog.Content style={{ height: height * 0.55 }}>
                <WebView source={{ uri: getDownloadUrl(selectedResolution) }} />
              </Dialog.Content>
              <Dialog.Actions>
                <Button onPress={() => setWebViewVisible(false)}>Close</Button>
              </Dialog.Actions>
            </Dialog>
          </Portal>
        </>
      ) : (
        <View style={styles.centerContainer}>
          <Text variant="titleMedium">Wallpaper not found</Text>
          <Button
            mode="contained"
            onPress={() => router.back()}
            style={{ marginTop: 16 }}
          >
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
  scrollContent: {
    paddingBottom: 120,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    opacity: 0.7,
  },
  topHeader: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 52 : 40,
    left: 16,
    right: 16,
    zIndex: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  topRightGroup: {
    flexDirection: 'row',
    gap: 10,
  },
  circleIconButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroImageContainer: {
    width: width,
    height: height * 0.55,
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  contentContainer: {
    paddingHorizontal: 16,
    marginTop: -24,
  },
  card: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statBox: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontWeight: '700',
    marginTop: 4,
    textTransform: 'capitalize',
  },
  subStatValue: {
    fontWeight: '600',
    marginTop: 2,
  },
  statLabel: {
    opacity: 0.6,
    fontSize: 10,
    marginTop: 1,
  },
  verticalDivider: {
    width: 1,
    height: 28,
    backgroundColor: 'rgba(150, 150, 150, 0.25)',
  },
  horizontalDivider: {
    height: 1,
    backgroundColor: 'rgba(150, 150, 150, 0.25)',
    marginVertical: 14,
  },
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    fontWeight: '700',
    marginBottom: 10,
    opacity: 0.8,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  sectionHeaderWithIcon: {
    fontWeight: '700',
    opacity: 0.8,
  },
  paletteRow: {
    flexDirection: 'row',
    gap: 8,
  },
  colorSwatch: {
    flex: 1,
    height: 38,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorHexText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
    backgroundColor: 'rgba(0,0,0,0.35)',
    paddingHorizontal: 3,
    paddingVertical: 1,
    borderRadius: 3,
  },
  tagsFlexWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 80,
  },
  interactiveTag: {
    borderRadius: 20,
  },
  floatingActionRow: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 28 : 20,
    left: 16,
    right: 16,
    flexDirection: 'row',
    gap: 12,
    zIndex: 10,
  },
  floatingButtonWrapper: {
    flex: 1,
    borderRadius: 28,
    overflow: 'hidden',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  separateGlassButton: {
    borderRadius: 28,
    backgroundColor: Platform.OS === 'android' ? 'rgba(30, 30, 30, 0.85)' : 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  innerTouchable: {
    flexDirection: 'row',
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
  },
  buttonLabel: {
    fontWeight: '600',
    fontSize: 14,
  },
  dialogContainer: {
    borderRadius: 16,
  },
  downloadOptionBtn: {
    marginVertical: 4,
  },
  fullWebViewDialog: {
    maxHeight: height * 0.8,
  },
});