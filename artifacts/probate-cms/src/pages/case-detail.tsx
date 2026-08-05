import { useParams, useLocation } from "wouter";
import { Layout } from "@/components/layout";
import { useGetCase, getGetCaseQueryKey } from "@workspace/api-client-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/status-badge";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import {
  FileText, Users, Calendar, DollarSign, BellRing, FileUp,
  Clock, Plus, CreditCard, StickyNote, CalendarPlus, Info, CheckCircle2
} from "lucide-react";

function safeDate(val: string | null | undefined) {
  if (!val) return null;
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d;
}

function fmt(val: string | null | undefined, pattern = "MMM d, yyyy") {
  const d = safeDate(val);
  return d ? format(d, pattern) : "—";
}

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="font-medium text-foreground">{value || "—"}</p>
    </div>
  );
}

const activityIcon: Record<string, React.ReactNode> = {
  hearing: <Calendar className="h-4 w-4" />,
  fee: <DollarSign className="h-4 w-4" />,
  notice: <BellRing className="h-4 w-4" />,
  document: <FileUp className="h-4 w-4" />,
  party: <Users className="h-4 w-4" />,
  status: <CheckCircle2 className="h-4 w-4" />,
  note: <StickyNote className="h-4 w-4" />,
  case: <FileText className="h-4 w-4" />,
};

function activityIconFor(action: string) {
  const key = Object.keys(activityIcon).find(k => action.toLowerCase().includes(k));
  return key ? activityIcon[key] : <Clock className="h-4 w-4" />;
}

