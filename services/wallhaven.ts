import axios from 'axios';
import { Platform } from 'react-native';

// List of CORS proxies to try
const CORS_PROXIES = [
  'https://api.allorigins.win/raw?url=',
  'https://corsproxy.io/?',
  'https://cors-proxy.htmldriven.com/?url=',
  'https://cors-anywhere.herokuapp.com/',
  'https://thingproxy.freeboard.io/fetch/'
];

// Types
export interface WallpaperPreview {
  id: string;
  url: string;
  short_url: string;
  views: number;
  favorites: number;
  source: string;
  purity: string;
  category: string;
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
}

export interface WallpaperDetail extends WallpaperPreview {
  uploader: {
    username: string;
    group: string;
    avatar: {
      '200px': string;
      '128px': string;
      '32px': string;
      '20px': string;
    };
  };
  tags: Array<{
    id: number;
    name: string;
    alias: string;
    category_id: number;
    category: string;
    purity: string;
    created_at: string;
  }>;
}

export interface SearchParams {
  q?: string;
  categories?: string; // 100/110/111 - General/Anime/People
  purity?: string; // 100/110/111 - SFW/Sketchy/NSFW
  sorting?: 'date_added' | 'relevance' | 'random' | 'views' | 'favorites' | 'toplist';
  order?: 'desc' | 'asc';
  topRange?: '1d' | '3d' | '1w' | '1M' | '3M' | '6M' | '1y';
  atleast?: string; // e.g., '1920x1080'
  resolutions?: string; // e.g., '1920x1080,1920x1200'
  ratios?: string; // e.g., '16x9,16x10'
  colors?: string; // e.g., '660000,990000'
  page?: number;
  seed?: string;
}

export interface SearchResponse {
  data: WallpaperPreview[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    query: string | { id: number; tag: string } | null;
    seed: string | null;
  };
}

class WallhavenAPI {
  private baseURL = 'https://wallhaven.cc/api/v1';
  public apiKey?: string;
  private lastRequestTime = 0;
  private readonly RATE_LIMIT = 45; // requests per minute
  private readonly RATE_LIMIT_WINDOW = 60000; // 1 minute in milliseconds
  private currentProxyIndex = 0;

  constructor(apiKey?: string) {
    this.apiKey = apiKey;
  }

  setApiKey(apiKey: string) {
    this.apiKey = apiKey;
  }

