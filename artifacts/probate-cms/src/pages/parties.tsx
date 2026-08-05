import { Layout } from "@/components/layout";
import { useListParties, getListPartiesQueryKey } from "@workspace/api-client-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";

export default function Parties() {
  const { data: parties, isLoading } = useListParties({}, {
    query: {
      queryKey: getListPartiesQueryKey({})
    }
  });

  return (
    <Layout>
      <div className="flex flex-col gap-6 h-full">
        <div>
          <h1 className="text-3xl font-serif font-bold text-foreground tracking-tight">Parties</h1>
          <p className="text-muted-foreground mt-1">Directory of all parties associated with cases.</p>
        </div>

        <div className="bg-card border border-border rounded-lg shadow-sm flex-1 flex flex-col overflow-hidden">
          <div className="overflow-auto flex-1">
            <Table>
              <TableHeader className="bg-muted/50 sticky top-0 z-10">
                <TableRow>
                  <TableHead className="font-semibold text-foreground">Name</TableHead>
                  <TableHead className="font-semibold text-foreground">Role</TableHead>
                  <TableHead className="font-semibold text-foreground">Case</TableHead>
                  <TableHead className="font-semibold text-foreground">Advocate</TableHead>
                  <TableHead className="font-semibold text-foreground">Contact Info</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 15 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-24 rounded-full" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                    </TableRow>
                  ))
                ) : parties?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                      No parties found.
                    </TableCell>
                  </TableRow>
                ) : (
                  parties?.map((party) => (
                    <TableRow key={party.id} className="hover:bg-muted/30 transition-colors">
                      <TableCell className="font-medium">{party.name}</TableCell>
                      <TableCell>
                        <span className="bg-muted px-2 py-1 rounded text-xs font-medium">
                          {party.role}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Link href={`/cases/${party.caseId}`} className="text-primary hover:underline">
                          View Case {party.caseId}
                        </Link>
                      </TableCell>
                      <TableCell>{party.advocate}</TableCell>
                      <TableCell className="text-muted-foreground">{party.contactInfo || '-'}</TableCell>
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
