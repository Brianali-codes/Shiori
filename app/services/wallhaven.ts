import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Types
export interface Uploader {
  username: string;
  group: string;
  avatar: {
    '200px': string;
    '128px': string;
    '32px': string;
    '20px': string;
  };
}

export interface Tag {
  id: number;
  name: string;
  alias: string;
  category_id: number;
  category: string;
  purity: 'sfw';
  created_at: string;
}

export interface WallpaperPreview {
  id: string;
  uniqueId?: string;
  url: string;
  short_url: string;
  views: number;
  favorites: number;
  source: string;
  purity: 'sfw';
  category: string; // "general", "anime", "people"
  dimension_x: number;
  dimension_y: number;
  resolution: string;
  ratio: string;
  file_size: number;
  file_type: string;
  created_at: string;
  colors: string[];
  path: string;
  thumbs: {
    large: string;
    original: string;
    small: string;
  };
  uploader?: Uploader;
  tags?: Tag[];
}

export interface WallhavenSearchResponse {
  data: WallpaperPreview[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    query: string | null | { id: number; tag: string };
    seed: string | null;
  };
}

export interface SearchParams {
  q?: string;
  categories?: string; // 100/110/111 - General/Anime/People
  purity?: '100'; // Hardcoded strictly to SFW
  sorting?: 'date_added' | 'relevance' | 'random' | 'views' | 'favorites' | 'toplist';
  order?: 'desc' | 'asc';
  topRange?: '1d' | '3d' | '1w' | '1M' | '3M' | '6M' | '1y';
  atleast?: string;
  resolutions?: string;
  ratios?: string; // Defaulted to mobile portrait ratios
  colors?: string;
  page?: number;
  seed?: string;
  apikey?: string;
}

export interface UserSettings {
  username: string;
  email: string;
  thumb_size: string;
  per_page: number;
  categories: {
    general: boolean;
    anime: boolean;
    people: boolean;
  };
  resolutions: string[];
  aspect_ratios: string[];
  toplist_range: string;
  tag_blacklist: string[];
  user_blacklist: string[];
}

// Fixed: Wallhaven only accepts whole-number aspect ratios
const DEFAULT_PORTRAIT_RATIOS = '9x16,10x16,9x18';

// Client runtime check helper
const isClient = typeof window !== 'undefined';

const safeGetItem = async (key: string): Promise<string | null> => {
  if (!isClient) return null;
  try {
    return await AsyncStorage.getItem(key);
  } catch (error) {
    console.error(`Failed to read ${key} from storage:`, error);
    return null;
  }
};

const safeSetItem = async (key: string, value: string): Promise<void> => {
  if (!isClient) return;
  try {
    await AsyncStorage.setItem(key, value);
  } catch (error) {
    console.error(`Failed to write ${key} to storage:`, error);
  }
};

class WallhavenAPI {
  private baseURL = 'https://wallhaven.cc/api/v1';
  private apiKey?: string;
  private highQualityMode: boolean = false;

  // In-memory cache to prevent hitting rate-limits on hot reloads
  private cache = new Map<string, { data: WallhavenSearchResponse; timestamp: number }>();
  private CACHE_TTL = 3 * 60 * 1000; // 3 minutes cache lifetime

  constructor(apiKey?: string) {
    this.apiKey = apiKey;
    if (isClient) {
      this.loadSettings();
    }
  }

  private async loadSettings() {
    if (!isClient) return;
    try {
      const highQualitySetting = await safeGetItem('highQualityThumbs');
      this.highQualityMode = highQualitySetting === 'true';
    } catch (error) {
      console.error('Failed to load API settings:', error);
      this.highQualityMode = false;
    }
  }

  setHighQualityMode(enabled: boolean) {
    this.highQualityMode = enabled;
    safeSetItem('highQualityThumbs', enabled ? 'true' : 'false');
    return this;
  }

  isHighQualityMode(): boolean {
    return this.highQualityMode;
  }

  setApiKey(apiKey: string) {
    this.apiKey = apiKey;
    return this;
  }

