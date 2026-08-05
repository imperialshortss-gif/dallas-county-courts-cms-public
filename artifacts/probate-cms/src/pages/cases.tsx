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

export default function AllCases() {
  const [location, setLocation] = useLocation();
  const searchParams = new URLSearchParams(useSearch());
  
  const initialStatus = searchParams.get("status") || "all";
  const initialPage = parseInt(searchParams.get("page") || "1", 10);

  const [statusFilter, setStatusFilter] = useState(initialStatus);

  const { data, isLoading } = useListCases({
    status: initialStatus === "all" ? undefined : initialStatus,
    page: initialPage,
    pageSize: 20
  }, {
    query: {
      queryKey: getListCasesQueryKey({
        status: initialStatus === "all" ? undefined : initialStatus,
        page: initialPage,
        pageSize: 20
      }),
      keepPreviousData: true
    }
  });

  const handleStatusChange = (newStatus: string) => {
    setStatusFilter(newStatus);
    const params = new URLSearchParams(useSearch());
    if (newStatus !== "all") {
      params.set("status", newStatus);
    } else {
      params.delete("status");
    }
    params.set("page", "1");
    setLocation(`/cases?${params.toString()}`);
  };

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(useSearch());
    params.set("page", newPage.toString());
    setLocation(`/cases?${params.toString()}`);
  };

  return (
    <Layout>
      <div className="flex flex-col gap-6 h-full">
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-serif font-bold text-foreground tracking-tight">All Cases</h1>
            <p className="text-muted-foreground mt-1">Browse and filter the complete case registry.</p>
          </div>
          <Button asChild>
            <Link href="/search">Advanced Search</Link>
          </Button>
        </div>

        <div className="bg-card border border-border rounded-lg shadow-sm flex-1 flex flex-col overflow-hidden">
          <div className="px-4 py-3 border-b border-border flex flex-col sm:flex-row gap-4 sm:justify-between sm:items-center bg-muted/30">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-muted-foreground">Status:</span>
                <Select value={statusFilter} onValueChange={handleStatusChange}>
                  <SelectTrigger className="w-[180px] h-8 text-sm">
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="Closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="text-sm font-medium">
              {isLoading ? (
                <Skeleton className="h-5 w-32" />
              ) : (
                `Found ${data?.total || 0} cases`
              )}
            </div>
          </div>
          
          <div className="overflow-auto flex-1">
            <Table>
              <TableHeader className="bg-muted/50 sticky top-0 z-10">
                <TableRow>
                  <TableHead className="font-semibold text-foreground">Case Number</TableHead>
                  <TableHead className="font-semibold text-foreground">File Number</TableHead>
                  <TableHead className="font-semibold text-foreground">Title</TableHead>
                  <TableHead className="font-semibold text-foreground">Filing Date</TableHead>
                  <TableHead className="font-semibold text-foreground">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 15 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-16 rounded-full" /></TableCell>
                    </TableRow>
                  ))
                ) : data?.cases?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <FilesIcon className="h-8 w-8 text-muted-foreground/50" />
                        <p>No cases found.</p>
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
                      <TableCell className="text-muted-foreground">
                        {caseItem.fileNumber}
                      </TableCell>
                      <TableCell>
                        <div className="line-clamp-1" title={caseItem.title}>{caseItem.title}</div>
                        <div className="text-xs text-muted-foreground">{caseItem.caseType}</div>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {caseItem.filingDate ? format(new Date(caseItem.filingDate), 'MM/dd/yyyy') : <span className="text-muted-foreground">-</span>}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={caseItem.status} />
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
                Showing <span className="font-medium text-foreground">{(initialPage - 1) * 20 + 1}</span> to <span className="font-medium text-foreground">{Math.min(initialPage * 20, data.total)}</span> of <span className="font-medium text-foreground">{data.total}</span>
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
                  disabled={initialPage * 20 >= data.total}
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

function FilesIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20 7h-3a2 2 0 0 1-2-2V2" />
      <path d="M9 18a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h7l4 4v10a2 2 0 0 1-2 2Z" />
      <path d="M3 7.6v12.8A1.6 1.6 0 0 0 4.6 22h9.8" />
    </svg>
  );
}