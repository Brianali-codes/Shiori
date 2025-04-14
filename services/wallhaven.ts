import axios from 'axios';

// Types
export interface WallpaperPreview {
  id: string;
  url: string;
  thumbs: {
    large: string;
    original: string;
    small: string;
  };
  resolution: string;
  category: string;
  purity: string;
  favorites: number;
}

export interface WallpaperDetail extends WallpaperPreview {
  path: string;
  views: number;
  colors: string[];
  tags: Array<{
    id: number;
    name: string;
    category: string;
  }>;
}

export interface SearchParams {
  q?: string;
  categories?: string; // 100/110/111 - General/Anime/People
  purity?: string; // 100/110/111 - SFW/Sketchy/NSFW
  sorting?: 'date_added' | 'relevance' | 'random' | 'views' | 'favorites' | 'toplist';
  order?: 'desc' | 'asc';
  page?: number;
}

class WallhavenAPI {
  private baseURL = 'https://wallhaven.cc/api/v1';
  private apiKey?: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey;
  }

  private get headers() {
    return this.apiKey ? { 'X-API-Key': this.apiKey } : {};
  }

  async search(params: SearchParams = {}): Promise<{ data: WallpaperPreview[] }> {
    const response = await axios.get(`${this.baseURL}/search`, {
      headers: this.headers,
      params: {
        ...params,
        categories: params.categories || '111', // Default to all categories
        purity: params.purity || '100', // Default to SFW
      },
    });
    return response.data;
  }

  async getWallpaper(id: string): Promise<WallpaperDetail> {
    const response = await axios.get(`${this.baseURL}/w/${id}`, {
      headers: this.headers,
    });
    return response.data.data;
  }

  async getLatest(page = 1): Promise<{ data: WallpaperPreview[] }> {
    return this.search({ sorting: 'date_added', page });
  }

  async getToplist(page = 1): Promise<{ data: WallpaperPreview[] }> {
    return this.search({ sorting: 'toplist', page });
  }

  async getRandomWallpapers(page = 1): Promise<{ data: WallpaperPreview[] }> {
    return this.search({ sorting: 'random', page });
  }
}

export const wallhavenAPI = new WallhavenAPI(); 