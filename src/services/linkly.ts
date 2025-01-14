import { toast } from "sonner";

export interface LinkStats {
  id: string;
  name: string;
  sparklineData: number[];
  today: number;
  thirtyDay: number;
  total: number;
  isRobot: boolean;
}

// This would be replaced with actual API calls
export const fetchLinkStats = async (filterRobots: boolean = true): Promise<LinkStats[]> => {
  try {
    // Simulated API call - replace with actual LinklyHQ API
    const mockData: LinkStats[] = [
      {
        id: "1",
        name: "Marketing Campaign Q1",
        sparklineData: [1, 5, 2, 8, 3, 7, 4],
        today: 131,
        thirtyDay: 368,
        total: 368,
        isRobot: false
      },
      {
        id: "2",
        name: "Newsletter Signup",
        sparklineData: [2, 6, 3, 9, 5, 7, 4],
        today: 85,
        thirtyDay: 5041,
        total: 5252,
        isRobot: true
      }
    ];

    return mockData.filter(link => !filterRobots || !link.isRobot);
  } catch (error) {
    toast.error("Failed to fetch link statistics");
    return [];
  }
};