import { useState } from "react";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/auth-context";
import { Layout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import {
  useCreateCase,
  useCreateHearing,
  useCreateFee,
  useCreateNotice,
  useCreateDocument,
  useCreateParty,
  useCreateActivity,
} from "@workspace/api-client-react";
import {
  Plus, CheckCircle2, ArrowLeft, Gavel, CreditCard,
  BellRing, FileText, Users, Activity, ChevronRight,
  Lock
} from "lucide-react";

interface CreatedCase {
  id: number;
  caseNumber: string;
  fileNumber: string;
  title: string;
}

export default function NewCase() {
  const { isClerk, isLoading: authLoading, user } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [createdCase, setCreatedCase] = useState<CreatedCase | null>(null);
  const [activeTab, setActiveTab] = useState("case-info");

  // — entries added in-session (shown in each tab) —
  const [hearings, setHearings] = useState<any[]>([]);
  const [fees, setFees] = useState<any[]>([]);
  const [notices, setNotices] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [parties, setParties] = useState<any[]>([]);
  const [statusHistory, setStatusHistory] = useState<any[]>([]);

  // — Case Info form —
  const [caseForm, setCaseForm] = useState({
    caseNumber: "", fileNumber: "", title: "", courtName: "", presidingOfficer: "",
    courtRoom: "", caseType: "", caseCategory: "", filingDate: "",
    status: "", stage: "", notes: "",
  });

  // — Hearing form —
  const [hearingForm, setHearingForm] = useState({
    hearingDate: "", hearingType: "", courtRoom: "", result: "", notes: "",
  });

  // — Fee form —
  const [feeForm, setFeeForm] = useState({
    description: "", amount: "", status: "", dueDate: "", paidDate: "", receiptNumber: "",
  });

  // — Notice form —
  const [noticeForm, setNoticeForm] = useState({
    title: "", issuedDate: "", noticeType: "", issuedBy: "", content: "",
  });

  // — Document form —
  const [docForm, setDocForm] = useState({
    fileName: "", fileType: "", uploadedDate: "", category: "",
  });

  // — Party form —
  const [partyForm, setPartyForm] = useState({
    name: "", role: "", advocate: "", contactInfo: "",
  });

  // — Status form —
  const [statusForm, setStatusForm] = useState({
    status: "", stage: "", notes: "",
  });

  const createCase = useCreateCase();
  const createHearing = useCreateHearing();
  const createFee = useCreateFee();
  const createNotice = useCreateNotice();
  const createDocument = useCreateDocument();
  const createParty = useCreateParty();
  const createActivity = useCreateActivity();

  if (authLoading) return null;

  if (!isClerk) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
          <Lock className="h-12 w-12 text-muted-foreground" />
          <h2 className="text-xl font-semibold">Access Restricted</h2>
          <p className="text-muted-foreground max-w-sm">
            You must be signed in as a Court Clerk or Administrator to create new case records.
          </p>
          <Button onClick={() => navigate("/login")}>Sign In</Button>
        </div>
      </Layout>
    );
  }

  const userName = user?.name ?? "Court Staff";

  // ── Submit case info ──────────────────────────────────────────────
  const handleCreateCase = async (e: React.FormEvent) => {
    e.preventDefault();
    const { caseNumber, fileNumber, title, filingDate, status } = caseForm;
    if (!caseNumber || !title || !status) {
      toast({ title: "Required fields missing", description: "Case Number, Title, and Status are required.", variant: "destructive" });
      return;
    }
    createCase.mutate(
      { data: { ...caseForm, filingDate: filingDate || null } as any },
      {
        onSuccess: (data: any) => {
          setCreatedCase({ id: data.id, caseNumber: data.caseNumber, fileNumber: data.fileNumber ?? "", title: data.title });
          setActiveTab("hearing-history");
          queryClient.invalidateQueries({ queryKey: ["/api/cases"] });
          toast({ title: "Case created!", description: `Case ${data.caseNumber} has been recorded.` });
        },
        onError: (err: any) => {
          toast({ title: "Error creating case", description: err?.message ?? "Please try again.", variant: "destructive" });
        },
      }
    );
  };

  // ── Add hearing ───────────────────────────────────────────────────
  const handleAddHearing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hearingForm.hearingDate || !hearingForm.hearingType) {
      toast({ title: "Required", description: "Hearing Date and Type are required.", variant: "destructive" });
      return;
    }
    createHearing.mutate(
      { data: { ...hearingForm, caseId: createdCase!.id, caseNumber: createdCase!.caseNumber, caseTitle: createdCase!.title, updatedBy: userName } as any },
      {
        onSuccess: (data: any) => {
          setHearings(h => [...h, data]);
          setHearingForm({ hearingDate: "", hearingType: "", courtRoom: "", result: "", notes: "" });
          toast({ title: "Hearing added" });
        },
        onError: () => toast({ title: "Error", description: "Could not add hearing.", variant: "destructive" }),
      }
    );
  };

  // ── Add fee ───────────────────────────────────────────────────────
  const handleAddFee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feeForm.description || !feeForm.amount || !feeForm.status) {
      toast({ title: "Required", description: "Description, Amount, and Status are required.", variant: "destructive" });
      return;
    }
    createFee.mutate(
      { data: { ...feeForm, caseId: createdCase!.id, updatedBy: userName } as any },
      {
        onSuccess: (data: any) => {
          setFees(f => [...f, data]);
          setFeeForm({ description: "", amount: "", status: "", dueDate: "", paidDate: "", receiptNumber: "" });
          toast({ title: "Fee recorded" });
        },
        onError: () => toast({ title: "Error", description: "Could not add fee.", variant: "destructive" }),
      }
    );
  };

  // ── Add notice ────────────────────────────────────────────────────
  const handleAddNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noticeForm.title || !noticeForm.issuedDate || !noticeForm.noticeType) {
      toast({ title: "Required", description: "Title, Date, and Type are required.", variant: "destructive" });
      return;
    }
    createNotice.mutate(
      { data: { ...noticeForm, caseId: createdCase!.id, updatedBy: userName } as any },
      {
        onSuccess: (data: any) => {
          setNotices(n => [...n, data]);
          setNoticeForm({ title: "", issuedDate: "", noticeType: "", issuedBy: "", content: "" });
          toast({ title: "Notice recorded" });
        },
        onError: () => toast({ title: "Error", description: "Could not add notice.", variant: "destructive" }),
      }
    );
  };

  // ── Add document ──────────────────────────────────────────────────
  const handleAddDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docForm.fileName || !docForm.category) {
      toast({ title: "Required", description: "File Name and Category are required.", variant: "destructive" });
      return;
    }
    createDocument.mutate(
      { data: { ...docForm, caseId: createdCase!.id, uploadedBy: userName, fileType: docForm.fileType || "application/pdf" } as any },
      {
        onSuccess: (data: any) => {
          setDocuments(d => [...d, data]);
          setDocForm({ fileName: "", fileType: "", uploadedDate: "", category: "" });
          toast({ title: "Document recorded" });
        },
        onError: () => toast({ title: "Error", description: "Could not add document.", variant: "destructive" }),
      }
    );
  };

  // ── Add party ─────────────────────────────────────────────────────
  const handleAddParty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!partyForm.name || !partyForm.role) {
      toast({ title: "Required", description: "Name and Role are required.", variant: "destructive" });
      return;
    }
    createParty.mutate(
      { data: { ...partyForm, caseId: createdCase!.id, updatedBy: userName } as any },
      {
        onSuccess: (data: any) => {
          setParties(p => [...p, data]);
          setPartyForm({ name: "", role: "", advocate: "", contactInfo: "" });
          toast({ title: "Party added" });
        },
        onError: () => toast({ title: "Error", description: "Could not add party.", variant: "destructive" }),
      }
    );
  };

  // ── Add status change ─────────────────────────────────────────────
  const handleAddStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!statusForm.status) {
      toast({ title: "Required", description: "Status is required.", variant: "destructive" });
      return;
    }
    // Update the case status and log to activity
    const detail = `Status changed to ${statusForm.status}${statusForm.stage ? ` / Stage: ${statusForm.stage}` : ""}${statusForm.notes ? ` — ${statusForm.notes}` : ""}`;
    createActivity.mutate(
      { data: { caseId: createdCase!.id, caseNumber: createdCase!.caseNumber, action: "Status Updated", user: userName, details: detail } as any },
      {
        onSuccess: () => {
          setStatusHistory(s => [...s, { ...statusForm, timestamp: new Date().toISOString(), enteredBy: userName }]);
          setStatusForm({ status: "", stage: "", notes: "" });
          toast({ title: "Status recorded" });
        },
        onError: () => toast({ title: "Error", description: "Could not record status.", variant: "destructive" }),
      }
    );
  };

  const tabTriggerCls = "text-xs sm:text-sm";

  return (
    <Layout>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Page header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <button
              onClick={() => navigate("/dashboard")}
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-2"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back to Dashboard
            </button>
            <h1 className="text-2xl font-bold font-serif">Create New Case Record</h1>
            <p className="text-muted-foreground mt-1">
              Enter all case information manually. All fields start empty — no pre-filled data.
            </p>
          </div>
          {createdCase && (
            <Button variant="outline" onClick={() => navigate(`/cases/${createdCase.id}`)}>
              View Full Record <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          )}
        </div>

        {/* Success banner after case created */}
        {createdCase && (
          <div className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 px-4 py-3">
            <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
            <div>
              <p className="font-medium text-green-900 text-sm">Case <span className="font-mono">{createdCase.caseNumber}</span> created successfully.</p>
              <p className="text-green-700 text-xs mt-0.5">Use the tabs below to add historical hearings, fees, notices, documents, and parties.</p>
            </div>
          </div>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full grid grid-cols-4 sm:grid-cols-7 h-auto flex-wrap">
            <TabsTrigger value="case-info" className={tabTriggerCls}>Case Info</TabsTrigger>
            <TabsTrigger value="hearing-history" disabled={!createdCase} className={tabTriggerCls}>
              <Gavel className="h-3.5 w-3.5 mr-1 hidden sm:block" /> Hearings {hearings.length > 0 && <Badge variant="secondary" className="ml-1 h-4 text-xs">{hearings.length}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="fee-history" disabled={!createdCase} className={tabTriggerCls}>
              <CreditCard className="h-3.5 w-3.5 mr-1 hidden sm:block" /> Fees {fees.length > 0 && <Badge variant="secondary" className="ml-1 h-4 text-xs">{fees.length}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="notice-history" disabled={!createdCase} className={tabTriggerCls}>
              <BellRing className="h-3.5 w-3.5 mr-1 hidden sm:block" /> Notices {notices.length > 0 && <Badge variant="secondary" className="ml-1 h-4 text-xs">{notices.length}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="documents" disabled={!createdCase} className={tabTriggerCls}>
              <FileText className="h-3.5 w-3.5 mr-1 hidden sm:block" /> Documents {documents.length > 0 && <Badge variant="secondary" className="ml-1 h-4 text-xs">{documents.length}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="parties" disabled={!createdCase} className={tabTriggerCls}>
              <Users className="h-3.5 w-3.5 mr-1 hidden sm:block" /> Parties {parties.length > 0 && <Badge variant="secondary" className="ml-1 h-4 text-xs">{parties.length}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="status-history" disabled={!createdCase} className={tabTriggerCls}>
              <Activity className="h-3.5 w-3.5 mr-1 hidden sm:block" /> Status {statusHistory.length > 0 && <Badge variant="secondary" className="ml-1 h-4 text-xs">{statusHistory.length}</Badge>}
            </TabsTrigger>
          </TabsList>

          {/* ── CASE INFO ─────────────────────────────────────────────── */}
          <TabsContent value="case-info">
            <Card>
              <CardHeader>
                <CardTitle>Case Information</CardTitle>
                <CardDescription>
                  {createdCase
                    ? `Case ${createdCase.caseNumber} has been saved. All fields below reflect the saved record.`
                    : "Complete the required fields and click Create Case Record. All inputs are blank — enter data as needed."}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateCase} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="caseNumber">Case Number <span className="text-red-500">*</span></Label>
                      <Input id="caseNumber" placeholder="" value={caseForm.caseNumber}
                        onChange={e => setCaseForm(f => ({ ...f, caseNumber: e.target.value }))}
                        disabled={!!createdCase} />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="fileNumber">File Number</Label>
                      <Input id="fileNumber" placeholder="" value={caseForm.fileNumber}
                        onChange={e => setCaseForm(f => ({ ...f, fileNumber: e.target.value }))}
                        disabled={!!createdCase} />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="title">Case Title <span className="text-red-500">*</span></Label>
                    <Input id="title" placeholder="" value={caseForm.title}
                      onChange={e => setCaseForm(f => ({ ...f, title: e.target.value }))}
                      disabled={!!createdCase} />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label>Court Name</Label>
                      <Select value={caseForm.courtName} onValueChange={v => setCaseForm(f => ({ ...f, courtName: v }))} disabled={!!createdCase}>
                        <SelectTrigger><SelectValue placeholder="Select court…" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Statutory Probate Court No. 1">Statutory Probate Court No. 1</SelectItem>
                          <SelectItem value="Statutory Probate Court No. 2">Statutory Probate Court No. 2</SelectItem>
                          <SelectItem value="Statutory Probate Court No. 3">Statutory Probate Court No. 3</SelectItem>
                          <SelectItem value="Statutory Probate Court No. 4">Statutory Probate Court No. 4</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Presiding Judge</Label>
                      <Select value={caseForm.presidingOfficer} onValueChange={v => setCaseForm(f => ({ ...f, presidingOfficer: v }))} disabled={!!createdCase}>
                        <SelectTrigger><SelectValue placeholder="Select judge…" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Hon. Margaret L. Chen">Hon. Margaret L. Chen</SelectItem>
                          <SelectItem value="Hon. David A. Ruiz">Hon. David A. Ruiz</SelectItem>
                          <SelectItem value="Hon. Patricia M. Nguyen">Hon. Patricia M. Nguyen</SelectItem>
                          <SelectItem value="Hon. James T. Okafor">Hon. James T. Okafor</SelectItem>
                          <SelectItem value="Hon. Anderson Blake">Hon. Anderson Blake</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="courtRoom">Courtroom</Label>
                      <Input id="courtRoom" placeholder="" value={caseForm.courtRoom}
                        onChange={e => setCaseForm(f => ({ ...f, courtRoom: e.target.value }))}
                        disabled={!!createdCase} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Case Type</Label>
                      <Select value={caseForm.caseType} onValueChange={v => setCaseForm(f => ({ ...f, caseType: v }))} disabled={!!createdCase}>
                        <SelectTrigger><SelectValue placeholder="Select type…" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Probate">Probate</SelectItem>
                          <SelectItem value="Guardianship">Guardianship</SelectItem>
                          <SelectItem value="Trust">Trust</SelectItem>
                          <SelectItem value="Mental Health">Mental Health</SelectItem>
                          <SelectItem value="Heirship">Heirship</SelectItem>
                          <SelectItem value="Adoption">Adoption</SelectItem>
                          <SelectItem value="Civil">Civil</SelectItem>
                          <SelectItem value="Family">Family</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Case Category</Label>
                      <Select value={caseForm.caseCategory} onValueChange={v => setCaseForm(f => ({ ...f, caseCategory: v }))} disabled={!!createdCase}>
                        <SelectTrigger><SelectValue placeholder="Select category…" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Estate">Estate</SelectItem>
                          <SelectItem value="Contract">Contract</SelectItem>
                          <SelectItem value="Property">Property</SelectItem>
                          <SelectItem value="Dispute">Dispute</SelectItem>
                          <SelectItem value="Will Contest">Will Contest</SelectItem>
                          <SelectItem value="Administration">Administration</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="filingDate">Filing Date</Label>
                      <Input id="filingDate" type="date" value={caseForm.filingDate}
                        onChange={e => setCaseForm(f => ({ ...f, filingDate: e.target.value }))}
                        disabled={!!createdCase} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Current Status <span className="text-red-500">*</span></Label>
                      <Select value={caseForm.status} onValueChange={v => setCaseForm(f => ({ ...f, status: v }))} disabled={!!createdCase}>
                        <SelectTrigger><SelectValue placeholder="Select status…" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Filed">Filed</SelectItem>
                          <SelectItem value="Active">Active</SelectItem>
                          <SelectItem value="Pending">Pending</SelectItem>
                          <SelectItem value="Awaiting Documents">Awaiting Documents</SelectItem>
                          <SelectItem value="Hearing Scheduled">Hearing Scheduled</SelectItem>
                          <SelectItem value="Judgment Reserved">Judgment Reserved</SelectItem>
                          <SelectItem value="Closed">Closed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="stage">Stage</Label>
                      <Input id="stage" placeholder="" value={caseForm.stage}
                        onChange={e => setCaseForm(f => ({ ...f, stage: e.target.value }))}
                        disabled={!!createdCase} />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="notes">Notes / Description</Label>
                    <Textarea id="notes" placeholder="" rows={3} value={caseForm.notes}
                      onChange={e => setCaseForm(f => ({ ...f, notes: e.target.value }))}
                      disabled={!!createdCase} />
                  </div>

                  {!createdCase && (
                    <div className="flex gap-3 pt-2">
                      <Button type="submit" disabled={createCase.isPending}>
                        {createCase.isPending ? "Creating…" : "Create Case Record"}
                      </Button>
                      <Button type="button" variant="outline" onClick={() => navigate("/dashboard")}>
                        Cancel
                      </Button>
                    </div>
                  )}
                  {createdCase && (
                    <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      Case saved. Use the tabs above to enter historical records.
                    </p>
                  )}
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── HEARING HISTORY ───────────────────────────────────────── */}
          <TabsContent value="hearing-history">
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Gavel className="h-5 w-5" /> Add Hearing</CardTitle>
                  <CardDescription>Record a past or scheduled hearing. Enter all details as needed.</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleAddHearing} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label>Hearing Date <span className="text-red-500">*</span></Label>
                        <Input type="date" value={hearingForm.hearingDate}
                          onChange={e => setHearingForm(f => ({ ...f, hearingDate: e.target.value }))} />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Hearing Type / Purpose <span className="text-red-500">*</span></Label>
                        <Select value={hearingForm.hearingType} onValueChange={v => setHearingForm(f => ({ ...f, hearingType: v }))}>
                          <SelectTrigger><SelectValue placeholder="Select type…" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Initial Hearing">Initial Hearing</SelectItem>
                            <SelectItem value="Status Conference">Status Conference</SelectItem>
                            <SelectItem value="Motion Hearing">Motion Hearing</SelectItem>
                            <SelectItem value="Pretrial Conference">Pretrial Conference</SelectItem>
                            <SelectItem value="Trial">Trial</SelectItem>
                            <SelectItem value="Application Hearing">Application Hearing</SelectItem>
                            <SelectItem value="Guardianship Review">Guardianship Review</SelectItem>
                            <SelectItem value="Fee Approval">Fee Approval</SelectItem>
                            <SelectItem value="Final Hearing">Final Hearing</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label>Courtroom</Label>
                        <Input placeholder="" value={hearingForm.courtRoom}
                          onChange={e => setHearingForm(f => ({ ...f, courtRoom: e.target.value }))} />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Outcome / Result</Label>
                        <Input placeholder="" value={hearingForm.result}
                          onChange={e => setHearingForm(f => ({ ...f, result: e.target.value }))} />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Notes / Remarks</Label>
                      <Textarea placeholder="" rows={2} value={hearingForm.notes}
                        onChange={e => setHearingForm(f => ({ ...f, notes: e.target.value }))} />
                    </div>
                    <Button type="submit" disabled={createHearing.isPending}>
                      <Plus className="h-4 w-4 mr-1" /> {createHearing.isPending ? "Adding…" : "Add Hearing"}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {hearings.length > 0 && (
                <Card>
                  <CardHeader><CardTitle className="text-base">Hearing History ({hearings.length})</CardTitle></CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {hearings.map((h, i) => (
                        <div key={i} className="flex items-start gap-3 p-3 rounded-md border bg-muted/30">
                          <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
                            <div><p className="text-xs text-muted-foreground">Date</p><p className="font-medium">{h.hearingDate}</p></div>
                            <div><p className="text-xs text-muted-foreground">Type</p><p className="font-medium">{h.hearingType}</p></div>
                            <div><p className="text-xs text-muted-foreground">Courtroom</p><p className="font-medium">{h.courtRoom || "—"}</p></div>
                            <div><p className="text-xs text-muted-foreground">Result</p><p className="font-medium">{h.result || "—"}</p></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* ── FEE HISTORY ───────────────────────────────────────────── */}
          <TabsContent value="fee-history">
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><CreditCard className="h-5 w-5" /> Add Fee / Payment</CardTitle>
                  <CardDescription>Record fees assessed or payments made for this case.</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleAddFee} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label>Fee Description <span className="text-red-500">*</span></Label>
                        <Input placeholder="" value={feeForm.description}
                          onChange={e => setFeeForm(f => ({ ...f, description: e.target.value }))} />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Amount ($) <span className="text-red-500">*</span></Label>
                        <Input type="number" step="0.01" min="0" placeholder="" value={feeForm.amount}
                          onChange={e => setFeeForm(f => ({ ...f, amount: e.target.value }))} />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="space-y-1.5">
                        <Label>Status <span className="text-red-500">*</span></Label>
                        <Select value={feeForm.status} onValueChange={v => setFeeForm(f => ({ ...f, status: v }))}>
                          <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="paid">Paid</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="waived">Waived</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label>Due Date</Label>
                        <Input type="date" value={feeForm.dueDate}
                          onChange={e => setFeeForm(f => ({ ...f, dueDate: e.target.value }))} />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Date Paid</Label>
                        <Input type="date" value={feeForm.paidDate}
                          onChange={e => setFeeForm(f => ({ ...f, paidDate: e.target.value }))} />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Receipt Number</Label>
                      <Input placeholder="" value={feeForm.receiptNumber}
                        onChange={e => setFeeForm(f => ({ ...f, receiptNumber: e.target.value }))} />
                    </div>
                    <Button type="submit" disabled={createFee.isPending}>
                      <Plus className="h-4 w-4 mr-1" /> {createFee.isPending ? "Adding…" : "Add Fee / Payment"}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {fees.length > 0 && (
                <Card>
                  <CardHeader><CardTitle className="text-base">Fee History ({fees.length})</CardTitle></CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {fees.map((f, i) => (
                        <div key={i} className="flex items-start gap-3 p-3 rounded-md border bg-muted/30">
                          <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
                            <div><p className="text-xs text-muted-foreground">Description</p><p className="font-medium">{f.description}</p></div>
                            <div><p className="text-xs text-muted-foreground">Amount</p><p className="font-medium">${Number(f.amount).toFixed(2)}</p></div>
                            <div><p className="text-xs text-muted-foreground">Status</p><Badge variant={f.status === "paid" ? "default" : "outline"} className="text-xs">{f.status}</Badge></div>
                            <div><p className="text-xs text-muted-foreground">Receipt</p><p className="font-medium">{f.receiptNumber || "—"}</p></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* ── NOTICE HISTORY ────────────────────────────────────────── */}
          <TabsContent value="notice-history">
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><BellRing className="h-5 w-5" /> Add Notice</CardTitle>
                  <CardDescription>Record court notices, orders, summons, or directives issued for this case.</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleAddNotice} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label>Notice Title <span className="text-red-500">*</span></Label>
                        <Input placeholder="" value={noticeForm.title}
                          onChange={e => setNoticeForm(f => ({ ...f, title: e.target.value }))} />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Date Issued <span className="text-red-500">*</span></Label>
                        <Input type="date" value={noticeForm.issuedDate}
                          onChange={e => setNoticeForm(f => ({ ...f, issuedDate: e.target.value }))} />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label>Notice Type <span className="text-red-500">*</span></Label>
                        <Select value={noticeForm.noticeType} onValueChange={v => setNoticeForm(f => ({ ...f, noticeType: v }))}>
                          <SelectTrigger><SelectValue placeholder="Select type…" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Order">Order</SelectItem>
                            <SelectItem value="Summons">Summons</SelectItem>
                            <SelectItem value="Directive">Directive</SelectItem>
                            <SelectItem value="Citation">Citation</SelectItem>
                            <SelectItem value="Notice of Hearing">Notice of Hearing</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label>Issued By / Authority</Label>
                        <Input placeholder="" value={noticeForm.issuedBy}
                          onChange={e => setNoticeForm(f => ({ ...f, issuedBy: e.target.value }))} />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Description / Details</Label>
                      <Textarea placeholder="" rows={3} value={noticeForm.content}
                        onChange={e => setNoticeForm(f => ({ ...f, content: e.target.value }))} />
                    </div>
                    <Button type="submit" disabled={createNotice.isPending}>
                      <Plus className="h-4 w-4 mr-1" /> {createNotice.isPending ? "Adding…" : "Add Notice"}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {notices.length > 0 && (
                <Card>
                  <CardHeader><CardTitle className="text-base">Notice History ({notices.length})</CardTitle></CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {notices.map((n, i) => (
                        <div key={i} className="p-3 rounded-md border bg-muted/30 text-sm">
                          <div className="flex items-center justify-between mb-1">
                            <p className="font-medium">{n.title}</p>
                            <Badge variant="outline" className="text-xs">{n.noticeType}</Badge>
                          </div>
                          <p className="text-muted-foreground text-xs">{n.issuedDate} · {n.issuedBy || "Court"}</p>
                          {n.content && <p className="mt-1 text-xs">{n.content}</p>}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* ── DOCUMENTS ─────────────────────────────────────────────── */}
          <TabsContent value="documents">
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5" /> Register Document</CardTitle>
                  <CardDescription>Register petitions, orders, receipts, evidence, and other case documents.</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleAddDocument} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label>File Name <span className="text-red-500">*</span></Label>
                        <Input placeholder="" value={docForm.fileName}
                          onChange={e => setDocForm(f => ({ ...f, fileName: e.target.value }))} />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Document Category <span className="text-red-500">*</span></Label>
                        <Select value={docForm.category} onValueChange={v => setDocForm(f => ({ ...f, category: v }))}>
                          <SelectTrigger><SelectValue placeholder="Select category…" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Petition">Petition</SelectItem>
                            <SelectItem value="Order">Order</SelectItem>
                            <SelectItem value="Receipt">Receipt</SelectItem>
                            <SelectItem value="Evidence">Evidence</SelectItem>
                            <SelectItem value="Pleading">Pleading</SelectItem>
                            <SelectItem value="Correspondence">Correspondence</SelectItem>
                            <SelectItem value="Inventory">Inventory</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label>File Type</Label>
                        <Select value={docForm.fileType} onValueChange={v => setDocForm(f => ({ ...f, fileType: v }))}>
                          <SelectTrigger><SelectValue placeholder="Select type…" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="application/pdf">PDF</SelectItem>
                            <SelectItem value="image/jpeg">JPEG Image</SelectItem>
                            <SelectItem value="image/png">PNG Image</SelectItem>
                            <SelectItem value="application/msword">Word Document</SelectItem>
                            <SelectItem value="text/plain">Text File</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label>Date Filed / Uploaded</Label>
                        <Input type="date" value={docForm.uploadedDate}
                          onChange={e => setDocForm(f => ({ ...f, uploadedDate: e.target.value }))} />
                      </div>
                    </div>
                    <Button type="submit" disabled={createDocument.isPending}>
                      <Plus className="h-4 w-4 mr-1" /> {createDocument.isPending ? "Adding…" : "Register Document"}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {documents.length > 0 && (
                <Card>
                  <CardHeader><CardTitle className="text-base">Documents ({documents.length})</CardTitle></CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {documents.map((d, i) => (
                        <div key={i} className="flex items-center gap-3 p-3 rounded-md border bg-muted/30 text-sm">
                          <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <div className="flex-1">
                            <p className="font-medium">{d.fileName}</p>
                            <p className="text-xs text-muted-foreground">{d.category} · {d.uploadedDate || "Date not specified"}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* ── PARTIES ───────────────────────────────────────────────── */}
          <TabsContent value="parties">
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" /> Add Party</CardTitle>
                  <CardDescription>Add petitioners, respondents, attorneys, and other parties to this case.</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleAddParty} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label>Party Name <span className="text-red-500">*</span></Label>
                        <Input placeholder="" value={partyForm.name}
                          onChange={e => setPartyForm(f => ({ ...f, name: e.target.value }))} />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Role <span className="text-red-500">*</span></Label>
                        <Select value={partyForm.role} onValueChange={v => setPartyForm(f => ({ ...f, role: v }))}>
                          <SelectTrigger><SelectValue placeholder="Select role…" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Petitioner">Petitioner</SelectItem>
                            <SelectItem value="Respondent">Respondent</SelectItem>
                            <SelectItem value="Applicant">Applicant</SelectItem>
                            <SelectItem value="Guardian">Guardian</SelectItem>
                            <SelectItem value="Ward">Ward</SelectItem>
                            <SelectItem value="Executor">Executor</SelectItem>
                            <SelectItem value="Administrator">Administrator</SelectItem>
                            <SelectItem value="Beneficiary">Beneficiary</SelectItem>
                            <SelectItem value="Attorney">Attorney</SelectItem>
                            <SelectItem value="Interested Party">Interested Party</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label>Attorney / Advocate</Label>
                        <Input placeholder="" value={partyForm.advocate}
                          onChange={e => setPartyForm(f => ({ ...f, advocate: e.target.value }))} />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Contact Information</Label>
                        <Input placeholder="" value={partyForm.contactInfo}
                          onChange={e => setPartyForm(f => ({ ...f, contactInfo: e.target.value }))} />
                      </div>
                    </div>
                    <Button type="submit" disabled={createParty.isPending}>
                      <Plus className="h-4 w-4 mr-1" /> {createParty.isPending ? "Adding…" : "Add Party"}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {parties.length > 0 && (
                <Card>
                  <CardHeader><CardTitle className="text-base">Parties ({parties.length})</CardTitle></CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {parties.map((p, i) => (
                        <div key={i} className="flex items-center gap-3 p-3 rounded-md border bg-muted/30 text-sm">
                          <Users className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <div className="flex-1">
                            <p className="font-medium">{p.name}</p>
                            <p className="text-xs text-muted-foreground">{p.role}{p.advocate ? ` · Attorney: ${p.advocate}` : ""}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* ── STATUS HISTORY ────────────────────────────────────────── */}
          <TabsContent value="status-history">
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Activity className="h-5 w-5" /> Add Status Entry</CardTitle>
                  <CardDescription>Record historical or current case status changes in chronological order.</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleAddStatus} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label>Status <span className="text-red-500">*</span></Label>
                        <Select value={statusForm.status} onValueChange={v => setStatusForm(f => ({ ...f, status: v }))}>
                          <SelectTrigger><SelectValue placeholder="Select status…" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Filed">Filed</SelectItem>
                            <SelectItem value="Active">Active</SelectItem>
                            <SelectItem value="Pending">Pending</SelectItem>
                            <SelectItem value="Awaiting Documents">Awaiting Documents</SelectItem>
                            <SelectItem value="Hearing Scheduled">Hearing Scheduled</SelectItem>
                            <SelectItem value="Judgment Reserved">Judgment Reserved</SelectItem>
                            <SelectItem value="Closed">Closed</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label>Stage</Label>
                        <Input placeholder="" value={statusForm.stage}
                          onChange={e => setStatusForm(f => ({ ...f, stage: e.target.value }))} />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Notes / Reason for Change</Label>
                      <Textarea placeholder="" rows={2} value={statusForm.notes}
                        onChange={e => setStatusForm(f => ({ ...f, notes: e.target.value }))} />
                    </div>
                    <Button type="submit" disabled={createActivity.isPending}>
                      <Plus className="h-4 w-4 mr-1" /> {createActivity.isPending ? "Adding…" : "Add Status Entry"}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {statusHistory.length > 0 && (
                <Card>
                  <CardHeader><CardTitle className="text-base">Status History ({statusHistory.length})</CardTitle></CardHeader>
                  <CardContent>
                    <div className="relative pl-4 border-l-2 border-border space-y-4">
                      {statusHistory.map((s, i) => (
                        <div key={i} className="relative">
                          <div className="absolute -left-[1.1rem] top-1 h-3 w-3 rounded-full border-2 border-primary bg-background" />
                          <div className="p-3 rounded-md border bg-muted/30 text-sm ml-2">
                            <div className="flex items-center justify-between">
                              <Badge>{s.status}</Badge>
                              <span className="text-xs text-muted-foreground">{new Date(s.timestamp).toLocaleString()}</span>
                            </div>
                            {s.stage && <p className="text-xs mt-1 text-muted-foreground">Stage: {s.stage}</p>}
                            {s.notes && <p className="text-xs mt-1">{s.notes}</p>}
                            <p className="text-xs mt-1 text-muted-foreground">Entered by: {s.enteredBy}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Bottom action bar */}
        {createdCase && (
          <Separator />
        )}
        {createdCase && (
          <div className="flex items-center justify-between py-2">
            <p className="text-sm text-muted-foreground">
              Case <span className="font-mono font-medium">{createdCase.caseNumber}</span> · {hearings.length} hearings · {fees.length} fees · {notices.length} notices · {documents.length} docs · {parties.length} parties
            </p>
            <Button onClick={() => navigate(`/cases/${createdCase.id}`)}>
              View Complete Record <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        )}
      </div>
    </Layout>
  );
}
