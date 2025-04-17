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
  purity: string;
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
  purity: string; // "sfw", "sketchy", "nsfw"
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
  // Only in detailed view
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
  }
}

export interface SearchParams {
  q?: string;                  // Search query
  categories?: string;         // 100/110/111 - General/Anime/People
  purity?: string;             // 100/110/111 - SFW/Sketchy/NSFW
  sorting?: 'date_added' | 'relevance' | 'random' | 'views' | 'favorites' | 'toplist';
  order?: 'desc' | 'asc';
  topRange?: '1d' | '3d' | '1w' | '1M' | '3M' | '6M' | '1y'; // For toplist
  atleast?: string;            // Minimum resolution (e.g. "1920x1080")
  resolutions?: string;        // Exact resolutions (e.g. "1920x1080,2560x1440")
  ratios?: string;             // Aspect ratios (e.g. "16x9,16x10")
  colors?: string;             // Dominant colors
  page?: number;
  seed?: string;               // For random consistency
  apikey?: string;             // API key
}

export interface UserSettings {
  username: string;
  email: string;
  thumb_size: string;
  per_page: number;
  purity: {
    sfw: boolean;
    sketchy: boolean;
    nsfw: boolean;
  };
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

class WallhavenAPI {
  private baseURL = 'https://wallhaven.cc/api/v1';
  private apiKey?: string;
  private highQualityMode: boolean = false;
  private nsfwEnabled: boolean = false;
  
  constructor(apiKey?: string) {
    this.apiKey = apiKey;
    this.loadSettings();
  }

  private async loadSettings() {
    try {
      const highQualitySetting = await AsyncStorage.getItem('highQualityThumbs');
      this.highQualityMode = highQualitySetting === 'true';
      
      // Also load NSFW setting
      const nsfwSetting = await AsyncStorage.getItem('showNsfwContent');
      this.nsfwEnabled = nsfwSetting === 'true';
    } catch (error) {
      console.error('Failed to load API settings:', error);
      this.highQualityMode = false;
      this.nsfwEnabled = false;
    }
  }

