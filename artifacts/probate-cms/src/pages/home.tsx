import { useState } from "react";
import { useLocation } from "wouter";
import { Search, Scale, FileText, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useGetDashboardSummary, getGetDashboardSummaryQueryKey } from "@workspace/api-client-react";

export default function Home() {
  const [, setLocation] = useLocation();
  const [query, setQuery] = useState("");
  const [searchType, setSearchType] = useState("caseNumber");

  const { data: summary, isLoading } = useGetDashboardSummary({
    query: { queryKey: getGetDashboardSummaryQueryKey() }
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      setLocation(`/search?q=${encodeURIComponent(query)}&type=${searchType}`);
    } else {
      setLocation(`/search`);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <main className="flex-1 flex flex-col">
        {/* Hero Section */}
        <section className="bg-primary text-primary-foreground py-20 px-6 sm:px-10 lg:px-20 border-b border-primary-border shadow-md">
          <div className="max-w-5xl mx-auto flex flex-col items-center text-center space-y-8">
            <div className="p-4 bg-primary-foreground/10 rounded-full border border-primary-foreground/20">
              <Scale className="h-16 w-16 text-primary-foreground" />
            </div>
            
            <div className="space-y-4">
              <h1 className="text-4xl font-serif md:text-5xl lg:text-6xl font-bold tracking-tight">
                Statutory Probate Courts
                <br className="hidden md:inline" />
                <span className="md:mt-2 block text-3xl md:text-4xl text-primary-foreground/90">Dallas County, Texas</span>
              </h1>
              <p className="text-lg md:text-xl text-primary-foreground/80 max-w-2xl mx-auto font-light">
                Search and track probate case status securely online. The authoritative portal for court clerks, attorneys, and administrators.
              </p>
            </div>

            {/* Search Box */}
            <div className="w-full max-w-3xl mt-8 bg-card text-card-foreground p-4 md:p-6 rounded-lg shadow-xl border">
              <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
                <div className="w-full md:w-48 shrink-0">
                  <Select value={searchType} onValueChange={setSearchType}>
                    <SelectTrigger className="w-full h-12 bg-background border-input">
                      <SelectValue placeholder="Search by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="caseNumber">Case Number</SelectItem>
                      <SelectItem value="fileNumber">File Number</SelectItem>
                      <SelectItem value="partyName">Party Name</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-3 h-6 w-6 text-muted-foreground" />
                  <Input 
                    type="search" 
                    placeholder="Enter search terms..." 
                    className="pl-12 h-12 w-full bg-background border-input text-base"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                </div>
                <Button type="submit" size="lg" className="h-12 px-8 font-semibold w-full md:w-auto">
                  Search Cases
                </Button>
              </form>
            </div>
          </div>
        </section>

        {/* Quick Stats */}
        <section className="py-16 px-6 sm:px-10 lg:px-20 bg-muted/30 flex-1">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-2xl font-serif font-semibold text-foreground mb-8 text-center">Court Overview</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="border-border shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Total Active Cases</CardTitle>
                  <FileText className="h-5 w-5 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-foreground">
                    {isLoading ? "..." : summary?.activeCases?.toLocaleString() || "0"}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Requiring attention
                  </p>
                </CardContent>
              </Card>

              <Card className="border-border shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Upcoming Hearings</CardTitle>
                  <Scale className="h-5 w-5 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-foreground">
                    {isLoading ? "..." : summary?.upcomingHearingsCount?.toLocaleString() || "0"}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Scheduled in next 30 days
                  </p>
                </CardContent>
              </Card>

              <Card className="border-border shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Recent Filings</CardTitle>
                  <Users className="h-5 w-5 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-foreground">
                    {isLoading ? "..." : summary?.recentFilingsCount?.toLocaleString() || "0"}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    New cases this month
                  </p>
                </CardContent>
              </Card>
            </div>
            
            <div className="mt-12 text-center">
              <Button variant="outline" size="lg" onClick={() => setLocation('/dashboard')} className="px-8 border-primary/20 text-primary hover:bg-primary hover:text-primary-foreground">
                Access Dashboard
              </Button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
