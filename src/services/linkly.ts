import { toast } from "sonner";
    
    export interface LinkStats {
      id: string;
      name: string;
      sparklineData: number[];
      today: number;
      thirtyDay: number;
      total: number;
      isRobot: boolean;
      country: string;
    }
    
    export interface LinklyFilters {
      filterRobots: boolean;
      countries?: string[];
      searchTerm?: string;
      startDate?: Date;
      endDate?: Date;
      sortBy?: string;
      sortDir?: 'asc' | 'desc';
    }
    
    interface LinklyHQClick {
      t: string;  // date in YYYY-MM-DD format
      y: number;  // number of clicks for that date
    }
    
    interface LinklyHQClicksResponse {
      traffic: LinklyHQClick[];
    }
    
    interface LinklyHQLink {
      id: number;
      name: string;
      url: string;
      clicks_today: number;
      clicks_thirty_days: number;
      clicks_total: number;
      sparkline: number[];
      enabled: boolean;
      deleted: boolean;
    }
    
    interface LinklyHQLinksResponse {
      links: LinklyHQLink[];
      page_number: number;
      page_size: number;
      total_entries: number;
      total_pages: number;
      total_rows: number;
      workspace_link_count: number;
    }
    
    const API_BASE_URL = 'https://app.linklyhq.com/api/v1/workspace/144651';
    const API_KEY = 'w+qgLG0yzgMtti9XgNQ9zQ==';
    
    const fetchLinks = async (searchTerm: string = "", sortBy?: string, sortDir?: 'asc' | 'desc'): Promise<LinklyHQLink[]> => {
      const queryParams = new URLSearchParams({
        page: '1',
        page_size: '10',
        api_key: API_KEY,
        search: searchTerm,
        sort_by: sortBy || '',
        sort_dir: sortDir || ''
      });
    
      const response = await fetch(`${API_BASE_URL}/list_links?${queryParams}`, {
        headers: {
          'Content-Type': 'application/json',
          'accept': 'application/json'
        }
      });
    
      if (!response.ok) {
        throw new Error(`Failed to fetch links: ${response.statusText}`);
      }
    
      const data: LinklyHQLinksResponse = await response.json();
      return data.links.filter(link => !link.deleted && link.enabled);
    };
    
    
    export const fetchLinkStats = async (filters: LinklyFilters): Promise<LinkStats[]> => {
      try {
        // First, fetch all links
        const links = await fetchLinks(filters.searchTerm, filters.sortBy, filters.sortDir);
        
        // Then, map the links to the LinkStats format
        const stats = links.map((link) => {
          // If countries filter is applied, filter clicks by country
          const countryCode = filters.countries?.length ? filters.countries[0] : 'Unknown';
    
          return {
            id: link.id.toString(),
            name: link.name,
            sparklineData: [],
            today: link.clicks_today,
            thirtyDay: link.clicks_thirty_days,
            total: link.clicks_total,
            isRobot: false,
            country: countryCode
          };
        });
    
        return stats;
    
      } catch (error) {
        console.error('Error fetching link statistics:', error);
        toast.error("Failed to fetch link statistics");
        return [];
      }
    };
