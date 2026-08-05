import { useState } from "react";
import { Layout } from "@/components/layout";
import { useListHearings, getListHearingsQueryKey } from "@workspace/api-client-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Clock, MapPin } from "lucide-react";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";

export default function Hearings() {
  const [upcomingOnly, setUpcomingOnly] = useState(true);

  const { data: hearings, isLoading } = useListHearings(
    { upcoming: upcomingOnly ? true : undefined },
    { query: { queryKey: getListHearingsQueryKey({ upcoming: upcomingOnly ? true : undefined }) } }
  );

  return (
    <Layout>
      <div className="flex flex-col gap-6 h-full">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
          <div>
            <h1 className="text-3xl font-serif font-bold text-foreground tracking-tight">Hearings & Dates</h1>
            <p className="text-muted-foreground mt-1">Schedule of all court proceedings.</p>
          </div>
          <div className="flex bg-muted p-1 rounded-md">
            <Button 
              variant={upcomingOnly ? "secondary" : "ghost"} 
              size="sm" 
              onClick={() => setUpcomingOnly(true)}
              className="text-sm px-4"
            >
              Upcoming
            </Button>
            <Button 
              variant={!upcomingOnly ? "secondary" : "ghost"} 
              size="sm" 
              onClick={() => setUpcomingOnly(false)}
              className="text-sm px-4"
            >
              All Hearings
            </Button>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg shadow-sm flex-1 flex flex-col overflow-hidden">
          <div className="overflow-auto flex-1">
            <Table>
              <TableHeader className="bg-muted/50 sticky top-0 z-10">
                <TableRow>
                  <TableHead className="font-semibold text-foreground">Date & Time</TableHead>
                  <TableHead className="font-semibold text-foreground">Case</TableHead>
                  <TableHead className="font-semibold text-foreground">Type</TableHead>
                  <TableHead className="font-semibold text-foreground">Court Room</TableHead>
                  <TableHead className="font-semibold text-foreground">Result</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 10 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-10 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-10 w-48" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-24 rounded-full" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                    </TableRow>
                  ))
                ) : hearings?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <CalendarIcon className="h-8 w-8 text-muted-foreground/50" />
                        <p>No hearings found.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  hearings?.map((hearing) => {
                    const isPast = new Date(hearing.hearingDate) < new Date();
                    return (
                      <TableRow key={hearing.id} className="hover:bg-muted/30 transition-colors">
                        <TableCell>
                          <div className={`font-medium flex items-center gap-2 ${isPast ? 'text-muted-foreground' : 'text-foreground'}`}>
                            <div className="bg-primary/10 text-primary p-2 rounded-md flex flex-col items-center justify-center min-w-[50px]">
                              <span className="text-[10px] font-bold uppercase">{format(new Date(hearing.hearingDate), 'MMM')}</span>
                              <span className="text-lg font-bold leading-none">{format(new Date(hearing.hearingDate), 'dd')}</span>
                            </div>
                            <div>
                              <div>{format(new Date(hearing.hearingDate), 'EEEE, yyyy')}</div>
                              <div className="text-xs flex items-center gap-1 mt-1 text-muted-foreground">
                                <Clock className="h-3 w-3" /> {format(new Date(hearing.hearingDate), 'h:mm a')}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Link href={`/cases/${hearing.caseId}`} className="text-primary hover:underline font-medium block">
                            {hearing.caseNumber}
                          </Link>
                          <span className="text-xs text-muted-foreground line-clamp-1">{hearing.caseTitle}</span>
                        </TableCell>
                        <TableCell>
                          <span className="bg-muted px-2 py-1 rounded text-xs font-medium border border-border">
                            {hearing.hearingType}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5 text-sm">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            {hearing.courtRoom}
                          </div>
                        </TableCell>
                        <TableCell>
                          {hearing.result ? (
                            <StatusBadge status={hearing.result === 'Concluded' ? 'closed' : 'active'} className="capitalize" />
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </Layout>
  );
}
