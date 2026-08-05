import { useState } from "react";
import { Layout } from "@/components/layout";
import { useListFees, useGetPendingFees, getListFeesQueryKey, getGetPendingFeesQueryKey } from "@workspace/api-client-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { format } from "date-fns";
import { StatusBadge } from "@/components/status-badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, AlertCircle, CheckCircle } from "lucide-react";

export default function Fees() {
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: pendingSummary, isLoading: summaryLoading } = useGetPendingFees({
    query: { queryKey: getGetPendingFeesQueryKey() }
  });

  const { data: fees, isLoading } = useListFees(
    { status: statusFilter === "all" ? undefined : statusFilter as any },
    { query: { queryKey: getListFeesQueryKey({ status: statusFilter === "all" ? undefined : statusFilter as any }) } }
  );

  return (
    <Layout>
      <div className="flex flex-col gap-6 h-full">
        <div>
          <h1 className="text-3xl font-serif font-bold text-foreground tracking-tight">Fees & Payments</h1>
          <p className="text-muted-foreground mt-1">Manage court fees, payments, and outstanding balances.</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="border-border shadow-sm bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-amber-800 dark:text-amber-500 uppercase tracking-wider">Total Pending Fees</CardTitle>
              <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-500" />
            </CardHeader>
            <CardContent>
              {summaryLoading ? <Skeleton className="h-8 w-32 bg-amber-200/50" /> : (
                <div className="text-3xl font-bold text-amber-700 dark:text-amber-500">
                  ${pendingSummary?.totalAmount?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || "0.00"}
                </div>
              )}
              <p className="text-xs text-amber-600/80 dark:text-amber-500/80 mt-1 font-medium">
                Across {pendingSummary?.casesWithPendingFees || 0} cases
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="bg-card border border-border rounded-lg shadow-sm flex-1 flex flex-col overflow-hidden">
          <div className="px-4 py-3 border-b border-border flex flex-col sm:flex-row gap-4 sm:justify-between sm:items-center bg-muted/30">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground">Status Filter:</span>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px] h-8 text-sm bg-background">
                  <SelectValue placeholder="All Fees" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Fees</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="waived">Waived</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="text-sm font-medium text-muted-foreground">
              {isLoading ? <Skeleton className="h-5 w-24 inline-block align-middle" /> : `${fees?.length || 0} fees listed`}
            </div>
          </div>
          
          <div className="overflow-auto flex-1">
            <Table>
              <TableHeader className="bg-muted/50 sticky top-0 z-10">
                <TableRow>
                  <TableHead className="font-semibold text-foreground">Case ID</TableHead>
                  <TableHead className="font-semibold text-foreground">Description</TableHead>
                  <TableHead className="font-semibold text-foreground">Amount</TableHead>
                  <TableHead className="font-semibold text-foreground">Status</TableHead>
                  <TableHead className="font-semibold text-foreground">Due Date</TableHead>
                  <TableHead className="font-semibold text-foreground">Paid Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 10 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    </TableRow>
                  ))
                ) : fees?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <DollarSign className="h-8 w-8 text-muted-foreground/50" />
                        <p>No fees found.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  fees?.map((fee) => (
                    <TableRow key={fee.id} className="hover:bg-muted/30 transition-colors">
                      <TableCell>
                        <Link href={`/cases/${fee.caseId}`} className="text-primary hover:underline font-medium">
                          Case #{fee.caseId}
                        </Link>
                      </TableCell>
                      <TableCell className="font-medium">{fee.description}</TableCell>
                      <TableCell>
                        <span className={fee.status === 'pending' ? "text-amber-600 font-bold" : ""}>
                          ${fee.amount.toFixed(2)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={fee.status} />
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <span className={fee.status === 'pending' && new Date(fee.dueDate) < new Date() ? "text-red-600 font-semibold" : ""}>
                          {format(new Date(fee.dueDate), 'MMM d, yyyy')}
                        </span>
                      </TableCell>
                      <TableCell className="text-muted-foreground whitespace-nowrap">
                        {fee.paidDate ? format(new Date(fee.paidDate), 'MMM d, yyyy') : '-'}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </Layout>
  );
}
