import { Layout } from "@/components/layout";
import { useListDocuments, getListDocumentsQueryKey } from "@workspace/api-client-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { format } from "date-fns";
import { FileUp, FileText, Download, FileArchive, FileImage } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Documents() {
  const { data: documents, isLoading } = useListDocuments({}, {
    query: { queryKey: getListDocumentsQueryKey({}) }
  });

  const getFileIcon = (fileType: string) => {
    if (fileType.includes("pdf")) return <FileText className="h-5 w-5 text-red-500" />;
    if (fileType.includes("zip") || fileType.includes("rar")) return <FileArchive className="h-5 w-5 text-amber-500" />;
    if (fileType.includes("image")) return <FileImage className="h-5 w-5 text-blue-500" />;
    return <FileText className="h-5 w-5 text-gray-500" />;
  };

  return (
    <Layout>
      <div className="flex flex-col gap-6 h-full">
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-serif font-bold text-foreground tracking-tight">Documents</h1>
            <p className="text-muted-foreground mt-1">Central repository of all uploaded case files.</p>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg shadow-sm flex-1 flex flex-col overflow-hidden">
          <div className="overflow-auto flex-1">
            <Table>
              <TableHeader className="bg-muted/50 sticky top-0 z-10">
                <TableRow>
                  <TableHead className="font-semibold text-foreground">File Name</TableHead>
                  <TableHead className="font-semibold text-foreground">Category</TableHead>
                  <TableHead className="font-semibold text-foreground">Case</TableHead>
                  <TableHead className="font-semibold text-foreground">Uploaded By</TableHead>
                  <TableHead className="font-semibold text-foreground">Date</TableHead>
                  <TableHead className="font-semibold text-foreground">Size</TableHead>
                  <TableHead className="text-right font-semibold text-foreground">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 15 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-24 rounded-md" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-8 w-10 ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : documents?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <FileUp className="h-8 w-8 text-muted-foreground/50" />
                        <p>No documents found.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  documents?.map((doc) => (
                    <TableRow key={doc.id} className="hover:bg-muted/30 transition-colors">
                      <TableCell>
                        <div className="flex items-center gap-3 font-medium text-foreground">
                          {getFileIcon(doc.fileType)}
                          {doc.fileName}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="bg-muted border border-border px-2 py-1 rounded text-xs">
                          {doc.category}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Link href={`/cases/${doc.caseId}`} className="text-primary hover:underline font-medium text-sm">
                          Case #{doc.caseId}
                        </Link>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {doc.uploadedBy}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-sm">
                        {format(new Date(doc.uploadedDate), 'MMM d, yyyy')}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {doc.sizeKb ? `${(doc.sizeKb / 1024).toFixed(1)} MB` : '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" title="Download">
                          <Download className="h-4 w-4 text-muted-foreground hover:text-foreground" />
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
