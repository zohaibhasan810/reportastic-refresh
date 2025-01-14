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

// This would be replaced with actual API calls
export const fetchLinkStats = async (filters: LinklyFilters): Promise<LinkStats[]> => {
  try {
    // Simulated API call - replace with actual LinklyHQ API
    // In production, this would make a real API call with the filters:
    // const response = await fetch(`https://api.linklyhq.com/v1/stats?filterRobots=${filters.filterRobots}&countries=${filters.countries?.join(',')}`);
    // const data = await response.json();
    
    const mockData: LinkStats[] = [
      {
        id: "1",
        name: "Marketing Campaign Q1",
        sparklineData: [1, 5, 2, 8, 3, 7, 4],
        today: 131,
        thirtyDay: 368,
        total: 368,
        isRobot: false,
        country: "USA"
      },
      {
        id: "2",
        name: "Newsletter Signup",
        sparklineData: [2, 6, 3, 9, 5, 7, 4],
        today: 85,
        thirtyDay: 5041,
        total: 5252,
        isRobot: true,
        country: "Canada"
      }
    ];

    let filteredData = mockData;
    
    // Apply robot filter
    if (filters.filterRobots) {
      filteredData = filteredData.filter(link => !link.isRobot);
    }
    
    // Apply country filter
    if (filters.countries && filters.countries.length > 0) {
      filteredData = filteredData.filter(link => 
        filters.countries?.includes(link.country)
      );
    }

    return filteredData;
  } catch (error) {
    toast.error("Failed to fetch link statistics");
    return [];
  }
};