  async validateApiKey(): Promise<boolean> {
    try {
      const url = `${this.baseURL}/settings`;
      await this.makeRequest(url);
      return true;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        return false;
      }
      throw error;
    }
  }

  private get headers() {
    return this.apiKey ? { 'X-API-Key': this.apiKey } : {};
  }

  /**
   * Get the full URL with an appropriate CORS proxy if needed
   * For web platform, we need to include the query parameters in the URL
   * before passing it to the proxy
   */
  private getProxiedUrl(url: string, params: any = {}): string {
    if (Platform.OS !== 'web') {
      return url; // Use direct URL for native platforms
    }

    // For web platform, we need to construct the URL with query params first
    const queryParams = new URLSearchParams();
    
    for (const key in params) {
      if (params[key] !== undefined) {
        queryParams.append(key, params[key]);
      }
    }
    
    // Add the API key to the query params if available
    if (this.apiKey) {
      queryParams.append('apikey', this.apiKey);
    }
    
    // Create the full URL with parameters
    const fullUrl = queryParams.toString()
      ? `${url}?${queryParams.toString()}`
      : url;
    
    // Then add the proxy prefix
    const proxy = CORS_PROXIES[this.currentProxyIndex];
    console.log(`Using CORS proxy: ${proxy} for URL: ${fullUrl}`);
    
    return `${proxy}${encodeURIComponent(fullUrl)}`;
  }

  private async makeRequest(url: string, params: any = {}, retryCount = 0): Promise<any> {
    // Rate limiting
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    if (timeSinceLastRequest < this.RATE_LIMIT_WINDOW / this.RATE_LIMIT) {
      await new Promise(resolve => 
        setTimeout(resolve, (this.RATE_LIMIT_WINDOW / this.RATE_LIMIT) - timeSinceLastRequest)
      );
    }
    this.lastRequestTime = Date.now();

    try {
      // Use a CORS proxy for web platform with params included in the URL
      const requestUrl = Platform.OS === 'web' 
        ? this.getProxiedUrl(url, params) 
        : url;
      
      const axiosConfig = {
        headers: {
          ...this.headers,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          ...(Platform.OS === 'web' ? {
            'X-Requested-With': 'XMLHttpRequest',
            'Access-Control-Allow-Origin': '*',
          } : {}),
        },
        params: Platform.OS === 'web' ? undefined : {
          ...params,
          apikey: this.apiKey,
        },
        timeout: 15000,
        validateStatus: (status: number) => status >= 200 && status < 500,
      };

      const response = await axios.get(requestUrl, axiosConfig);

      if (response.status === 401) {
        throw new Error('Unauthorized: Invalid or missing API key');
      }
      if (response.status === 429) {
        throw new Error('Rate limit exceeded: Too many requests');
      }
      if (response.status !== 200) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      return response.data;
    } catch (error) {
      console.error(`Wallhaven API Error with proxy ${CORS_PROXIES[this.currentProxyIndex]}: `, error);
      
      if (axios.isAxiosError(error)) {
        // For web platform, try a different proxy if available
        if (Platform.OS === 'web' && retryCount < CORS_PROXIES.length - 1) {
          this.currentProxyIndex = (this.currentProxyIndex + 1) % CORS_PROXIES.length;
          console.log(`Switching to proxy: ${CORS_PROXIES[this.currentProxyIndex]}`);
          
          // Try again with the new proxy after a short delay
          await new Promise(resolve => setTimeout(resolve, 500));
          return this.makeRequest(url, params, retryCount + 1);
        }

        if (error.response?.status === 401) {
          throw new Error('Unauthorized: Invalid or missing API key');
        }
        if (error.response?.status === 429) {
          throw new Error('Rate limit exceeded: Too many requests');
        }
        if (error.code === 'ERR_NETWORK' || error.code === 'ECONNABORTED') {
          if (Platform.OS === 'web') {
            if (retryCount >= CORS_PROXIES.length - 1) {
              throw new Error('Network error: All CORS proxies failed. Unable to connect to Wallhaven API. Try again later or use a VPN.');
            } else {
              // Try next proxy
              this.currentProxyIndex = (this.currentProxyIndex + 1) % CORS_PROXIES.length;
              console.log(`Switching to proxy: ${CORS_PROXIES[this.currentProxyIndex]}`);
              
              // Try again with the new proxy after a short delay
              await new Promise(resolve => setTimeout(resolve, 500));
              return this.makeRequest(url, params, retryCount + 1);
            }
          } else {
            throw new Error('Network error: Please check your internet connection and try again.');
          }
        }
        throw new Error(`API request failed: ${error.message}`);
      }
      throw error;
    }
  }

  async search(params: SearchParams = {}): Promise<SearchResponse> {
    const url = `${this.baseURL}/search`;
    const searchParams = {
      ...params,
      categories: params.categories || '111',
      purity: params.purity || '100',
      sorting: params.sorting || 'date_added',
      order: params.order || 'desc',
    };
    return this.makeRequest(url, searchParams);
  }

  async getWallpaper(id: string): Promise<{ data: WallpaperDetail }> {
    const url = `${this.baseURL}/w/${id}`;
    return this.makeRequest(url);
  }

  async getLatest(page = 1): Promise<SearchResponse> {
    return this.search({ sorting: 'date_added', page });
  }

  async getToplist(page = 1, range: SearchParams['topRange'] = '1M'): Promise<SearchResponse> {
    return this.search({ sorting: 'toplist', page, topRange: range });
  }

  async getRandomWallpapers(page = 1): Promise<SearchResponse> {
    return this.search({ sorting: 'random', page });
  }

  async getTagInfo(tagId: number): Promise<{ data: { id: number; name: string; alias: string; category_id: number; category: string; purity: string; created_at: string } }> {
    const url = `${this.baseURL}/tag/${tagId}`;
    return this.makeRequest(url);
  }

  async getUserSettings(): Promise<{ data: {
    thumb_size: string;
    per_page: string;
    purity: string[];
    categories: string[];
    resolutions: string[];
    aspect_ratios: string[];
    toplist_range: string;
    tag_blacklist: string[];
    user_blacklist: string[];
  } }> {
    if (!this.apiKey) {
      throw new Error('API key is required to access user settings');
    }
    const url = `${this.baseURL}/settings`;
    return this.makeRequest(url);
  }
}

export const wallhavenAPI = new WallhavenAPI();

// Export the WallhavenAPI class as default
export default WallhavenAPI;