  hasApiKey(): boolean {
    return !!this.apiKey && this.apiKey.trim() !== '';
  }

  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Constructs direct target URL for production deployment.
   */
  private buildUrl(endpoint: string, params: Record<string, any> = {}): string {
    const combinedParams = this.apiKey ? { ...params, apikey: this.apiKey } : params;
    const queryParams = new URLSearchParams();

    Object.entries(combinedParams).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, String(value));
      }
    });

    const queryString = queryParams.toString();
    return `${this.baseURL}${endpoint}${queryString ? `?${queryString}` : ''}`;
  }

  private processWallpaperData(data: WallpaperPreview | WallpaperPreview[]): WallpaperPreview | WallpaperPreview[] {
    if (this.highQualityMode) {
      if (Array.isArray(data)) {
        return data.map(wallpaper => ({
          ...wallpaper,
          thumbs: {
            ...wallpaper.thumbs,
            small: wallpaper.thumbs.large,
          }
        }));
      } else {
        return {
          ...data,
          thumbs: {
            ...data.thumbs,
            small: data.thumbs.large,
          }
        };
      }
    }
    return data;
  }

  async search(params: SearchParams = {}): Promise<WallhavenSearchResponse> {
    const cacheKey = JSON.stringify(params);
    const cachedEntry = this.cache.get(cacheKey);

    // Return cached response if within TTL
    if (cachedEntry && Date.now() - cachedEntry.timestamp < this.CACHE_TTL) {
      return cachedEntry.data;
    }

    try {
      const queryParams = {
        ...params,
        categories: params.categories || '111',
        purity: '100', // SFW only
        ratios: params.ratios || DEFAULT_PORTRAIT_RATIOS,
      };

      const url = this.buildUrl('/search', queryParams);
      const response = await axios.get(url);

      const processedData = this.processWallpaperData(response.data.data) as WallpaperPreview[];

      // Filter out any non-SFW content as an extra safeguard
      const sfwOnlyData = processedData.filter(wp => wp.purity === 'sfw');

      const result: WallhavenSearchResponse = {
        ...response.data,
        data: sfwOnlyData
      };

      // Save successful request to cache
      this.cache.set(cacheKey, { data: result, timestamp: Date.now() });

      return result;
    } catch (error) {
      console.error('Wallhaven API Error:', error);

      // If we got rate-limited (429) but have an older cached version, return it as fallback
      if (cachedEntry) {
        console.warn('Returning cached fallback response due to API error.');
        return cachedEntry.data;
      }

      return {
        data: [],
        meta: {
          current_page: 1,
          last_page: 1,
          per_page: 25,
          total: 0,
          query: null,
          seed: null
        }
      };
    }
  }

  async getWallpaper(id: string): Promise<WallpaperPreview | null> {
    try {
      const url = this.buildUrl(`/w/${id}`);
      const response = await axios.get(url);

      const wallpaper = this.processWallpaperData(response.data.data) as WallpaperPreview;

      if (wallpaper.purity !== 'sfw') {
        return null;
      }

      return wallpaper;
    } catch (error) {
      console.error('Failed to get wallpaper details:', error);
      return null;
    }
  }

  async getTag(id: number): Promise<Tag | null> {
    try {
      const url = this.buildUrl(`/tag/${id}`);
      const response = await axios.get(url);
      return response.data.data;
    } catch (error) {
      console.error('Failed to get tag details:', error);
      return null;
    }
  }

  async getLatest(page = 1, ratios?: string): Promise<WallhavenSearchResponse> {
    return this.search({
      page,
      ratios,
      sorting: 'date_added',
      order: 'desc',
    });
  }

  async getToplist(page = 1, range: SearchParams['topRange'] = '1M', ratios?: string): Promise<WallhavenSearchResponse> {
    return this.search({
      page,
      ratios,
      sorting: 'toplist',
      topRange: range,
    });
  }

  async getRandomWallpapers(page = 1, seed?: string, ratios?: string): Promise<WallhavenSearchResponse> {
    return this.search({
      page,
      ratios,
      sorting: 'random',
      seed,
    });
  }

  async getUserSettings(): Promise<UserSettings> {
    if (!this.apiKey) {
      throw new Error('API key is required for this operation');
    }

    try {
      const url = this.buildUrl('/settings');
      const response = await axios.get(url);

      if (!response.data) {
        throw new Error('Failed to fetch user settings');
      }
      return response.data;
    } catch (error) {
      console.error('Error fetching user settings:', error);
      throw error;
    }
  }

  async validateApiKey(apiKey: string): Promise<boolean> {
    const originalKey = this.apiKey;
    this.apiKey = apiKey;

    try {
      await this.getUserSettings();
      return true;
    } catch (error) {
      console.error('API key validation failed:', error);
      return false;
    } finally {
      this.apiKey = originalKey;
    }
  }

  async getUserCollections(username?: string): Promise<any | null> {
    try {
      const endpoint = username ? `/collections/${username}` : '/collections';
      const url = this.buildUrl(endpoint);
      const response = await axios.get(url);
      return response.data.data;
    } catch (error) {
      console.error('Failed to get collections:', error);
      return null;
    }
  }

  async getCollectionWallpapers(username: string, collectionId: number): Promise<WallhavenSearchResponse | null> {
    try {
      const endpoint = `/collections/${username}/${collectionId}`;
      const url = this.buildUrl(endpoint);
      const response = await axios.get(url);

      if (response.data.data) {
        const processedData = this.processWallpaperData(response.data.data) as WallpaperPreview[];
        const sfwOnlyData = processedData.filter(wp => wp.purity === 'sfw');

        return {
          ...response.data,
          data: sfwOnlyData
        };
      }

      return response.data;
    } catch (error) {
      console.error('Failed to get collection wallpapers:', error);
      return null;
    }
  }
}

export const wallhavenAPI = new WallhavenAPI();

export function setWallhavenApiKey(apiKey: string) {
  return wallhavenAPI.setApiKey(apiKey);
}

export function setHighQualityMode(enabled: boolean) {
  return wallhavenAPI.setHighQualityMode(enabled);
}