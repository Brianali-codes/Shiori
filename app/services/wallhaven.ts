import axios from 'axios';

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

class WallhavenAPI {
  private baseURL = 'https://wallhaven.cc/api/v1';
  private apiKey?: string;
  
  constructor(apiKey?: string) {
    this.apiKey = apiKey;
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

  async search(params: SearchParams = {}): Promise<WallhavenSearchResponse> {
    try {
      // Construct query parameters
      const queryParams = this.getParams({
        ...params,
        categories: params.categories || '111', // Default to all categories
        purity: params.purity || '100',         // Default to SFW
      });
      
      const response = await axios.get(`${this.baseURL}/search`, {
        params: queryParams,
        headers: {
          'X-Requested-With': 'XMLHttpRequest',
        }
      });
      
      return response.data;
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
      return response.data.data;
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

  async getLatest(page = 1): Promise<WallhavenSearchResponse> {
    return this.search({ sorting: 'date_added', page });
  }

  async getToplist(page = 1, range: SearchParams['topRange'] = '1M'): Promise<WallhavenSearchResponse> {
    return this.search({ sorting: 'toplist', page, topRange: range });
  }

  async getRandomWallpapers(page = 1, seed?: string): Promise<WallhavenSearchResponse> {
    return this.search({ sorting: 'random', page, seed });
  }

  async getUserSettings(): Promise<any | null> {
    if (!this.apiKey) {
      console.error('API key required for user settings');
      return null;
    }
    
    try {
      const response = await axios.get(`${this.baseURL}/settings`, {
        params: { apikey: this.apiKey },
        headers: {
          'X-Requested-With': 'XMLHttpRequest',
        }
      });
      return response.data.data;
    } catch (error) {
      console.error('Failed to get user settings:', error);
      return null;
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