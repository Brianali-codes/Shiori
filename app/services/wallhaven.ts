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
  // Enable proxy for CORS issues
  private useProxy = true;
  // Multiple proxy options for fallback
  private proxyURLs = [
    'https://corsproxy.io/?',
    'https://api.codetabs.com/v1/proxy?quest='
  ];
  private currentProxyIndex = 0;
  
  constructor(apiKey?: string) {
    this.apiKey = apiKey;
  }

  setApiKey(apiKey: string) {
    this.apiKey = apiKey;
    return this;
  }

  // Get the current proxy URL
  private getProxyURL(): string {
    return this.proxyURLs[this.currentProxyIndex];
  }

  // Switch to next proxy if current one fails
  private switchProxy(): void {
    this.currentProxyIndex = (this.currentProxyIndex + 1) % this.proxyURLs.length;
    console.log(`Switching to proxy: ${this.getProxyURL()}`);
  }

  // Build URL with or without proxy
  private buildURL(endpoint: string): string {
    if (this.useProxy) {
      return `${this.getProxyURL()}${encodeURIComponent(endpoint)}`;
    }
    return endpoint;
  }

  private getParams(params: Record<string, any> = {}): Record<string, any> {
    if (this.apiKey) {
      return { ...params, apikey: this.apiKey };
    }
    return params;
  }

  async search(params: SearchParams = {}): Promise<WallhavenSearchResponse> {
    // Try each proxy until one works or all fail
    for (let attempt = 0; attempt < this.proxyURLs.length; attempt++) {
      try {
        // Construct query parameters
        const queryParams = this.getParams({
          ...params,
          categories: params.categories || '111', // Default to all categories
          purity: params.purity || '100',         // Default to SFW
        });
        
        // Build URL with proxy if enabled
        const apiUrl = this.buildURL(`${this.baseURL}/search`);
        
        console.log(`Attempting API call with ${this.useProxy ? 'proxy: ' + this.getProxyURL() : 'direct connection'}`);
        
        const response = await axios.get(apiUrl, {
          params: queryParams,
          headers: {
            'X-Requested-With': 'XMLHttpRequest',
          }
        });
        
        return response.data;
      } catch (error) {
        console.error(`Wallhaven API Error with proxy ${this.getProxyURL()}:`, error);
        this.switchProxy(); // Try next proxy
        
        // If this was the last proxy attempt, return empty response
        if (attempt === this.proxyURLs.length - 1) {
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
    }
    
    // Fallback empty response (should never reach here due to the return in the catch block)
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

  async getWallpaper(id: string): Promise<WallpaperPreview | null> {
    for (let attempt = 0; attempt < this.proxyURLs.length; attempt++) {
      try {
        const apiUrl = this.buildURL(`${this.baseURL}/w/${id}`);
        
        const response = await axios.get(apiUrl, {
          params: this.getParams(),
          headers: {
            'X-Requested-With': 'XMLHttpRequest',
          }
        });
        return response.data.data;
      } catch (error) {
        console.error(`Failed to get wallpaper details with proxy ${this.getProxyURL()}:`, error);
        this.switchProxy(); // Try next proxy
        
        if (attempt === this.proxyURLs.length - 1) {
          return null;
        }
      }
    }
    return null;
  }

  async getTag(id: number): Promise<Tag | null> {
    for (let attempt = 0; attempt < this.proxyURLs.length; attempt++) {
      try {
        const apiUrl = this.buildURL(`${this.baseURL}/tag/${id}`);
        
        const response = await axios.get(apiUrl, {
          params: this.getParams(),
          headers: {
            'X-Requested-With': 'XMLHttpRequest',
          }
        });
        return response.data.data;
      } catch (error) {
        console.error(`Failed to get tag details with proxy ${this.getProxyURL()}:`, error);
        this.switchProxy(); // Try next proxy
        
        if (attempt === this.proxyURLs.length - 1) {
          return null;
        }
      }
    }
    return null;
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
    
    for (let attempt = 0; attempt < this.proxyURLs.length; attempt++) {
      try {
        const apiUrl = this.buildURL(`${this.baseURL}/settings`);
        
        const response = await axios.get(apiUrl, {
          params: { apikey: this.apiKey },
          headers: {
            'X-Requested-With': 'XMLHttpRequest',
          }
        });
        return response.data.data;
      } catch (error) {
        console.error(`Failed to get user settings with proxy ${this.getProxyURL()}:`, error);
        this.switchProxy(); // Try next proxy
        
        if (attempt === this.proxyURLs.length - 1) {
          return null;
        }
      }
    }
    return null;
  }

  async getUserCollections(username?: string): Promise<any | null> {
    for (let attempt = 0; attempt < this.proxyURLs.length; attempt++) {
      try {
        const endpoint = username 
          ? `${this.baseURL}/collections/${username}` 
          : `${this.baseURL}/collections`;
        
        const apiUrl = this.buildURL(endpoint);
        
        const response = await axios.get(apiUrl, {
          params: this.getParams(),
          headers: {
            'X-Requested-With': 'XMLHttpRequest',
          }
        });
        return response.data.data;
      } catch (error) {
        console.error(`Failed to get collections with proxy ${this.getProxyURL()}:`, error);
        this.switchProxy(); // Try next proxy
        
        if (attempt === this.proxyURLs.length - 1) {
          return null;
        }
      }
    }
    return null;
  }

  async getCollectionWallpapers(username: string, collectionId: number): Promise<WallhavenSearchResponse | null> {
    for (let attempt = 0; attempt < this.proxyURLs.length; attempt++) {
      try {
        const endpoint = `${this.baseURL}/collections/${username}/${collectionId}`;
        const apiUrl = this.buildURL(endpoint);
        
        const response = await axios.get(apiUrl, {
          params: this.getParams(),
          headers: {
            'X-Requested-With': 'XMLHttpRequest',
          }
        });
        return response.data;
      } catch (error) {
        console.error(`Failed to get collection wallpapers with proxy ${this.getProxyURL()}:`, error);
        this.switchProxy(); // Try next proxy
        
        if (attempt === this.proxyURLs.length - 1) {
          return null;
        }
      }
    }
    return null;
  }
}

// Create and export a singleton instance with no API key by default
export const wallhavenAPI = new WallhavenAPI();

// Function to update API key later if needed
export function setWallhavenApiKey(apiKey: string) {
  return wallhavenAPI.setApiKey(apiKey);
} 