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
  id: string;
  link_id: string;
  link_title: string;
  created_at: string;
  is_bot: boolean;
  country_code: string;
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
const API_KEY = '897678';

const fetchLinks = async (): Promise<LinklyHQLink[]> => {
  const response = await fetch(`${API_BASE_URL}/list_links`, {
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
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
): Promise<LinklyHQClick[]> => {
  const response = await fetch(`${API_BASE_URL}/clicks?` + new URLSearchParams({
    link_id: linkId.toString(),
    start: startDate.toISOString(),
    from: endDate.toISOString(),
    ...(filters.filterRobots && { bot: 'false' })
  }), {
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
    }
  });

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
      const clicks = await fetchClicksForLink(link.id, filters, thirtyDaysAgo, today);
      
      // If countries filter is applied, filter clicks by country
      const filteredClicks = filters.countries?.length 
        ? clicks.filter(click => filters.countries?.includes(click.country_code))
        : clicks;

      return {
        id: link.id.toString(),
        name: link.name,
        sparklineData: link.sparkline || Array(7).fill(0),
        today: link.clicks_today,
        thirtyDay: link.clicks_thirty_days,
        total: link.clicks_total,
        isRobot: false,
        country: filteredClicks[0]?.country_code || 'Unknown'
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