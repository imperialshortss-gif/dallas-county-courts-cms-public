import { useState } from "react";
import { useLocation, useSearch } from "wouter";
import { Layout } from "@/components/layout";
import { useListCases, getListCasesQueryKey } from "@workspace/api-client-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search as SearchIcon, Filter, SlidersHorizontal, ChevronLeft, ChevronRight } from "lucide-react";
import { StatusBadge } from "@/components/status-badge";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";

export default function SearchCases() {
  const [location, setLocation] = useLocation();
  const searchParams = new URLSearchParams(useSearch());
  
  const initialQuery = searchParams.get("q") || "";
  const initialType = searchParams.get("type") || "caseNumber";
  const initialStatus = searchParams.get("status") || "all";
  const initialPage = parseInt(searchParams.get("page") || "1", 10);

  const [queryInput, setQueryInput] = useState(initialQuery);
  const [searchType, setSearchType] = useState(initialType);
  const [statusFilter, setStatusFilter] = useState(initialStatus);

  const { data, isLoading } = useListCases({
    query: initialQuery || undefined,
    searchType: initialType as any,
    status: initialStatus === "all" ? undefined : initialStatus,
    page: initialPage,
    pageSize: 15
  }, {
    query: {
      queryKey: getListCasesQueryKey({
        query: initialQuery || undefined,
        searchType: initialType as any,
        status: initialStatus === "all" ? undefined : initialStatus,
        page: initialPage,
        pageSize: 15
      }),
      keepPreviousData: true
    }
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (queryInput) params.set("q", queryInput);
    if (searchType) params.set("type", searchType);
    if (statusFilter !== "all") params.set("status", statusFilter);
    params.set("page", "1");
    setLocation(`/search?${params.toString()}`);
  };

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(useSearch());
    params.set("page", newPage.toString());
    setLocation(`/search?${params.toString()}`);
  };

  return (
    <Layout>
      <div className="flex flex-col gap-6 h-full">
        <div>
          <h1 className="text-3xl font-serif font-bold text-foreground tracking-tight">Case Search</h1>
          <p className="text-muted-foreground mt-1">Search the probate case registry by case number, file number, or party name.</p>
        </div>

        <div className="bg-card border border-border rounded-lg shadow-sm p-4">
          <form onSubmit={handleSearch} className="flex flex-col lg:flex-row gap-4">
            <div className="w-full lg:w-48 shrink-0">
              <label className="text-xs font-semibold uppercase text-muted-foreground mb-1 block">Search By</label>
              <Select value={searchType} onValueChange={setSearchType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="caseNumber">Case Number</SelectItem>
                  <SelectItem value="fileNumber">File Number</SelectItem>
                  <SelectItem value="partyName">Party Name</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex-1">
              <label className="text-xs font-semibold uppercase text-muted-foreground mb-1 block">Search Term</label>
              <div className="relative">
                <SearchIcon className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Enter search query..." 
                  className="pl-9"
                  value={queryInput}
                  onChange={(e) => setQueryInput(e.target.value)}
                />
              </div>
            </div>

            <div className="w-full lg:w-48 shrink-0">
              <label className="text-xs font-semibold uppercase text-muted-foreground mb-1 block">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button type="submit" className="w-full lg:w-auto">
                <SearchIcon className="h-4 w-4 mr-2" /> Search
              </Button>
            </div>
          </form>
        </div>

        <div className="bg-card border border-border rounded-lg shadow-sm flex-1 flex flex-col overflow-hidden">
          <div className="px-4 py-3 border-b border-border flex justify-between items-center bg-muted/30">
            <div className="text-sm font-medium">
              {isLoading ? (
                <Skeleton className="h-5 w-32" />
              ) : (
                `Found ${data?.total || 0} results`
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="h-8">
                <SlidersHorizontal className="h-3 w-3 mr-2" /> Export
              </Button>
            </div>
          </div>
          
          <div className="overflow-auto flex-1">
            <Table>
              <TableHeader className="bg-muted/50 sticky top-0 z-10">
                <TableRow>
                  <TableHead className="font-semibold text-foreground">Case Number</TableHead>
                  <TableHead className="font-semibold text-foreground">Title</TableHead>
                  <TableHead className="font-semibold text-foreground">Next Court Date</TableHead>
                  <TableHead className="font-semibold text-foreground">Status</TableHead>
                  <TableHead className="font-semibold text-foreground">Pending Fees</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 10 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-16 rounded-full" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    </TableRow>
                  ))
                ) : data?.cases?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <SearchIcon className="h-8 w-8 text-muted-foreground/50" />
                        <p>No cases found matching your criteria.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  data?.cases?.map((caseItem) => (
                    <TableRow key={caseItem.id} className="group hover:bg-muted/30 transition-colors">
                      <TableCell className="font-medium">
                        <Link href={`/cases/${caseItem.id}`} className="text-primary hover:underline">
                          {caseItem.caseNumber}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <div className="line-clamp-1" title={caseItem.title}>{caseItem.title}</div>
                        <div className="text-xs text-muted-foreground">{caseItem.caseType}</div>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {caseItem.nextCourtDate ? format(new Date(caseItem.nextCourtDate), 'MM/dd/yyyy') : <span className="text-muted-foreground">-</span>}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={caseItem.status} />
                      </TableCell>
                      <TableCell>
                        <span className={caseItem.pendingFees && caseItem.pendingFees > 0 ? "text-amber-600 font-semibold" : "text-muted-foreground"}>
                          ${(caseItem.pendingFees || 0).toFixed(2)}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          
          {data && data.total > 0 && (
            <div className="border-t border-border p-3 flex items-center justify-between bg-muted/10">
              <div className="text-sm text-muted-foreground">
                Showing <span className="font-medium text-foreground">{(initialPage - 1) * 15 + 1}</span> to <span className="font-medium text-foreground">{Math.min(initialPage * 15, data.total)}</span> of <span className="font-medium text-foreground">{data.total}</span>
              </div>
              <div className="flex gap-1">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handlePageChange(initialPage - 1)}
                  disabled={initialPage <= 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handlePageChange(initialPage + 1)}
                  disabled={initialPage * 15 >= data.total}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
