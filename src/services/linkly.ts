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
const API_KEY = 'w+22222==';

const fetchLinks = async (): Promise<LinklyHQLink[]> => {
  const queryParams = new URLSearchParams({
    page: '1',
    page_size: '10',
    api_key: API_KEY
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

const fetchClicksForLink = async (
  linkId: number, 
  filters: LinklyFilters,
  startDate: Date,
  endDate: Date
): Promise<LinklyHQClicksResponse> => {
  const queryParams = new URLSearchParams({
    link_id: linkId.toString(),
    start: startDate.toISOString().split('T')[0],
    end: endDate.toISOString().split('T')[0],
    bots: (!filters.filterRobots).toString(),
    unique: 'false',
    format: 'json',
    timezone: 'America/New_York',
    frequency: 'day',
    api_key: API_KEY
  });

  const response = await fetch(`${API_BASE_URL}/clicks?${queryParams}`);

  if (!response.ok) {
    throw new Error(`Failed to fetch clicks for link ${linkId}: ${response.statusText}`);
  }

  return response.json();
};

export const fetchLinkStats = async (filters: LinklyFilters): Promise<LinkStats[]> => {
  try {
    // Calculate date ranges
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);

    // First, fetch all links
    const links = await fetchLinks();
    
    // Then, fetch clicks for each link
    const statsPromises = links.map(async (link) => {
      const clicksResponse = await fetchClicksForLink(link.id, filters, thirtyDaysAgo, today);
      
      // Calculate clicks based on the traffic data
      const todayStr = today.toISOString().split('T')[0];
      const todayClicks = clicksResponse.traffic.find(t => t.t === todayStr)?.y || 0;
      
      // Calculate total clicks from traffic data
      const totalClicks = clicksResponse.traffic.reduce((sum, day) => sum + day.y, 0);

      // If countries filter is applied, filter clicks by country
      const countryCode = filters.countries?.length ? filters.countries[0] : 'Unknown';

      return {
        id: link.id.toString(),
        name: link.name,
        sparklineData: link.sparkline || Array(7).fill(0),
        today: todayClicks,
        thirtyDay: totalClicks,
        total: link.clicks_total,
        isRobot: false,
        country: countryCode
      };
    });

    const stats = await Promise.all(statsPromises);
    return stats;

  } catch (error) {
    console.error('Error fetching link statistics:', error);
    toast.error("Failed to fetch link statistics");
    return [];
  }
};