export default function CaseDetail() {
  const params = useParams();
  const [, navigate] = useLocation();
  const caseId = parseInt(params.id || "0", 10);

  const { data: caseDetail, isLoading } = useGetCase(caseId, {
    query: {
      enabled: !!caseId,
      queryKey: getGetCaseQueryKey(caseId),
    },
  });

  const goToUpdate = (tab?: string) => {
    navigate(`/cases/${caseId}/update${tab ? `?tab=${tab}` : ""}`);
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="space-y-6">
          <div className="space-y-2">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-6 w-96" />
          </div>
          <div className="flex gap-4">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10 w-32" />)}
          </div>
          <Card><CardContent className="p-6"><div className="grid grid-cols-2 md:grid-cols-4 gap-6">{Array.from({ length: 8 }).map((_, i) => <div key={i} className="space-y-2"><Skeleton className="h-4 w-24" /><Skeleton className="h-5 w-32" /></div>)}</div></CardContent></Card>
        </div>
      </Layout>
    );
  }

  if (!caseDetail) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center h-full text-center p-12">
          <FileText className="h-12 w-12 text-muted-foreground mb-4" />
          <h2 className="text-2xl font-bold">Case Not Found</h2>
          <p className="text-muted-foreground mt-2">The case you are looking for does not exist or you don't have permission to view it.</p>
        </div>
      </Layout>
    );
  }

  const activity: any[] = (caseDetail as any).activity ?? [];

  return (
    <Layout>
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-3xl font-serif font-bold text-foreground tracking-tight">{caseDetail.caseNumber}</h1>
              <StatusBadge status={caseDetail.status} className="text-sm px-3 py-1" />
            </div>
            <p className="text-lg text-muted-foreground font-medium">{caseDetail.title}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={() => goToUpdate()}>
              <Plus className="h-4 w-4 mr-2" /> Update Case
            </Button>
            <Button size="sm" variant="secondary" onClick={() => goToUpdate("documents")}>
              <FileUp className="h-4 w-4 mr-2" /> Upload Doc
            </Button>
            <Button size="sm" variant="secondary" onClick={() => goToUpdate("fees")}>
              <CreditCard className="h-4 w-4 mr-2" /> Payment
            </Button>
            <Button size="sm" variant="outline" onClick={() => goToUpdate("hearings")}>
              <CalendarPlus className="h-4 w-4 mr-2" /> Schedule Hearing
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="w-full justify-start border-b rounded-none h-12 bg-transparent p-0 overflow-x-auto">
            {[
              { value: "overview", label: "Overview", icon: <Info className="h-4 w-4" /> },
              { value: "parties", label: "Parties", count: caseDetail.parties.length },
              { value: "hearings", label: "Hearings", count: caseDetail.hearings.length },
              { value: "fees", label: "Fees", count: caseDetail.fees.length },
              { value: "notices", label: "Notices", count: caseDetail.notices.length },
              { value: "documents", label: "Documents", count: caseDetail.documents.length },
              { value: "activity", label: "Activity", count: activity.length },
            ].map(t => (
              <TabsTrigger
                key={t.value}
                value={t.value}
                className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-12 px-5 whitespace-nowrap"
              >
                {t.label}
                {t.count !== undefined && (
                  <span className="ml-2 bg-muted text-muted-foreground text-xs px-2 py-0.5 rounded-full">{t.count}</span>
                )}
              </TabsTrigger>
            ))}
          </TabsList>

          <div className="mt-6">

            {/* ── Overview ── */}
            <TabsContent value="overview" className="space-y-6 mt-0">
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg flex items-center gap-2"><Info className="h-4 w-4" /> Case Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-y-6 gap-x-4">
                    <Field label="Case Number" value={caseDetail.caseNumber} />
                    <Field label="File Number" value={caseDetail.fileNumber} />
                    <Field label="Status" value={caseDetail.status} />
                    <Field label="Case Type" value={caseDetail.caseType} />
                    <Field label="Category" value={caseDetail.caseCategory} />
                    <Field label="Stage" value={caseDetail.stage} />
                    <Field label="Court" value={caseDetail.courtName} />
                    <Field label="Presiding Officer" value={caseDetail.presidingOfficer} />
                    <Field label="Court Room" value={(caseDetail as any).courtRoom} />
                    <Field label="Filing Date" value={fmt(caseDetail.filingDate)} />
                    <Field label="Last Court Date" value={fmt(caseDetail.lastCourtDate)} />
                    <Field label="Next Court Date" value={fmt(caseDetail.nextCourtDate)} />
                  </div>
                  {(caseDetail as any).notes && (
                    <div className="mt-6 pt-6 border-t space-y-1">
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Notes</p>
                      <p className="text-sm text-foreground whitespace-pre-wrap">{(caseDetail as any).notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Fee summary on overview */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-muted/30">
                  <CardContent className="p-5">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Total Paid</p>
                    <p className="text-2xl font-bold">${caseDetail.fees.filter((f: any) => f.status === "paid").reduce((s: number, f: any) => s + f.amount, 0).toFixed(2)}</p>
                  </CardContent>
                </Card>
                <Card className="bg-primary/5 border-primary/20">
                  <CardContent className="p-5">
                    <p className="text-xs font-semibold uppercase tracking-wider text-primary mb-1">Pending Balance</p>
                    <p className="text-2xl font-bold text-primary">${Number(caseDetail.pendingFees ?? 0).toFixed(2)}</p>
                  </CardContent>
                </Card>
                <Card className="bg-muted/30">
                  <CardContent className="p-5">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Total Assessed</p>
                    <p className="text-2xl font-bold">${caseDetail.fees.reduce((s: number, f: any) => s + f.amount, 0).toFixed(2)}</p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* ── Parties ── */}
            <TabsContent value="parties" className="mt-0">
              <Card>
                <CardHeader className="pb-4 flex flex-row items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2"><Users className="h-4 w-4" /> Parties</CardTitle>
                  <Button variant="outline" size="sm" onClick={() => goToUpdate("parties")}>
                    <Plus className="h-4 w-4 mr-1" /> Add Party
                  </Button>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader className="bg-muted/50">
                      <TableRow>
                        <TableHead>Role</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Advocate / Attorney</TableHead>
                        <TableHead>Contact Info</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {caseDetail.parties.map((p: any) => (
                        <TableRow key={p.id}>
                          <TableCell className="font-medium">{p.role}</TableCell>
                          <TableCell>{p.name}</TableCell>
                          <TableCell>{p.advocate || "—"}</TableCell>
                          <TableCell className="text-muted-foreground">{p.contactInfo || "—"}</TableCell>
                        </TableRow>
                      ))}
                      {caseDetail.parties.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center text-muted-foreground py-8">No parties on record.</TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ── Hearings ── */}
            <TabsContent value="hearings" className="mt-0">
              <Card>
                <CardHeader className="pb-4 flex flex-row items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2"><Calendar className="h-4 w-4" /> Hearings & Dates</CardTitle>
                  <Button variant="outline" size="sm" onClick={() => goToUpdate("hearings")}>
                    <CalendarPlus className="h-4 w-4 mr-1" /> Schedule
                  </Button>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader className="bg-muted/50">
                      <TableRow>
                        <TableHead>Date & Time</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Court Room</TableHead>
                        <TableHead>Result</TableHead>
                        <TableHead>Notes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {caseDetail.hearings.map((h: any) => (
                        <TableRow key={h.id}>
                          <TableCell className="font-medium whitespace-nowrap">{fmt(h.hearingDate, "MMM d, yyyy h:mm a")}</TableCell>
                          <TableCell>{h.hearingType}</TableCell>
                          <TableCell>{h.courtRoom || "—"}</TableCell>
                          <TableCell>
                            {h.result ? <StatusBadge status={h.result === "Concluded" ? "closed" : "active"} className="capitalize" /> : <span className="text-muted-foreground">—</span>}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground max-w-xs truncate" title={h.notes || ""}>{h.notes || "—"}</TableCell>
                        </TableRow>
                      ))}
                      {caseDetail.hearings.length === 0 && (
                        <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No hearings on record.</TableCell></TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ── Fees ── */}
            <TabsContent value="fees" className="space-y-6 mt-0">
              <Card>
                <CardHeader className="pb-4 flex flex-row items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2"><DollarSign className="h-4 w-4" /> Fee Schedule</CardTitle>
                  <Button variant="outline" size="sm" onClick={() => goToUpdate("fees")}>
                    <Plus className="h-4 w-4 mr-1" /> Assess Fee
                  </Button>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader className="bg-muted/50">
                      <TableRow>
                        <TableHead>Description</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Due Date</TableHead>
                        <TableHead>Paid Date</TableHead>
                        <TableHead>Receipt #</TableHead>
                        <TableHead>Notes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {caseDetail.fees.map((f: any) => (
                        <TableRow key={f.id}>
                          <TableCell className="font-medium">{f.description}</TableCell>
                          <TableCell>${Number(f.amount).toFixed(2)}</TableCell>
                          <TableCell><StatusBadge status={f.status} /></TableCell>
                          <TableCell>{fmt(f.dueDate)}</TableCell>
                          <TableCell className="text-muted-foreground">{fmt(f.paidDate)}</TableCell>
                          <TableCell className="text-muted-foreground font-mono text-sm">{f.receiptNumber || "—"}</TableCell>
                          <TableCell className="text-sm text-muted-foreground max-w-xs truncate" title={f.notes || ""}>{f.notes || "—"}</TableCell>
                        </TableRow>
                      ))}
                      {caseDetail.fees.length === 0 && (
                        <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No fees assessed.</TableCell></TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ── Notices ── */}
            <TabsContent value="notices" className="mt-0">
              <Card>
                <CardHeader className="pb-4 flex flex-row items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2"><BellRing className="h-4 w-4" /> Notices & Orders</CardTitle>
                  <Button variant="outline" size="sm" onClick={() => goToUpdate("notices")}>
                    <Plus className="h-4 w-4 mr-1" /> Issue Notice
                  </Button>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader className="bg-muted/50">
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Title</TableHead>
                        <TableHead>Issued By</TableHead>
                        <TableHead>Notes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {caseDetail.notices.map((n: any) => (
                        <TableRow key={n.id}>
                          <TableCell className="whitespace-nowrap">{fmt(n.issuedDate)}</TableCell>
                          <TableCell><span className="bg-muted px-2 py-1 rounded text-xs">{n.noticeType}</span></TableCell>
                          <TableCell className="font-medium">{n.title}</TableCell>
                          <TableCell>{n.issuedBy}</TableCell>
                          <TableCell className="text-sm text-muted-foreground max-w-xs truncate" title={n.notes || ""}>{n.notes || "—"}</TableCell>
                        </TableRow>
                      ))}
                      {caseDetail.notices.length === 0 && (
                        <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No notices issued.</TableCell></TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ── Documents ── */}
            <TabsContent value="documents" className="mt-0">
              <Card>
                <CardHeader className="pb-4 flex flex-row items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2"><FileText className="h-4 w-4" /> Documents</CardTitle>
                  <Button variant="outline" size="sm" onClick={() => goToUpdate("documents")}>
                    <FileUp className="h-4 w-4 mr-1" /> Upload
                  </Button>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader className="bg-muted/50">
                      <TableRow>
                        <TableHead>File Name</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Uploaded By</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Size</TableHead>
                        <TableHead>Notes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {caseDetail.documents.map((doc: any) => (
                        <TableRow key={doc.id}>
                          <TableCell className="font-medium">
                            <span className="flex items-center gap-2"><FileText className="h-4 w-4 text-primary shrink-0" />{doc.fileName}</span>
                          </TableCell>
                          <TableCell>{doc.fileType}</TableCell>
                          <TableCell>{doc.category}</TableCell>
                          <TableCell>{doc.uploadedBy}</TableCell>
                          <TableCell className="whitespace-nowrap">{fmt(doc.uploadedDate)}</TableCell>
                          <TableCell className="text-muted-foreground">{doc.sizeKb ? `${(doc.sizeKb / 1024).toFixed(1)} MB` : "—"}</TableCell>
                          <TableCell className="text-sm text-muted-foreground max-w-xs truncate" title={doc.notes || ""}>{doc.notes || "—"}</TableCell>
                        </TableRow>
                      ))}
                      {caseDetail.documents.length === 0 && (
                        <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No documents uploaded.</TableCell></TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ── Activity ── */}
            <TabsContent value="activity" className="mt-0">
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg flex items-center gap-2"><Clock className="h-4 w-4" /> Activity Log</CardTitle>
                </CardHeader>
                <CardContent>
                  {activity.length === 0 ? (
                    <div className="text-center text-muted-foreground py-10">No activity recorded yet.</div>
                  ) : (
                    <div className="relative space-y-0">
                      <div className="absolute left-5 top-0 bottom-0 w-px bg-border" />
                      {[...activity].reverse().map((a: any, idx: number) => (
                        <div key={a.id ?? idx} className="relative flex items-start gap-4 pl-12 pb-6">
                          <div className="absolute left-0 flex items-center justify-center w-10 h-10 rounded-full bg-muted border border-border text-muted-foreground z-10">
                            {activityIconFor(a.action)}
                          </div>
                          <div className="flex-1 min-w-0 rounded-md border border-border bg-card shadow-sm p-4">
                            <div className="flex items-center justify-between gap-2 mb-1 flex-wrap">
                              <span className="font-semibold text-sm">{a.user}</span>
                              <span className="text-xs text-muted-foreground whitespace-nowrap">
                                {a.timestamp ? format(new Date(a.timestamp), "MMM d, yyyy h:mm a") : ""}
                              </span>
                            </div>
                            <p className="text-sm font-medium text-foreground">{a.action}</p>
                            {a.details && <p className="text-sm text-muted-foreground mt-0.5">{a.details}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

          </div>
        </Tabs>
      </div>
    </Layout>
  );
}
