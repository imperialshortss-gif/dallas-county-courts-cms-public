import { Layout } from "@/components/layout";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Search, Filter, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AuditLogs() {
  const logs = [
    { id: "AL-8492", user: "Jane Clerk", action: "UPDATE_STATUS", target: "Case #PR-23-0145", ip: "10.0.12.45", date: "Oct 25, 2023 09:42:11 AM" },
    { id: "AL-8491", user: "System", action: "AUTO_NOTICE", target: "Case #PR-23-0089", ip: "localhost", date: "Oct 25, 2023 08:00:00 AM" },
    { id: "AL-8490", user: "Maria Garcia", action: "DELETE_DOCUMENT", target: "Doc #9942", ip: "10.0.8.22", date: "Oct 24, 2023 04:30:15 PM" },
    { id: "AL-8489", user: "Hon. Robert Smith", action: "ADD_NOTE", target: "Case #PR-23-0145", ip: "10.0.5.11", date: "Oct 24, 2023 02:15:44 PM" },
    { id: "AL-8488", user: "Jane Clerk", action: "CREATE_CASE", target: "Case #PR-23-0199", ip: "10.0.12.45", date: "Oct 24, 2023 11:20:05 AM" },
    { id: "AL-8487", user: "Jane Clerk", action: "USER_LOGIN", target: "System", ip: "10.0.12.45", date: "Oct 24, 2023 08:30:12 AM" },
  ];

  return (
    <Layout>
      <div className="flex flex-col gap-6 h-full">
        <div>
          <h1 className="text-3xl font-serif font-bold text-foreground tracking-tight">Audit Logs</h1>
          <p className="text-muted-foreground mt-1">Immutable record of all system activity for security and compliance.</p>
        </div>

        <div className="bg-card border border-border rounded-lg shadow-sm flex-1 flex flex-col overflow-hidden">
          <div className="px-4 py-3 border-b border-border flex flex-col sm:flex-row gap-4 sm:justify-between sm:items-center bg-muted/30">
            <div className="flex-1 max-w-md relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search logs by user, action, or target..." className="pl-9 h-9" />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="h-9 text-sm">
                <Filter className="h-4 w-4 mr-2" /> Filter
              </Button>
              <Button variant="outline" size="sm" className="h-9 text-sm">
                Export CSV
              </Button>
            </div>
          </div>
          
          <div className="overflow-auto flex-1">
            <Table>
              <TableHeader className="bg-muted/50 sticky top-0 z-10">
                <TableRow>
                  <TableHead className="font-semibold text-foreground">Log ID</TableHead>
                  <TableHead className="font-semibold text-foreground">Timestamp</TableHead>
                  <TableHead className="font-semibold text-foreground">User</TableHead>
                  <TableHead className="font-semibold text-foreground">Action</TableHead>
                  <TableHead className="font-semibold text-foreground">Target</TableHead>
                  <TableHead className="font-semibold text-foreground">IP Address</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id} className="hover:bg-muted/30 font-mono text-sm">
                    <TableCell className="text-muted-foreground">{log.id}</TableCell>
                    <TableCell className="whitespace-nowrap">{log.date}</TableCell>
                    <TableCell className="font-medium font-sans text-foreground">{log.user}</TableCell>
                    <TableCell>
                      <span className="bg-muted px-2 py-0.5 rounded text-xs font-semibold border border-border">
                        {log.action}
                      </span>
                    </TableCell>
                    <TableCell className="font-sans">{log.target}</TableCell>
                    <TableCell className="text-muted-foreground">{log.ip}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </Layout>
  );
}
