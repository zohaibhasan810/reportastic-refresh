import { useState, useEffect, useMemo } from "react";
    import { useQuery } from "@tanstack/react-query";
    import { fetchLinkStats, type LinkStats } from "@/services/linkly";
    import { Input } from "@/components/ui/input";
    import { Button } from "@/components/ui/button";
    import { Calendar } from "@/components/ui/calendar";
    import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
    import { Calendar as CalendarIcon, Download, Search } from "lucide-react";
    import { format } from "date-fns";
    import { cn } from "@/lib/utils";
    import { Checkbox } from "@/components/ui/checkbox";
    
    const Reports = () => {
      const [filterRobots, setFilterRobots] = useState(true);
      const [selectedCountries, setSelectedCountries] = useState<string[]>(["USA", "Canada"]);
      const [searchTerm, setSearchTerm] = useState("");
      const [dateRange, setDateRange] = useState<
        { from: Date | undefined; to: Date | undefined } | undefined
      >(undefined);
      const [sortBy, setSortBy] = useState<string | undefined>(undefined);
      const [sortDir, setSortDir] = useState<'asc' | 'desc' | undefined>(undefined);
    
      const { data: links = [], refetch } = useQuery({
        queryKey: ["links", filterRobots, selectedCountries, searchTerm, dateRange, sortBy, sortDir],
        queryFn: () => fetchLinkStats({ 
          filterRobots, 
          countries: selectedCountries,
          searchTerm,
          startDate: dateRange?.from,
          endDate: dateRange?.to,
          sortBy,
          sortDir
        }),
      });
    
      useEffect(() => {
        const interval = setInterval(() => {
          refetch();
        }, 5 * 60 * 1000); // Refresh every 5 minutes
    
        return () => clearInterval(interval);
      }, [refetch]);
    
      const filteredLinks = useMemo(() => {
        return links.filter(link => 
          link.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }, [links, searchTerm]);
    
      const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
          refetch();
        }
      };
    
      const exportData = (format: "csv" | "json") => {
        const data = format === "csv" 
          ? `Name,Today,30 Day,Total,Country\n${filteredLinks.map(l => `${l.name},${l.today},${l.thirtyDay},${l.total},${l.country}`).join("\n")}`
          : JSON.stringify(filteredLinks, null, 2);
        
        const blob = new Blob([data], { type: format === "csv" ? "text/csv" : "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `reports.${format}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      };
    
      return (
        <div className="container mx-auto py-8 px-4">
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <h1 className="text-3xl font-bold">Link Reports</h1>
              <div className="flex items-center gap-4">
                <Button
                  variant={filterRobots ? "default" : "outline"}
                  onClick={() => setFilterRobots(!filterRobots)}
                >
                  {filterRobots ? "Showing Human Traffic" : "Showing All Traffic"}
                </Button>
                
                <div className="flex items-center gap-2">
                  <Checkbox 
                    id="usa"
                    checked={selectedCountries.includes("USA")}
                    onCheckedChange={(checked) => {
                      setSelectedCountries(prev => 
                        checked 
                          ? [...prev, "USA"]
                          : prev.filter(c => c !== "USA")
                      );
                    }}
                  />
                  <label htmlFor="usa">USA</label>
                  
                  <Checkbox 
                    id="canada"
                    checked={selectedCountries.includes("Canada")}
                    onCheckedChange={(checked) => {
                      setSelectedCountries(prev => 
                        checked 
                          ? [...prev, "Canada"]
                          : prev.filter(c => c !== "Canada")
                      );
                    }}
                  />
                  <label htmlFor="canada">Canada</label>
                </div>
    
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "justify-start text-left font-normal",
                        !dateRange && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateRange?.from && dateRange?.to
                        ? `${format(dateRange.from, "PPP")} - ${format(dateRange.to, "PPP")}`
                        : "Pick a date range"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="range"
                      selected={dateRange}
                      onSelect={setDateRange}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
    
            <div className="flex justify-between items-center gap-4 flex-wrap">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  className="pl-10"
                  placeholder="Search links..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={handleSearchKeyDown}
                />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => exportData("csv")}>
                  <Download className="mr-2 h-4 w-4" />
                  Export CSV
                </Button>
                <Button variant="outline" onClick={() => exportData("json")}>
                  <Download className="mr-2 h-4 w-4" />
                  Export JSON
                </Button>
              </div>
            </div>
    
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b">
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Today
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        30 Day
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Country
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredLinks.map((link) => (
                      <tr key={link.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {link.name}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-500">
                          {link.today.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-500">
                          {link.thirtyDay.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-500">
                          {link.total.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-500">
                          {link.country}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      );
    };
    
    export default Reports;