  setHighQualityMode(enabled: boolean) {
    this.highQualityMode = enabled;
    // Save the setting
    AsyncStorage.setItem('highQualityThumbs', enabled ? 'true' : 'false');
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

  private getParams(params: Record<string, any> = {}): Record<string, any> {
    if (this.apiKey) {
      return { ...params, apikey: this.apiKey };
    }
    return params;
  }

  // Process the response data to use appropriate thumbnail quality
  private processWallpaperData(data: WallpaperPreview | WallpaperPreview[]): WallpaperPreview | WallpaperPreview[] {
    // If high quality mode is enabled, use larger thumbnails
    if (this.highQualityMode) {
      if (Array.isArray(data)) {
        return data.map(wallpaper => ({
          ...wallpaper,
          thumbs: {
            ...wallpaper.thumbs,
            small: wallpaper.thumbs.large, // Use large thumbs instead of small
          }
        }));
      } else {
        return {
          ...data,
          thumbs: {
            ...data.thumbs,
            small: data.thumbs.large, // Use large thumbs for small
          }
        };
      }
    }
    
    // Otherwise return original data
    return data;
  }

  updateNsfwFilter(enabled: boolean): void {
    this.nsfwEnabled = enabled;
    console.log('NSFW setting updated:', enabled);
    
    // Save the setting to AsyncStorage for persistence
    try {
      AsyncStorage.setItem('showNsfwContent', enabled ? 'true' : 'false');
    } catch (error) {
      console.error('Failed to save NSFW setting:', error);
    }
    
    // Force any in-memory caches to be cleared
    this._clearCaches();
  }
  
  // Add method to clear any cached data when settings change
  private _clearCaches(): void {
    // If this API client has any cached data, clear it here
    // This ensures the next search will use the new settings
    console.log('Clearing API caches to apply new settings');
    
    // In a production app, we would clear any in-memory cache here
    // For now, just log that it happened
  }
  
  // More aggressive filtering - add this to filter results after they come back
  private filterNsfwContent(results: WallpaperPreview[]): WallpaperPreview[] {
    // If NSFW is disabled, filter out any NSFW or sketchy content that might have slipped through
    if (!this.nsfwEnabled) {
      return results.filter(wallpaper => wallpaper.purity === 'sfw');
    }
    return results;
  }

  async search(params: SearchParams = {}): Promise<WallhavenSearchResponse> {
    try {
      // Apply NSFW filter to purity parameter
      let purity = params.purity || '100'; // Default SFW only
      
      // If NSFW is enabled and API key is set, include NSFW and sketchy content
      if (this.nsfwEnabled && this.hasApiKey()) {
        purity = '111'; // SFW + Sketchy + NSFW
      } else if (this.hasApiKey()) {
        purity = '110'; // SFW + Sketchy
      } else {
        purity = '100'; // SFW only
      }
      
      // Construct query parameters
      const queryParams = this.getParams({
        ...params,
        categories: params.categories || '111', // Default to all categories
        purity: purity, // Use our determined purity setting
      });
      
      const response = await axios.get(`${this.baseURL}/search`, {
        params: queryParams,
        headers: {
          'X-Requested-With': 'XMLHttpRequest',
        }
      });
      
      // Process response data for high quality if needed
      let processedData = this.processWallpaperData(response.data.data) as WallpaperPreview[];
      
      // Apply additional NSFW filtering to make sure no NSFW or sketchy content slips through
      processedData = this.filterNsfwContent(processedData);
      
      return {
        ...response.data,
        data: processedData
      };
    } catch (error) {
      console.error('Wallhaven API Error:', error);
      // Return empty response
      return { 
        data: [], 
        meta: { 
          current_page: 1, 
          last_page: 1, 
          per_page: 24, 
          total: 0, 
          query: null, 
          seed: null 
        } 
      };
    }
  }

  async getWallpaper(id: string): Promise<WallpaperPreview | null> {
    try {
      const response = await axios.get(`${this.baseURL}/w/${id}`, {
        params: this.getParams(),
        headers: {
          'X-Requested-With': 'XMLHttpRequest',
        }
      });
      
      // Process for high quality if needed
      let wallpaper = this.processWallpaperData(response.data.data) as WallpaperPreview;
      
      // If NSFW is disabled and this is an NSFW wallpaper, return null
      if (!this.nsfwEnabled && wallpaper.purity === 'nsfw') {
        console.log('Blocked NSFW wallpaper access:', id);
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
      const response = await axios.get(`${this.baseURL}/tag/${id}`, {
        params: this.getParams(),
        headers: {
          'X-Requested-With': 'XMLHttpRequest',
        }
      });
      return response.data.data;
    } catch (error) {
      console.error('Failed to get tag details:', error);
      return null;
    }
  }

  // Helper method to determine proper purity setting
  private getPurityParameter(): string {
    // If NSFW is enabled and API key is set, include NSFW content
    if (this.nsfwEnabled && this.hasApiKey()) {
      return '111'; // SFW + Sketchy + NSFW
    } else if (this.hasApiKey()) {
      return '110'; // SFW + Sketchy
    } else {
      return '100'; // SFW only
    }
  }

  async getLatest(page = 1): Promise<WallhavenSearchResponse> {
    return this.search({
      page,
      sorting: 'date_added',
      order: 'desc',
      purity: this.getPurityParameter()
    });
  }

  async getToplist(page = 1, range: SearchParams['topRange'] = '1M'): Promise<WallhavenSearchResponse> {
    return this.search({
      page,
      sorting: 'toplist',
      topRange: range,
      purity: this.getPurityParameter()
    });
  }

  async getRandomWallpapers(page = 1, seed?: string): Promise<WallhavenSearchResponse> {
    return this.search({
      page,
      sorting: 'random',
      seed,
      purity: this.getPurityParameter()
    });
  }

  async getUserSettings(): Promise<UserSettings> {
    if (!this.apiKey) {
      throw new Error('API key is required for this operation');
    }

    const url = `${this.baseURL}/settings`;
    try {
      const response = await axios.get(url, {
        params: { apikey: this.apiKey },
        headers: {
          'X-Requested-With': 'XMLHttpRequest',
        }
      });
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
      const endpoint = username 
        ? `${this.baseURL}/collections/${username}` 
        : `${this.baseURL}/collections`;
      
      const response = await axios.get(endpoint, {
        params: this.getParams(),
        headers: {
          'X-Requested-With': 'XMLHttpRequest',
        }
      });
      return response.data.data;
    } catch (error) {
      console.error('Failed to get collections:', error);
      return null;
    }
  }

  async getCollectionWallpapers(username: string, collectionId: number): Promise<WallhavenSearchResponse | null> {
    try {
      const endpoint = `${this.baseURL}/collections/${username}/${collectionId}`;
      
      const response = await axios.get(endpoint, {
        params: this.getParams(),
        headers: {
          'X-Requested-With': 'XMLHttpRequest',
        }
      });
      
      // Process for high quality if needed
      if (response.data.data) {
        const processedData = this.processWallpaperData(response.data.data) as WallpaperPreview[];
        return {
          ...response.data,
          data: processedData
        };
      }
      
      return response.data;
    } catch (error) {
      console.error('Failed to get collection wallpapers:', error);
      return null;
    }
  }
}

// Create and export a singleton instance with no API key by default
export const wallhavenAPI = new WallhavenAPI();

// Function to update API key later if needed
export function setWallhavenApiKey(apiKey: string) {
  return wallhavenAPI.setApiKey(apiKey);
}

// Function to set high quality mode
export function setHighQualityMode(enabled: boolean) {
  return wallhavenAPI.setHighQualityMode(enabled);
} 