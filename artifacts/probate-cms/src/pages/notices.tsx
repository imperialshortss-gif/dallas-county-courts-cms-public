import { Layout } from "@/components/layout";
import { useListNotices, getListNoticesQueryKey } from "@workspace/api-client-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { format } from "date-fns";
import { BellRing, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Notices() {
  const { data: notices, isLoading } = useListNotices({}, {
    query: { queryKey: getListNoticesQueryKey({}) }
  });

  return (
    <Layout>
      <div className="flex flex-col gap-6 h-full">
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-serif font-bold text-foreground tracking-tight">Notices</h1>
            <p className="text-muted-foreground mt-1">Registry of issued court notices and summons.</p>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg shadow-sm flex-1 flex flex-col overflow-hidden">
          <div className="overflow-auto flex-1">
            <Table>
              <TableHeader className="bg-muted/50 sticky top-0 z-10">
                <TableRow>
                  <TableHead className="font-semibold text-foreground">Date Issued</TableHead>
                  <TableHead className="font-semibold text-foreground">Type</TableHead>
                  <TableHead className="font-semibold text-foreground">Title</TableHead>
                  <TableHead className="font-semibold text-foreground">Case</TableHead>
                  <TableHead className="font-semibold text-foreground">Issued By</TableHead>
                  <TableHead className="text-right font-semibold text-foreground">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 15 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-20 rounded-md" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-8 w-16 ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : notices?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <BellRing className="h-8 w-8 text-muted-foreground/50" />
                        <p>No notices found.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  notices?.map((notice) => (
                    <TableRow key={notice.id} className="hover:bg-muted/30 transition-colors">
                      <TableCell className="whitespace-nowrap font-medium">
                        {format(new Date(notice.issuedDate), 'MMM d, yyyy')}
                      </TableCell>
                      <TableCell>
                        <span className="bg-primary/10 text-primary border border-primary/20 px-2.5 py-1 rounded-sm text-xs font-medium">
                          {notice.noticeType}
                        </span>
                      </TableCell>
                      <TableCell className="font-medium text-foreground">
                        {notice.title}
                        {notice.content && (
                          <div className="text-xs text-muted-foreground line-clamp-1 mt-0.5 max-w-sm">
                            {notice.content}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Link href={`/cases/${notice.caseId}`} className="text-primary hover:underline font-medium text-sm">
                          Case #{notice.caseId}
                        </Link>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {notice.issuedBy}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">
                          <FileText className="h-4 w-4 mr-2" /> View
                        </Button>
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
