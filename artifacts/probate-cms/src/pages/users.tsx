import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/auth-context";
import { Layout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import {
  Plus, ShieldCheck, UserCog, Users, MoreHorizontal,
  UserX, UserCheck, Trash2, Eye, EyeOff, Lock,
} from "lucide-react";

interface CmsUser {
  id: number;
  username: string;
  name: string;
  role: string;
  email: string | null;
  isActive: boolean;
  createdAt: string | null;
  lastLogin: string | null;
}

async function apiFetch(path: string, options?: RequestInit) {
  const res = await fetch(`/api${path}`, {
    ...options,
    credentials: "include",
    headers: { "Content-Type": "application/json", ...options?.headers },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Request failed");
  return data;
}

function RoleBadge({ role }: { role: string }) {
  if (role === "admin") return (
    <div className="flex items-center gap-1.5">
      <ShieldCheck className="h-3.5 w-3.5 text-purple-500" />
      <span className="text-sm font-medium text-purple-700">Admin</span>
    </div>
  );
  return (
    <div className="flex items-center gap-1.5">
      <UserCog className="h-3.5 w-3.5 text-blue-500" />
      <span className="text-sm font-medium text-blue-700">Clerk</span>
    </div>
  );
}

function formatDate(dt: string | null) {
  if (!dt) return "Never";
  return new Date(dt).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });
}

function UserInitials({ name }: { name: string }) {
  const initials = name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
  return (
    <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs border border-primary/20 select-none">
      {initials}
    </div>
  );
}

export default function UsersPage() {
  const { isAdmin, user: currentUser } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [showCreate, setShowCreate] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<CmsUser | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const [form, setForm] = useState({
    name: "", username: "", email: "", role: "clerk", password: "", passwordConfirm: "",
  });
  const [formError, setFormError] = useState("");

  const { data: users = [], isLoading } = useQuery<CmsUser[]>({
    queryKey: ["/api/auth/users"],
    queryFn: () => apiFetch("/auth/users"),
    enabled: isAdmin,
  });

  const createUser = useMutation({
    mutationFn: (body: object) => apiFetch("/auth/users", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/users"] });
      setShowCreate(false);
      setForm({ name: "", username: "", email: "", role: "clerk", password: "", passwordConfirm: "" });
      setFormError("");
      toast({ title: "User created", description: "The new account is ready to use." });
    },
    onError: (err: Error) => setFormError(err.message),
  });

  const patchUser = useMutation({
    mutationFn: ({ id, ...body }: { id: number; [k: string]: any }) =>
      apiFetch(`/auth/users/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/users"] });
    },
    onError: (err: Error) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const deleteUser = useMutation({
    mutationFn: (id: number) => apiFetch(`/auth/users/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/users"] });
      setShowDeleteConfirm(null);
      toast({ title: "User deleted" });
    },
    onError: (err: Error) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    if (!form.name || !form.username || !form.password || !form.role) {
      setFormError("Name, username, password, and role are required.");
      return;
    }
    if (form.password !== form.passwordConfirm) {
      setFormError("Passwords do not match.");
      return;
    }
    if (form.password.length < 6) {
      setFormError("Password must be at least 6 characters.");
      return;
    }
    createUser.mutate({ name: form.name, username: form.username, email: form.email || undefined, role: form.role, password: form.password });
  };

  const toggleActive = (u: CmsUser) => {
    patchUser.mutate({ id: u.id, isActive: !u.isActive });
    toast({ title: u.isActive ? "Account deactivated" : "Account reactivated", description: `${u.name}'s account is now ${u.isActive ? "inactive" : "active"}.` });
  };

  const changeRole = (u: CmsUser, role: string) => {
    patchUser.mutate({ id: u.id, role });
    toast({ title: "Role updated", description: `${u.name} is now a ${role}.` });
  };

  const activeCount = users.filter(u => u.isActive).length;
  const adminCount = users.filter(u => u.role === "admin").length;

  if (!isAdmin) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
          <Lock className="h-12 w-12 text-muted-foreground" />
          <h2 className="text-xl font-semibold">Administrator Access Required</h2>
          <p className="text-muted-foreground">Only administrators can manage user accounts.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold font-serif">User Management</h1>
            <p className="text-muted-foreground mt-1">Manage staff accounts and access roles for the CMS.</p>
          </div>
          <Button onClick={() => { setShowCreate(true); setFormError(""); }}>
            <Plus className="h-4 w-4 mr-2" /> Add User
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Total Accounts", value: users.length, icon: Users, color: "text-blue-600" },
            { label: "Active", value: activeCount, icon: UserCheck, color: "text-green-600" },
            { label: "Inactive", value: users.length - activeCount, icon: UserX, color: "text-gray-500" },
            { label: "Admins", value: adminCount, icon: ShieldCheck, color: "text-purple-600" },
          ].map(s => (
            <Card key={s.label} className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium">{s.label}</p>
                  <p className="text-2xl font-bold mt-0.5">{s.value}</p>
                </div>
                <s.icon className={`h-8 w-8 ${s.color} opacity-70`} />
              </div>
            </Card>
          ))}
        </div>

        {/* Table */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">All Accounts</CardTitle>
            <CardDescription>Click the menu (⋯) to deactivate, change role, or delete an account.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-8 text-center text-muted-foreground text-sm">Loading users…</div>
            ) : (
              <Table>
                <TableHeader className="bg-muted/40">
                  <TableRow>
                    <TableHead className="w-10"></TableHead>
                    <TableHead className="font-semibold">Name</TableHead>
                    <TableHead className="font-semibold hidden sm:table-cell">Username</TableHead>
                    <TableHead className="font-semibold hidden md:table-cell">Email</TableHead>
                    <TableHead className="font-semibold">Role</TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                    <TableHead className="font-semibold hidden lg:table-cell">Last Login</TableHead>
                    <TableHead className="font-semibold hidden lg:table-cell">Created</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map(u => {
                    const isMe = u.id === currentUser?.id;
                    return (
                      <TableRow key={u.id} className={`hover:bg-muted/30 ${!u.isActive ? "opacity-60" : ""}`}>
                        <TableCell>
                          <UserInitials name={u.name} />
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium text-sm">{u.name}</p>
                            {isMe && <span className="text-[10px] text-muted-foreground">(you)</span>}
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground hidden sm:table-cell">
                          {u.username}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground hidden md:table-cell">
                          {u.email ?? <span className="italic text-muted-foreground/50">—</span>}
                        </TableCell>
                        <TableCell><RoleBadge role={u.role} /></TableCell>
                        <TableCell>
                          <Badge
                            variant={u.isActive ? "default" : "secondary"}
                            className={u.isActive ? "bg-green-100 text-green-800 hover:bg-green-100 border-green-200" : ""}
                          >
                            {u.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground hidden lg:table-cell">
                          {formatDate(u.lastLogin)}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground hidden lg:table-cell">
                          {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "—"}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-7 w-7" disabled={isMe}>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuItem
                                onClick={() => changeRole(u, u.role === "admin" ? "clerk" : "admin")}
                              >
                                <ShieldCheck className="h-4 w-4 mr-2" />
                                {u.role === "admin" ? "Make Clerk" : "Make Admin"}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => toggleActive(u)}>
                                {u.isActive
                                  ? <><UserX className="h-4 w-4 mr-2" />Deactivate</>
                                  : <><UserCheck className="h-4 w-4 mr-2" />Reactivate</>
                                }
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-red-600 focus:text-red-600"
                                onClick={() => setShowDeleteConfirm(u)}
                              >
                                <Trash2 className="h-4 w-4 mr-2" /> Delete Permanently
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {users.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                        No user accounts found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Create User Dialog ───────────────────────────────────────── */}
      <Dialog open={showCreate} onOpenChange={v => { setShowCreate(v); setFormError(""); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create New User Account</DialogTitle>
            <DialogDescription>Add a staff member. All fields are empty — fill in as needed.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4 pt-2">
            {formError && (
              <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {formError}
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="u-name">Full Name <span className="text-red-500">*</span></Label>
              <Input id="u-name" placeholder="" value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="u-username">Username <span className="text-red-500">*</span></Label>
                <Input id="u-username" placeholder="" autoComplete="off" value={form.username}
                  onChange={e => setForm(f => ({ ...f, username: e.target.value.toLowerCase().trim() }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Role <span className="text-red-500">*</span></Label>
                <Select value={form.role} onValueChange={v => setForm(f => ({ ...f, role: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="clerk">Clerk</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="u-email">Email Address</Label>
              <Input id="u-email" type="email" placeholder="" value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="u-password">Password <span className="text-red-500">*</span></Label>
              <div className="relative">
                <Input id="u-password" type={showPassword ? "text" : "password"} placeholder=""
                  autoComplete="new-password" className="pr-10" value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
                <button type="button" tabIndex={-1}
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-[11px] text-muted-foreground">Minimum 6 characters.</p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="u-password-confirm">Confirm Password <span className="text-red-500">*</span></Label>
              <Input id="u-password-confirm" type={showPassword ? "text" : "password"} placeholder=""
                autoComplete="new-password" value={form.passwordConfirm}
                onChange={e => setForm(f => ({ ...f, passwordConfirm: e.target.value }))} />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button type="submit" disabled={createUser.isPending}>
                {createUser.isPending ? "Creating…" : "Create Account"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirmation Dialog ───────────────────────────────── */}
      <Dialog open={!!showDeleteConfirm} onOpenChange={v => !v && setShowDeleteConfirm(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete User Account</DialogTitle>
            <DialogDescription>
              This will permanently delete <strong>{showDeleteConfirm?.name}</strong>'s account
              (<span className="font-mono text-xs">{showDeleteConfirm?.username}</span>).
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="pt-2">
            <Button variant="outline" onClick={() => setShowDeleteConfirm(null)}>Cancel</Button>
            <Button
              variant="destructive"
              disabled={deleteUser.isPending}
              onClick={() => showDeleteConfirm && deleteUser.mutate(showDeleteConfirm.id)}
            >
              {deleteUser.isPending ? "Deleting…" : "Delete Permanently"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
