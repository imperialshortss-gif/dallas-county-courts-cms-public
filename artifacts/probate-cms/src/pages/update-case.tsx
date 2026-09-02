import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { Layout } from "@/components/layout";
import { StatusBadge } from "@/components/status-badge";
import {
  useGetCase, getGetCaseQueryKey,
  useListCases, getListCasesQueryKey,
  useCreateHearing,
  useCreateFee,
  useCreateNotice,
  useCreateDocument,
  useCreateActivity,
  useUpdateCase,
  CaseDetail,
} from "@workspace/api-client-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import {
  Search, CalendarPlus, DollarSign, BellRing, FileUp,
  CheckCircle2, AlertCircle, Clock, ArrowLeft, FileText,
  ChevronRight, Gavel, ClipboardList
} from "lucide-react";
import { cn } from "@/lib/utils";

const UPDATED_BY = "Court Staff";

function CaseSearchPanel({ onSelect }: { onSelect: (id: number) => void }) {
  const [query, setQuery] = useState("");
  const [searchType, setSearchType] = useState<"caseNumber" | "fileNumber" | "partyName">("caseNumber");
  const [submitted, setSubmitted] = useState(false);

  const { data: result, isLoading } = useListCases(
    { query, searchType, pageSize: 10 },
    { query: { enabled: submitted && query.length > 0, queryKey: getListCasesQueryKey({ query, searchType }) } }
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle className="text-lg">Select Case to Update</CardTitle>
        <CardDescription>Search by case number, file number, or party name</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleSearch} className="flex gap-2">
          <Select value={searchType} onValueChange={(v) => { setSearchType(v as any); setSubmitted(false); }}>
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="caseNumber">Case Number</SelectItem>
              <SelectItem value="fileNumber">File Number</SelectItem>
              <SelectItem value="partyName">Party Name</SelectItem>
            </SelectContent>
          </Select>
          <Input
            value={query}
            onChange={(e) => { setQuery(e.target.value); setSubmitted(false); }}
            placeholder="Enter search terms..."
            className="flex-1"
          />
          <Button type="submit" disabled={isLoading || !query.trim()}>
            <Search className="h-4 w-4 mr-2" /> Search
          </Button>
        </form>

        {isLoading && (
          <div className="space-y-2">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-14 w-full" />)}
          </div>
        )}

        {submitted && result && result.cases.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No cases found. Try a different search term.</p>
          </div>
        )}

        {result && result.cases.length > 0 && (
          <div className="divide-y rounded-md border overflow-hidden">
            {result.cases.map(c => (
              <button
                key={c.id}
                onClick={() => onSelect(c.id)}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors text-left group"
              >
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-semibold text-sm font-mono">{c.caseNumber}</span>
                    <StatusBadge status={c.status} className="text-xs" />
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-1">{c.title}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors flex-shrink-0" />
              </button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function CaseSummaryBanner({ caseDetail }: { caseDetail: CaseDetail }) {
  return (
    <Card className="border-l-4 border-l-primary bg-primary/5">
      <CardContent className="py-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono font-bold text-primary">{caseDetail.caseNumber}</span>
              <StatusBadge status={caseDetail.status} />
            </div>
            <p className="text-sm font-medium">{caseDetail.title}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{caseDetail.courtName} · {caseDetail.presidingOfficer}</p>
          </div>
          <div className="flex gap-6 text-sm">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Last Hearing</p>
              <p className="font-medium">{caseDetail.lastCourtDate ? format(new Date(caseDetail.lastCourtDate), 'MMM d, yyyy') : 'None'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Pending Fees</p>
              <p className={cn("font-bold", (caseDetail.pendingFees ?? 0) > 0 ? "text-amber-600" : "text-green-600")}>
                ${caseDetail.pendingFees?.toFixed(2) ?? "0.00"}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Last Notice</p>
              <p className="font-medium text-xs max-w-[160px] truncate">{caseDetail.lastNotice ?? 'None'}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function HearingUpdateTab({ caseDetail }: { caseDetail: CaseDetail }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const mutation = useCreateHearing();

  const [form, setForm] = useState({
    hearingDate: "",
    hearingType: "",
    courtRoom: caseDetail.courtName,
    result: "Scheduled",
    notes: "",
  });

  const update = (field: string, val: string) => setForm(prev => ({ ...prev, [field]: val }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.hearingDate || !form.hearingType || !form.courtRoom) {
      toast({ title: "Validation Error", description: "Please fill in all required fields.", variant: "destructive" });
      return;
    }
    mutation.mutate(
      {
        data: {
          caseId: caseDetail.id,
          caseNumber: caseDetail.caseNumber,
          caseTitle: caseDetail.title,
          hearingDate: form.hearingDate,
          hearingType: form.hearingType,
          courtRoom: form.courtRoom,
          result: form.result,
          notes: form.notes || null,
          updatedBy: UPDATED_BY,
        } as any,
      },
      {
        onSuccess: () => {
          toast({ title: "Hearing Recorded", description: "The hearing has been added and the case updated." });
          setForm({ hearingDate: "", hearingType: "", courtRoom: caseDetail.courtName, result: "Scheduled", notes: "" });
          qc.invalidateQueries({ queryKey: getGetCaseQueryKey(caseDetail.id) });
        },
        onError: () => {
          toast({ title: "Error", description: "Failed to record hearing.", variant: "destructive" });
        },
      }
    );
  };

  const sorted = [...caseDetail.hearings].sort((a, b) => new Date(b.hearingDate).getTime() - new Date(a.hearingDate).getTime());
  const today = new Date().toISOString().split("T")[0];
  const past = sorted.filter(h => h.hearingDate <= today);
  const upcoming = sorted.filter(h => h.hearingDate > today);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base flex items-center gap-2">
            <CalendarPlus className="h-4 w-4 text-primary" /> Record / Schedule Hearing
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Hearing Date <span className="text-red-500">*</span></Label>
              <Input type="date" value={form.hearingDate} onChange={e => update("hearingDate", e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label>Hearing Type <span className="text-red-500">*</span></Label>
              <Select value={form.hearingType} onValueChange={v => update("hearingType", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type…" />
                </SelectTrigger>
                <SelectContent>
                  {["Application Hearing", "Inventory & Appraisement", "Inventory Approval", "Annual Review Hearing",
                    "Final Account Hearing", "Status Hearing", "Contested Hearing", "Pre-Trial Conference",
                    "Emergency Hearing", "Commitment Hearing", "Show Cause Hearing", "Other"].map(t => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Court Room <span className="text-red-500">*</span></Label>
              <Select value={form.courtRoom} onValueChange={v => update("courtRoom", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select courtroom…" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Court 1 – Rm 220">Court 1 – Rm 220</SelectItem>
                  <SelectItem value="Court 2 – Rm 315">Court 2 – Rm 315</SelectItem>
                  <SelectItem value="Court 3 – Rm 410">Court 3 – Rm 410</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Outcome / Result</Label>
              <Select value={form.result} onValueChange={v => update("result", v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["Scheduled", "Granted", "Denied", "Continued", "Approved", "Contested",
                    "Judgment Reserved", "Settled", "Dismissed", "Other"].map(r => (
                    <SelectItem key={r} value={r}>{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label>Notes / Details</Label>
              <Textarea value={form.notes} onChange={e => update("notes", e.target.value)} rows={3}
                placeholder="Any additional notes about this hearing…" />
            </div>
            <div className="md:col-span-2 flex justify-end">
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? "Saving…" : "Save Hearing"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {upcoming.length > 0 && (
        <Card className="border-blue-200 bg-blue-50/40">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-blue-700 flex items-center gap-2">
              <Clock className="h-4 w-4" /> Upcoming Hearings
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-blue-50">
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Court Room</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {upcoming.map(h => (
                  <TableRow key={h.id} className="bg-blue-50/20">
                    <TableCell className="font-medium">{format(new Date(h.hearingDate), 'MMM d, yyyy')}</TableCell>
                    <TableCell>{h.hearingType}</TableCell>
                    <TableCell>{h.courtRoom}</TableCell>
                    <TableCell><span className="text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-700">{h.result}</span></TableCell>
                    <TableCell className="text-muted-foreground text-sm">{h.notes ?? '–'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
            <Gavel className="h-4 w-4" /> Previous Hearings ({past.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Court Room</TableHead>
                <TableHead>Result</TableHead>
                <TableHead>Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {past.map(h => (
                <TableRow key={h.id}>
                  <TableCell>{format(new Date(h.hearingDate), 'MMM d, yyyy')}</TableCell>
                  <TableCell>{h.hearingType}</TableCell>
                  <TableCell>{h.courtRoom}</TableCell>
                  <TableCell>
                    <span className={cn("text-xs px-2 py-0.5 rounded",
                      h.result === "Granted" || h.result === "Approved" ? "bg-green-100 text-green-700" :
                      h.result === "Continued" ? "bg-yellow-100 text-yellow-700" :
                      h.result === "Contested" ? "bg-red-100 text-red-700" : "bg-muted text-muted-foreground"
                    )}>{h.result}</span>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm max-w-xs truncate">{h.notes ?? '–'}</TableCell>
                </TableRow>
              ))}
              {past.length === 0 && (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-6">No previous hearings.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function FeeUpdateTab({ caseDetail }: { caseDetail: CaseDetail }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const mutation = useCreateFee();

  const [form, setForm] = useState({
    description: "",
    feeCategory: "",
    amount: "",
    status: "paid" as "paid" | "pending" | "waived",
    dueDate: new Date().toISOString().split("T")[0],
    paidDate: new Date().toISOString().split("T")[0],
    receiptNumber: "",
  });

  const update = (field: string, val: string) => setForm(prev => ({ ...prev, [field]: val }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.description || !form.amount || isNaN(parseFloat(form.amount))) {
      toast({ title: "Validation Error", description: "Please fill in description and a valid amount.", variant: "destructive" });
      return;
    }
    const fullDescription = form.feeCategory ? `${form.feeCategory} – ${form.description}` : form.description;
    mutation.mutate(
      {
        data: {
          caseId: caseDetail.id,
          description: fullDescription,
          amount: parseFloat(form.amount),
          status: form.status,
          dueDate: form.dueDate,
          paidDate: form.status === "paid" ? form.paidDate : null,
          receiptNumber: form.receiptNumber || null,
          updatedBy: UPDATED_BY,
        } as any,
      },
      {
        onSuccess: () => {
          toast({ title: "Fee Recorded", description: `$${parseFloat(form.amount).toFixed(2)} fee has been saved.` });
          setForm({ description: "", feeCategory: "", amount: "", status: "paid", dueDate: new Date().toISOString().split("T")[0], paidDate: new Date().toISOString().split("T")[0], receiptNumber: "" });
          qc.invalidateQueries({ queryKey: getGetCaseQueryKey(caseDetail.id) });
        },
        onError: () => toast({ title: "Error", description: "Failed to record fee.", variant: "destructive" }),
      }
    );
  };

  const paid = caseDetail.fees.filter(f => f.status === "paid");
  const pending = caseDetail.fees.filter(f => f.status === "pending");
  const totalPaid = paid.reduce((s, f) => s + f.amount, 0);
  const totalPending = pending.reduce((s, f) => s + f.amount, 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4">
            <p className="text-xs font-semibold uppercase text-green-700 mb-1">Total Paid</p>
            <p className="text-2xl font-bold text-green-800">${totalPaid.toFixed(2)}</p>
            <p className="text-xs text-green-600 mt-1">{paid.length} record{paid.length !== 1 ? "s" : ""}</p>
          </CardContent>
        </Card>
        <Card className={cn("border-2", totalPending > 0 ? "bg-amber-50 border-amber-300" : "bg-muted border-transparent")}>
          <CardContent className="p-4">
            <p className={cn("text-xs font-semibold uppercase mb-1", totalPending > 0 ? "text-amber-700" : "text-muted-foreground")}>Pending Balance</p>
            <p className={cn("text-2xl font-bold", totalPending > 0 ? "text-amber-800" : "text-foreground")}>${totalPending.toFixed(2)}</p>
            <p className={cn("text-xs mt-1", totalPending > 0 ? "text-amber-600" : "text-muted-foreground")}>{pending.length} unpaid</p>
          </CardContent>
        </Card>
        <Card className="bg-muted/40">
          <CardContent className="p-4">
            <p className="text-xs font-semibold uppercase text-muted-foreground mb-1">Total Assessed</p>
            <p className="text-2xl font-bold">${(totalPaid + totalPending).toFixed(2)}</p>
            <p className="text-xs text-muted-foreground mt-1">{caseDetail.fees.length} records</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-primary" /> Record Fee / Payment
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Fee Category</Label>
              <Select value={form.feeCategory} onValueChange={v => update("feeCategory", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category…" />
                </SelectTrigger>
                <SelectContent>
                  {["Filing Fee", "Letters Fee", "Annual Report Fee", "Hearing Fee", "Citation Fee",
                    "Publication Fee", "Accounting Fee", "Certified Copy Fee", "Other"].map(c => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Description <span className="text-red-500">*</span></Label>
              <Input value={form.description} onChange={e => update("description", e.target.value)}
                placeholder="Brief description of this fee…" required />
            </div>
            <div className="space-y-1.5">
              <Label>Amount ($) <span className="text-red-500">*</span></Label>
              <Input type="number" min="0" step="0.01" value={form.amount} onChange={e => update("amount", e.target.value)}
                placeholder="0.00" required />
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={v => update("status", v as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="waived">Waived</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Due Date</Label>
              <Input type="date" value={form.dueDate} onChange={e => update("dueDate", e.target.value)} />
            </div>
            {form.status === "paid" && (
              <div className="space-y-1.5">
                <Label>Payment Date</Label>
                <Input type="date" value={form.paidDate} onChange={e => update("paidDate", e.target.value)} />
              </div>
            )}
            {form.status === "paid" && (
              <div className="space-y-1.5">
                <Label>Receipt Number</Label>
                <Input value={form.receiptNumber} onChange={e => update("receiptNumber", e.target.value)}
                  placeholder="e.g. RCP-2024-1234" className="font-mono" />
              </div>
            )}
            <div className="md:col-span-2 flex justify-end">
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? "Saving…" : "Save Fee Record"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {pending.length > 0 && (
        <Card className="border-amber-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-amber-700 flex items-center gap-2">
              <AlertCircle className="h-4 w-4" /> Pending Fees
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-amber-50">
                <TableRow>
                  <TableHead>Description</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Due Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pending.map(f => (
                  <TableRow key={f.id} className="bg-amber-50/30">
                    <TableCell className="font-medium">{f.description}</TableCell>
                    <TableCell className="text-amber-700 font-bold">${f.amount.toFixed(2)}</TableCell>
                    <TableCell>{format(new Date(f.dueDate), 'MMM d, yyyy')}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-muted-foreground">Fee History ({paid.length} paid)</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead>Description</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Paid Date</TableHead>
                <TableHead>Receipt</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paid.map(f => (
                <TableRow key={f.id}>
                  <TableCell>{f.description}</TableCell>
                  <TableCell className="text-green-700 font-medium">${f.amount.toFixed(2)}</TableCell>
                  <TableCell>{f.paidDate ? format(new Date(f.paidDate), 'MMM d, yyyy') : '–'}</TableCell>
                  <TableCell className="font-mono text-sm text-muted-foreground">{f.receiptNumber ?? '–'}</TableCell>
                </TableRow>
              ))}
              {paid.length === 0 && (
                <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-4">No paid fees.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function NoticeUpdateTab({ caseDetail }: { caseDetail: CaseDetail }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const mutation = useCreateNotice();

  const [form, setForm] = useState({
    title: "",
    issuedDate: new Date().toISOString().split("T")[0],
    noticeType: "",
    issuedBy: "",
    content: "",
  });

  const update = (field: string, val: string) => setForm(prev => ({ ...prev, [field]: val }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.noticeType || !form.issuedBy) {
      toast({ title: "Validation Error", description: "Please fill in all required fields.", variant: "destructive" });
      return;
    }
    mutation.mutate(
      {
        data: {
          caseId: caseDetail.id,
          title: form.title,
          issuedDate: form.issuedDate,
          noticeType: form.noticeType,
          issuedBy: form.issuedBy,
          content: form.content || null,
          updatedBy: UPDATED_BY,
        } as any,
      },
      {
        onSuccess: () => {
          toast({ title: "Notice Issued", description: "The notice has been recorded." });
          setForm({ title: "", issuedDate: new Date().toISOString().split("T")[0], noticeType: "", issuedBy: "", content: "" });
          qc.invalidateQueries({ queryKey: getGetCaseQueryKey(caseDetail.id) });
        },
        onError: () => toast({ title: "Error", description: "Failed to issue notice.", variant: "destructive" }),
      }
    );
  };

  const sorted = [...caseDetail.notices].sort((a, b) => new Date(b.issuedDate).getTime() - new Date(a.issuedDate).getTime());
  const recent = sorted.slice(0, 3);
  const previous = sorted.slice(3);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base flex items-center gap-2">
            <BellRing className="h-4 w-4 text-primary" /> Issue New Court Notice
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5 md:col-span-2">
              <Label>Notice Title <span className="text-red-500">*</span></Label>
              <Input value={form.title} onChange={e => update("title", e.target.value)}
                placeholder="e.g. Notice of Hearing – Inventory Approval" required />
            </div>
            <div className="space-y-1.5">
              <Label>Notice Type <span className="text-red-500">*</span></Label>
              <Select value={form.noticeType} onValueChange={v => update("noticeType", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type…" />
                </SelectTrigger>
                <SelectContent>
                  {["Hearing Notice", "Court Order", "Citation", "Summons", "Directive", "Compliance Notice",
                    "Creditor Notice", "Medical Notice", "Order", "Final Decree", "Other"].map(t => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Issued Date</Label>
              <Input type="date" value={form.issuedDate} onChange={e => update("issuedDate", e.target.value)} />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label>Issued By <span className="text-red-500">*</span></Label>
              <Select value={form.issuedBy} onValueChange={v => update("issuedBy", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select issuing authority…" />
                </SelectTrigger>
                <SelectContent>
                  {["Hon. Margaret L. Chen", "Hon. David A. Ruiz", "Hon. Patricia M. Nguyen",
                    "Court Administrator", "Court Clerk", "County Counsel Office"].map(i => (
                    <SelectItem key={i} value={i}>{i}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label>Notice Content / Details</Label>
              <Textarea value={form.content} onChange={e => update("content", e.target.value)} rows={4}
                placeholder="Full text of the notice…" />
            </div>
            <div className="md:col-span-2 flex justify-end">
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? "Saving…" : "Issue Notice"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {recent.length > 0 && (
        <Card className="border-primary/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-primary">Recent Notices</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recent.map(n => (
              <div key={n.id} className="border rounded-md p-4 bg-primary/5">
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2 py-0.5 rounded bg-primary/10 text-primary font-medium">{n.noticeType}</span>
                    <span className="text-xs text-muted-foreground">{format(new Date(n.issuedDate), 'MMM d, yyyy')}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{n.issuedBy}</span>
                </div>
                <p className="font-semibold text-sm">{n.title}</p>
                {n.content && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{n.content}</p>}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {previous.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-muted-foreground">Previous Notices ({previous.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Issued By</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {previous.map(n => (
                  <TableRow key={n.id}>
                    <TableCell className="whitespace-nowrap">{format(new Date(n.issuedDate), 'MMM d, yyyy')}</TableCell>
                    <TableCell><span className="text-xs bg-muted px-2 py-0.5 rounded">{n.noticeType}</span></TableCell>
                    <TableCell className="font-medium">{n.title}</TableCell>
                    <TableCell className="text-muted-foreground">{n.issuedBy}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function StatusUpdateTab({ caseDetail }: { caseDetail: CaseDetail }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const updateCaseMutation = useUpdateCase();
  const activityMutation = useCreateActivity();

  const [newStatus, setNewStatus] = useState(caseDetail.status);
  const [newStage, setNewStage] = useState(caseDetail.stage);
  const [newPresidingOfficer, setNewPresidingOfficer] = useState(caseDetail.presidingOfficer);
  const [nextCourtDate, setNextCourtDate] = useState(caseDetail.nextCourtDate ?? "");
  const [reason, setReason] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const statusChanged = newStatus !== caseDetail.status;
    const changes: string[] = [];
    if (statusChanged) changes.push(`Status: ${caseDetail.status} → ${newStatus}`);
    if (newStage !== caseDetail.stage) changes.push(`Stage: ${caseDetail.stage} → ${newStage}`);
    if (newPresidingOfficer !== caseDetail.presidingOfficer) changes.push(`Presiding Officer changed`);
    if (nextCourtDate !== (caseDetail.nextCourtDate ?? "")) changes.push(`Next Court Date: ${nextCourtDate || "Not Decided"}`);

    if (changes.length === 0) {
      toast({ title: "No Changes", description: "No fields were modified." });
      return;
    }

    updateCaseMutation.mutate(
      {
        id: caseDetail.id,
        data: {
          status: newStatus as any,
          stage: newStage,
          presidingOfficer: newPresidingOfficer,
          nextCourtDate: nextCourtDate || null,
        },
      },
      {
        onSuccess: async () => {
          await activityMutation.mutateAsync({
            data: {
              caseId: caseDetail.id,
              caseNumber: caseDetail.caseNumber,
              action: statusChanged ? `Status Changed to ${newStatus}` : "Case Updated",
              user: UPDATED_BY,
              details: [reason, ...changes].filter(Boolean).join(" | ") || null,
            } as any,
          });
          toast({ title: "Case Updated", description: `${changes.join(", ")} successfully saved.` });
          setReason("");
          qc.invalidateQueries({ queryKey: getGetCaseQueryKey(caseDetail.id) });
        },
        onError: () => toast({ title: "Error", description: "Failed to update case.", variant: "destructive" }),
      }
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base flex items-center gap-2">
            <ClipboardList className="h-4 w-4 text-primary" /> Update Case Status &amp; Details
          </CardTitle>
          <CardDescription>Changes are automatically logged in the activity timeline.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex items-center gap-3 p-3 bg-muted/50 rounded-md">
            <span className="text-sm text-muted-foreground">Current status:</span>
            <StatusBadge status={caseDetail.status} />
            <span className="text-sm text-muted-foreground">Stage: <strong>{caseDetail.stage}</strong></span>
          </div>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>New Case Status</Label>
              <Select value={newStatus} onValueChange={v => setNewStatus(v as "Active" | "Closed" | "Pending")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["Active", "Pending", "Closed"].map(s => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Stage</Label>
              <Select value={newStage} onValueChange={v => setNewStage(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["Application Filed", "Administration", "Annual Review", "Accounting", "Contested Proceedings",
                    "Evaluation Ordered", "Hearing Scheduled", "Discovery", "Pre-Trial", "Judgment Reserved",
                    "Letters Issued", "Final Account", "Final Discharge", "Home Study Ordered", "Other"].map(s => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Presiding Officer</Label>
              <Select value={newPresidingOfficer} onValueChange={v => setNewPresidingOfficer(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["Hon. Margaret L. Chen", "Hon. David A. Ruiz", "Hon. Patricia M. Nguyen"].map(j => (
                    <SelectItem key={j} value={j}>{j}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Next Court Date</Label>
              <Input type="date" value={nextCourtDate} onChange={e => setNextCourtDate(e.target.value)} />
              <p className="text-xs text-muted-foreground">Leave blank for "Not Decided Yet"</p>
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label>Reason / Notes for this Update</Label>
              <Textarea value={reason} onChange={e => setReason(e.target.value)} rows={3}
                placeholder="Optional: explain the reason for this status change…" />
            </div>
            <div className="md:col-span-2 flex justify-end">
              <Button type="submit" disabled={updateCaseMutation.isPending || activityMutation.isPending}>
                {updateCaseMutation.isPending ? "Saving…" : "Save Changes"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function DocumentsTab({ caseDetail }: { caseDetail: CaseDetail }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const mutation = useCreateDocument();

  const [form, setForm] = useState({
    fileName: "",
    fileType: "PDF",
    category: "",
    uploadedBy: "",
    sizeKb: "",
  });

  const update = (field: string, val: string) => setForm(prev => ({ ...prev, [field]: val }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.fileName || !form.category || !form.uploadedBy) {
      toast({ title: "Validation Error", description: "Please fill in all required fields.", variant: "destructive" });
      return;
    }
    mutation.mutate(
      {
        data: {
          caseId: caseDetail.id,
          fileName: form.fileName,
          fileType: form.fileType,
          uploadedBy: form.uploadedBy,
          uploadedDate: new Date().toISOString().split("T")[0],
          category: form.category,
          sizeKb: parseInt(form.sizeKb || "0", 10),
        },
      },
      {
        onSuccess: () => {
          toast({ title: "Document Recorded", description: `${form.fileName} has been added.` });
          setForm({ fileName: "", fileType: "PDF", category: "", uploadedBy: "", sizeKb: "" });
          qc.invalidateQueries({ queryKey: getGetCaseQueryKey(caseDetail.id) });
        },
        onError: () => toast({ title: "Error", description: "Failed to record document.", variant: "destructive" }),
      }
    );
  };

  const sorted = [...caseDetail.documents].sort((a, b) => new Date(b.uploadedDate).getTime() - new Date(a.uploadedDate).getTime());

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base flex items-center gap-2">
            <FileUp className="h-4 w-4 text-primary" /> Register New Document
          </CardTitle>
          <CardDescription>Record document metadata. All existing documents are preserved.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5 md:col-span-2">
              <Label>File Name <span className="text-red-500">*</span></Label>
              <Input value={form.fileName} onChange={e => update("fileName", e.target.value)}
                placeholder="e.g. Final_Account_Whitfield.pdf" required />
            </div>
            <div className="space-y-1.5">
              <Label>File Type</Label>
              <Select value={form.fileType} onValueChange={v => update("fileType", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["PDF", "DOCX", "XLSX", "JPG", "PNG", "TXT", "Other"].map(t => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Category <span className="text-red-500">*</span></Label>
              <Select value={form.category} onValueChange={v => update("category", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category…" />
                </SelectTrigger>
                <SelectContent>
                  {["Will & Testament", "Court Orders", "Applications", "Pleadings", "Inventory",
                    "Accounting", "Annual Reports", "Medical Records", "Official Records", "Discovery",
                    "Trust Documents", "Evidence", "Other"].map(c => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Uploaded By <span className="text-red-500">*</span></Label>
              <Input value={form.uploadedBy} onChange={e => update("uploadedBy", e.target.value)}
                placeholder="e.g. Jane Smith, Esq." required />
            </div>
            <div className="space-y-1.5">
              <Label>File Size (KB)</Label>
              <Input type="number" min="0" value={form.sizeKb} onChange={e => update("sizeKb", e.target.value)}
                placeholder="e.g. 512" />
            </div>
            <div className="md:col-span-2 flex justify-end">
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? "Saving…" : "Register Document"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-muted-foreground">All Documents ({sorted.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead>File Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Uploaded By</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Size</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.map(d => (
                <TableRow key={d.id}>
                  <TableCell className="font-medium flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary flex-shrink-0" /> {d.fileName}
                  </TableCell>
                  <TableCell><span className="text-xs bg-muted px-2 py-0.5 rounded">{d.category}</span></TableCell>
                  <TableCell className="text-muted-foreground">{d.uploadedBy}</TableCell>
                  <TableCell className="whitespace-nowrap">{format(new Date(d.uploadedDate), 'MMM d, yyyy')}</TableCell>
                  <TableCell className="text-muted-foreground">{d.sizeKb ? `${(d.sizeKb / 1024).toFixed(1)} MB` : '–'}</TableCell>
                </TableRow>
              ))}
              {sorted.length === 0 && (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-6">No documents uploaded.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function ActivityTab({ caseDetail }: { caseDetail: CaseDetail }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const mutation = useCreateActivity();

  const [note, setNote] = useState("");

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!note.trim()) return;
    mutation.mutate(
      {
        data: {
          caseId: caseDetail.id,
          caseNumber: caseDetail.caseNumber,
          action: "Note Added",
          user: UPDATED_BY,
          details: note.trim(),
        } as any,
      },
      {
        onSuccess: () => {
          toast({ title: "Note Added", description: "Your note has been logged." });
          setNote("");
          qc.invalidateQueries({ queryKey: getGetCaseQueryKey(caseDetail.id) });
        },
      }
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base flex items-center gap-2">
            <ClipboardList className="h-4 w-4 text-primary" /> Add Note to Activity Log
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddNote} className="flex gap-3">
            <Input value={note} onChange={e => setNote(e.target.value)} placeholder="Enter a note or observation…" className="flex-1" />
            <Button type="submit" disabled={mutation.isPending || !note.trim()}>
              {mutation.isPending ? "Adding…" : "Add Note"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-muted-foreground">Activity Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            Activity entries are automatically recorded when you update hearings, fees, notices, status, and documents.
            View the full timeline on the case detail page.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function UpdateCase() {
  const params = useParams();
  const [, navigate] = useLocation();
  const urlCaseId = params.id ? parseInt(params.id, 10) : null;

  const [selectedCaseId, setSelectedCaseId] = useState<number | null>(urlCaseId);

  const { data: caseDetail, isLoading } = useGetCase(selectedCaseId ?? 0, {
    query: {
      enabled: !!selectedCaseId,
      queryKey: getGetCaseQueryKey(selectedCaseId ?? 0),
    },
  });

  const handleBack = () => {
    setSelectedCaseId(null);
    if (urlCaseId) navigate(`/cases/${urlCaseId}`);
  };

  return (
    <Layout>
      <div className="flex flex-col gap-6">
        {/* Page header */}
        <div className="flex items-center gap-3">
          {selectedCaseId && (
            <Button variant="ghost" size="sm" onClick={handleBack} className="text-muted-foreground">
              <ArrowLeft className="h-4 w-4 mr-1" /> Back
            </Button>
          )}
          <div>
            <h1 className="text-2xl font-bold">Update Case Record</h1>
            <p className="text-sm text-muted-foreground">Record hearings, fees, notices, and status changes while preserving all history</p>
          </div>
        </div>

        {/* Step 1: Case selection */}
        {!selectedCaseId && (
          <CaseSearchPanel onSelect={setSelectedCaseId} />
        )}

        {/* Loading */}
        {selectedCaseId && isLoading && (
          <div className="space-y-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        )}

        {/* Case not found */}
        {selectedCaseId && !isLoading && !caseDetail && (
          <Card className="max-w-md">
            <CardContent className="py-8 text-center">
              <AlertCircle className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="font-semibold">Case not found</p>
              <Button variant="outline" size="sm" className="mt-4" onClick={() => setSelectedCaseId(null)}>
                Search Again
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Update forms */}
        {selectedCaseId && caseDetail && (
          <div className="space-y-6">
            <CaseSummaryBanner caseDetail={caseDetail} />

            <Tabs defaultValue="hearing" className="w-full">
              <TabsList className="w-full justify-start border-b rounded-none h-12 bg-transparent p-0 overflow-x-auto">
                {[
                  { value: "hearing", label: "Hearing Update", icon: CalendarPlus },
                  { value: "fee", label: "Fee / Payment", icon: DollarSign },
                  { value: "notice", label: "Notice Update", icon: BellRing },
                  { value: "status", label: "Status Update", icon: CheckCircle2 },
                  { value: "documents", label: "Documents", icon: FileUp },
                  { value: "activity", label: "Add Note", icon: ClipboardList },
                ].map(tab => (
                  <TabsTrigger
                    key={tab.value}
                    value={tab.value}
                    className="flex items-center gap-1.5 data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-12 px-5 whitespace-nowrap"
                  >
                    <tab.icon className="h-3.5 w-3.5" />
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>

              <div className="mt-6">
                <TabsContent value="hearing" className="mt-0">
                  <HearingUpdateTab caseDetail={caseDetail} />
                </TabsContent>
                <TabsContent value="fee" className="mt-0">
                  <FeeUpdateTab caseDetail={caseDetail} />
                </TabsContent>
                <TabsContent value="notice" className="mt-0">
                  <NoticeUpdateTab caseDetail={caseDetail} />
                </TabsContent>
                <TabsContent value="status" className="mt-0">
                  <StatusUpdateTab caseDetail={caseDetail} />
                </TabsContent>
                <TabsContent value="documents" className="mt-0">
                  <DocumentsTab caseDetail={caseDetail} />
                </TabsContent>
                <TabsContent value="activity" className="mt-0">
                  <ActivityTab caseDetail={caseDetail} />
                </TabsContent>
              </div>
            </Tabs>
          </div>
        )}
      </div>
    </Layout>
  );
}
