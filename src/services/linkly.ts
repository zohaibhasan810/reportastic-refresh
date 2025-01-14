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

const API_BASE_URL = 'https://app.linklyhq.com/api/v1';
const API_KEY = '897678'; // Note: In production, this should be stored in environment variables

export const fetchLinkStats = async (filters: LinklyFilters): Promise<LinkStats[]> => {
  try {
    // Calculate date ranges
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);

    // Fetch clicks from LinklyHQ API
    const response = await fetch(`${API_BASE_URL}/clicks?` + new URLSearchParams({
      date_from: thirtyDaysAgo.toISOString(),
      date_to: today.toISOString(),
      ...(filters.filterRobots && { is_bot: 'false' }),
      ...(filters.countries?.length && { country_code: filters.countries.join(',') })
    }), {
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      throw new Error(`LinklyHQ API error: ${response.statusText}`);
    }

    const clicks: LinklyHQClick[] = await response.json();

    // Process the clicks data to match our LinkStats interface
    const linkMap = new Map<string, {
      name: string;
      clicks: LinklyHQClick[];
      todayClicks: LinklyHQClick[];
      thirtyDayClicks: LinklyHQClick[];
    }>();

    // Group clicks by link
    clicks.forEach(click => {
      if (!linkMap.has(click.link_id)) {
        linkMap.set(click.link_id, {
          name: click.link_title,
          clicks: [],
          todayClicks: [],
          thirtyDayClicks: []
        });
      }
      
      const linkData = linkMap.get(click.link_id)!;
      linkData.clicks.push(click);

      // Check if click is from today
      const clickDate = new Date(click.created_at);
      const isToday = clickDate.toDateString() === today.toDateString();
      if (isToday) {
        linkData.todayClicks.push(click);
      }

      // Check if click is within last 30 days
      if (clickDate >= thirtyDaysAgo) {
        linkData.thirtyDayClicks.push(click);
      }
    });

    // Convert map to LinkStats array
    const stats: LinkStats[] = Array.from(linkMap.entries()).map(([linkId, data]) => {
      // Generate sparkline data (last 7 days)
      const sparklineData = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toDateString();
        return data.clicks.filter(click => 
          new Date(click.created_at).toDateString() === dateStr
        ).length;
      }).reverse();

      return {
        id: linkId,
        name: data.name,
        sparklineData,
        today: data.todayClicks.length,
        thirtyDay: data.thirtyDayClicks.length,
        total: data.clicks.length,
        isRobot: false, // We're already filtering bots in the API call
        country: data.clicks[0]?.country_code || 'Unknown'
      };
    });

    return stats;
  } catch (error) {
    console.error('Error fetching link statistics:', error);
    toast.error("Failed to fetch link statistics");
    return [];
  }
};