import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState, useRef } from 'react';
import * as Sharing from 'expo-sharing';
import {
  Image,
  StyleSheet,
  View,
  Dimensions,
  ActivityIndicator,
  Share,
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
import { useThemeContext } from '../../contexts/ThemeContext';
import * as FileSystem from 'expo-file-system'; 
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
  const [downloading, setDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [webViewVisible, setWebViewVisible] = useState(false);
  const [showFallbackDialog, setShowFallbackDialog] = useState(false);
  const [selectedResolution, setSelectedResolution] = useState('original');
  const [applying, setApplying] = useState(false);

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

  const shareWallpaper = async () => {
    if (wallpaper) {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        await Share.share({
          message: `Check out this wallpaper on Shiori: ${
            wallpaper.short_url || wallpaper.url
          }`,
          url: wallpaper.url,
        });
      } catch (error) {
        console.error('Error sharing:', error);
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

  const cancelDownloadProcess = async () => {
    if (downloadResumableRef.current) {
      try {
        await downloadResumableRef.current.cancelAsync();
      } catch (e) {
        console.warn('Error cancelling download:', e);
      }
      downloadResumableRef.current = null;
    }
    setDownloading(false);
    setApplying(false);
  };

  const saveFileLocally = async (quality = 'original'): Promise<string | null> => {
    if (!wallpaper) return null;
    const downloadUrl = getDownloadUrl(quality);

    if (!downloadUrl) {
      throw new Error('Image URL is missing or invalid');
    }

    const timestamp = new Date().getTime();

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

    const fileName = `shiori_${wallpaper.id}_${quality}_${timestamp}.${ext}`;
    const cleanCacheDir = cacheDir.endsWith('/') ? cacheDir : `${cacheDir}/`;
    const tempUri = `${cleanCacheDir}${fileName}`;

    downloadResumableRef.current = FileSystem.createDownloadResumable(
      downloadUrl,
      tempUri,
      {},
      (downloadProgress) => {
        const progress =
          downloadProgress.totalBytesWritten /
          downloadProgress.totalBytesExpectedToWrite;
        setDownloadProgress(isNaN(progress) || progress < 0 ? 0 : progress);
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

  const saveAndApplyWallpaper = async (fileUri: string) => {
    try {
      const permission = await MediaLibrary.requestPermissionsAsync(true);

      if (!permission.granted) {
        Alert.alert(
          'Permission Required',
          'Shiori needs media library permissions to save wallpapers.'
        );
        return null;
      }

      let album = await MediaLibrary.getAlbumAsync('Shiori');
      const asset = await MediaLibrary.createAssetAsync(fileUri);

      if (!album) {
        album = await MediaLibrary.createAlbumAsync('Shiori', asset, false);
      } else {
        try {
          await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
        } catch (albumError) {
          console.warn('Could not add to album, saved to main gallery instead:', albumError);
        }
      }

      return await MediaLibrary.getAssetInfoAsync(asset);
    } catch (error) {
      console.error('Save wallpaper error:', error);
      throw error;
    }
  };

  const downloadWallpaper = async (quality = 'original') => {
    if (!wallpaper) return;

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

    setDownloading(true);
    setDownloadProgress(0);
    setDownloadError(null);

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const localUri = await saveFileLocally(quality);

      if (!localUri) throw new Error('Download failed - invalid URI');

      const savedAssetInfo = await saveAndApplyWallpaper(localUri);

      if (savedAssetInfo) {
        await FileSystem.deleteAsync(localUri, { idempotent: true });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        if (Platform.OS === 'android') {
          ToastAndroid.show(`Wallpaper saved to gallery (${quality})`, ToastAndroid.SHORT);
        } else {
          Alert.alert('Success', `Wallpaper saved to your gallery (${quality})`);
        }
      }
    } catch (error: any) {
      console.error('Download error:', error);
      setDownloadError(`Failed to download the image: ${error.message || 'Unknown error'}`);
      if (Platform.OS === 'android') {
        ToastAndroid.show('Failed to download image', ToastAndroid.SHORT);
      }
      setShowFallbackDialog(true);
    } finally {
      setDownloading(false);
    }
  };

  const applyWallpaper = async () => {
    if (!wallpaper) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    setApplying(true);
    setDownloadProgress(0);
    let localUri: string | null = null;

    try {
      localUri = await saveFileLocally('original');
      if (!localUri) throw new Error('Failed to cache image');

      const isSharingAvailable = await Sharing.isAvailableAsync();

      if (isSharingAvailable) {
        await Sharing.shareAsync(localUri, {
          mimeType: 'image/jpeg',
          dialogTitle: 'Set Wallpaper',
          UTI: 'public.image',
        });
      } else {
        const assetInfo = await saveAndApplyWallpaper(localUri);
        if (assetInfo && Platform.OS === 'android') {
          ToastAndroid.show('Saved to gallery. Set via system gallery settings.', ToastAndroid.LONG);
        }
      }
    } catch (error: any) {
      console.error('Apply wallpaper error:', error);
      if (Platform.OS === 'android') {
        ToastAndroid.show('Failed to open wallpaper utility', ToastAndroid.SHORT);
      } else {
        Alert.alert('Error', 'Failed to prepare wallpaper image.');
      }
    } finally {
      if (localUri) {
        await FileSystem.deleteAsync(localUri, { idempotent: true }).catch(() => {});
      }
      setApplying(false);
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
            onPress={shareWallpaper}
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

          <Surface
            style={[
              styles.floatingFabContainer,
              { backgroundColor: paperTheme.colors.elevation.level3 },
            ]}
            elevation={4}
          >
            <Button
              mode="contained"
              onPress={() => setDownloadDialogVisible(true)}
              icon={() => <ArrowCircleDown2 size={20} color="#FFFFFF" variant="Broken" />}
              style={styles.floatingButton}
              contentStyle={styles.actionButtonContent}
            >
              Download
            </Button>
            <Button
              mode="contained-tonal"
              onPress={applyWallpaper}
              icon={() => (
                <ImageIcon size={20} color={paperTheme.colors.primary} variant="Broken" />
              )}
              style={styles.floatingButton}
              contentStyle={styles.actionButtonContent}
            >
              Apply
            </Button>
          </Surface>

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

            <Dialog visible={downloading || applying} dismissable={false}>
              <Dialog.Title>
                {applying ? 'Preparing Wallpaper...' : 'Downloading...'}
              </Dialog.Title>
              <Dialog.Content>
                <ProgressBar
                  progress={downloadProgress}
                  color={paperTheme.colors.primary}
                  style={styles.progressBar}
                />
                <Text style={styles.progressPercentText}>
                  {Math.round(downloadProgress * 100)}%
                </Text>
              </Dialog.Content>
              <Dialog.Actions>
                <Button onPress={cancelDownloadProcess}>Cancel</Button>
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
    flexGrow: 1,
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
  },
  interactiveTag: {
    borderRadius: 20,
  },
  floatingFabContainer: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 32 : 24,
    left: 20,
    right: 20,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    gap: 12,
    borderRadius: 32,
    alignItems: 'center',
  },
  floatingButton: {
    flex: 1,
    borderRadius: 24,
  },
  actionButtonContent: {
    height: 48,
  },
  dialogContainer: {
    borderRadius: 16,
  },
  downloadOptionBtn: {
    marginVertical: 4,
  },
  progressBar: {
    marginVertical: 16,
    borderRadius: 4,
  },
  progressPercentText: {
    textAlign: 'center',
    fontWeight: '600',
  },
  fullWebViewDialog: {
    maxHeight: height * 0.8,
  },
});