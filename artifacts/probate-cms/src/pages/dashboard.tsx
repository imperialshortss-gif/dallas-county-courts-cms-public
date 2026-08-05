import { useGetDashboardSummary, useGetRecentActivity, useGetUpcomingHearings, getGetDashboardSummaryQueryKey, getGetRecentActivityQueryKey, getGetUpcomingHearingsQueryKey } from "@workspace/api-client-react";
import { Layout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { FileText, Clock, AlertTriangle, Users, Scale, Calendar, ChevronRight, Activity, DollarSign } from "lucide-react";
import { Link } from "wouter";
import { StatusBadge } from "@/components/status-badge";
import { format } from "date-fns";

export default function Dashboard() {
  const { data: summary, isLoading: summaryLoading } = useGetDashboardSummary({
    query: { queryKey: getGetDashboardSummaryQueryKey() }
  });

  const { data: recentActivity, isLoading: activityLoading } = useGetRecentActivity({
    query: { queryKey: getGetRecentActivityQueryKey() }
  });

  const { data: upcomingHearings, isLoading: hearingsLoading } = useGetUpcomingHearings({
    query: { queryKey: getGetUpcomingHearingsQueryKey() }
  });

  return (
    <Layout>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-serif font-bold text-foreground tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Overview of court operations and recent activity.</p>
        </div>

        {/* Top Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-border shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Total Cases</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {summaryLoading ? <Skeleton className="h-8 w-20" /> : (
                <div className="text-3xl font-bold">{summary?.totalCases?.toLocaleString() || "0"}</div>
              )}
            </CardContent>
          </Card>
          
          <Card className="border-border shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Active Cases</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {summaryLoading ? <Skeleton className="h-8 w-20" /> : (
                <div className="text-3xl font-bold text-green-600 dark:text-green-500">{summary?.activeCases?.toLocaleString() || "0"}</div>
              )}
            </CardContent>
          </Card>
          
          <Card className="border-border shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Pending Cases</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {summaryLoading ? <Skeleton className="h-8 w-20" /> : (
                <div className="text-3xl font-bold text-amber-600 dark:text-amber-500">{summary?.pendingCases?.toLocaleString() || "0"}</div>
              )}
            </CardContent>
          </Card>
          
          <Card className="border-border shadow-sm bg-primary/5">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-primary uppercase tracking-wider">Pending Fees</CardTitle>
              <DollarSign className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              {summaryLoading ? <Skeleton className="h-8 w-24" /> : (
                <div className="text-3xl font-bold text-primary">
                  ${summary?.totalPendingFees?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || "0.00"}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Chart / Breakdown Area */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-border shadow-sm flex flex-col h-[400px]">
              <CardHeader className="border-b bg-muted/30">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="font-serif">Upcoming Hearings</CardTitle>
                    <CardDescription>Scheduled proceedings for the next 7 days</CardDescription>
                  </div>
                  <Link href="/hearings" className="text-sm text-primary hover:underline font-medium flex items-center">
                    View All <ChevronRight className="h-4 w-4 ml-1" />
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="flex-1 overflow-auto p-0">
                {hearingsLoading ? (
                  <div className="p-6 space-y-4">
                    {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {upcomingHearings?.length === 0 ? (
                      <div className="p-6 text-center text-muted-foreground">No upcoming hearings scheduled.</div>
                    ) : (
                      upcomingHearings?.slice(0, 5).map(hearing => (
                        <div key={hearing.id} className="p-4 hover:bg-muted/20 transition-colors flex items-center justify-between group cursor-pointer">
                          <div className="flex gap-4">
                            <div className="bg-primary/10 text-primary p-3 rounded-md flex flex-col items-center justify-center min-w-[70px]">
                              <span className="text-xs font-bold uppercase">{format(new Date(hearing.hearingDate), 'MMM')}</span>
                              <span className="text-xl font-bold leading-none">{format(new Date(hearing.hearingDate), 'dd')}</span>
                            </div>
                            <div>
                              <Link href={`/cases/${hearing.caseId}`} className="font-medium hover:text-primary hover:underline flex items-center gap-2">
                                {hearing.caseNumber}
                              </Link>
                              <div className="text-sm text-muted-foreground line-clamp-1">{hearing.caseTitle}</div>
                              <div className="text-xs mt-1 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-sm bg-muted text-muted-foreground font-medium">
                                <Clock className="h-3 w-3" /> {format(new Date(hearing.hearingDate), 'h:mm a')} • {hearing.courtRoom}
                              </div>
                            </div>
                          </div>
                          <Badge variant="outline">{hearing.hearingType}</Badge>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar / Feed Area */}
          <div className="space-y-6">
            <Card className="border-border shadow-sm h-[400px] flex flex-col">
              <CardHeader className="border-b bg-muted/30 py-4">
                <CardTitle className="font-serif text-lg">Recent Activity</CardTitle>
              </CardHeader>
              <CardContent className="flex-1 overflow-auto p-0">
                {activityLoading ? (
                  <div className="p-4 space-y-4">
                    {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-12 w-full" />)}
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {recentActivity?.length === 0 ? (
                      <div className="p-6 text-center text-muted-foreground">No recent activity.</div>
                    ) : (
                      recentActivity?.map(activity => (
                        <div key={activity.id} className="p-4 text-sm hover:bg-muted/10">
                          <div className="flex justify-between items-start mb-1">
                            <Link href={`/cases/${activity.caseId}`} className="font-semibold text-primary hover:underline">
                              {activity.caseNumber}
                            </Link>
                            <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                              {format(new Date(activity.timestamp), 'MMM d, h:mm a')}
                            </span>
                          </div>
                          <p className="text-foreground">{activity.action}</p>
                          <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                            <Users className="h-3 w-3" /> {activity.user}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}
