import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  Search, 
  Files, 
  Users, 
  CalendarDays, 
  CreditCard, 
  BellRing, 
  FileText, 
  BarChart3, 
  Calendar, 
  UserCog, 
  Settings, 
  ShieldAlert,
  Scale,
  Menu,
  ClipboardEdit,
  FilePlus2,
  LogOut,
  LogIn,
  Lock,
} from "lucide-react";
import { Button } from "./ui/button";
import { Sheet, SheetContent, SheetTrigger } from "./ui/sheet";
import { useState } from "react";
import { useAuth } from "@/contexts/auth-context";

interface LayoutProps {
  children: React.ReactNode;
}

const publicNavItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/search", label: "Case Search", icon: Search },
  { href: "/cases", label: "All Cases", icon: Files },
  { href: "/parties", label: "Parties", icon: Users },
  { href: "/hearings", label: "Hearings/Dates", icon: CalendarDays },
  { href: "/fees", label: "Fees/Payments", icon: CreditCard },
  { href: "/notices", label: "Notices", icon: BellRing },
  { href: "/documents", label: "Documents", icon: FileText },
  { href: "/reports", label: "Reports", icon: BarChart3 },
  { href: "/calendar", label: "Calendar", icon: Calendar },
];

const staffNavItems = [
  { href: "/cases/new", label: "New Case", icon: FilePlus2, requiresClerk: true },
  { href: "/update-case", label: "Update Case", icon: ClipboardEdit, requiresClerk: true },
];

const adminNavItems = [
  { href: "/users", label: "Users", icon: UserCog },
  { href: "/settings", label: "Settings", icon: Settings },
  { href: "/audit-logs", label: "Audit Logs", icon: ShieldAlert },
];

export function Layout({ children }: LayoutProps) {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, isAuthenticated, isClerk, isAdmin, logout } = useAuth();

  const userInitials = user?.name
    ? user.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()
    : "?";

  const NavContent = () => (
    <nav className="space-y-1 p-4">
      {/* Public items */}
      {publicNavItems.map((item) => {
        const isActive = location === item.href || location.startsWith(`${item.href}/`);
        return (
          <Link key={item.href} href={item.href}>
            <span
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors cursor-pointer",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </span>
          </Link>
        );
      })}

      {/* Staff/clerk section */}
      {isClerk && (
        <>
          <div className="pt-3 pb-1">
            <p className="px-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
              Case Management
            </p>
          </div>
          {staffNavItems.map((item) => {
            const isActive = location === item.href || location.startsWith(`${item.href}/`);
            return (
              <Link key={item.href} href={item.href}>
                <span
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors cursor-pointer",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </span>
              </Link>
            );
          })}
        </>
      )}

      {/* Admin section */}
      {isAdmin && (
        <>
          <div className="pt-3 pb-1">
            <p className="px-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
              Administration
            </p>
          </div>
          {adminNavItems.map((item) => {
            const isActive = location === item.href;
            return (
              <Link key={item.href} href={item.href}>
                <span
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors cursor-pointer",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </span>
              </Link>
            );
          })}
        </>
      )}

      {/* Login prompt for public users */}
      {!isAuthenticated && (
        <>
          <div className="pt-3 pb-1">
            <p className="px-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
              Staff Access
            </p>
          </div>
          <Link href="/login">
            <span
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors cursor-pointer text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <LogIn className="h-4 w-4" />
              Staff Sign In
            </span>
          </Link>
          <div className="px-3 py-2 rounded-md border border-dashed border-border mt-1">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Lock className="h-3 w-3 flex-shrink-0" />
              <span>New Case, Update Case, Users, Settings, and Audit Logs require staff login.</span>
            </div>
          </div>
        </>
      )}
    </nav>
  );

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-30 flex h-16 items-center border-b bg-primary px-4 sm:px-6 shadow-sm">
        <div className="flex items-center gap-4">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden text-primary-foreground hover:bg-primary/90">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0 overflow-y-auto">
              <div className="flex h-16 items-center border-b px-6 bg-primary">
                <div className="flex items-center gap-2 text-primary-foreground font-semibold">
                  <Scale className="h-5 w-5" />
                  <span>Dallas Probate CMS</span>
                </div>
              </div>
              <NavContent />
            </SheetContent>
          </Sheet>
          <Link href="/">
            <span className="flex items-center gap-2 font-semibold text-primary-foreground cursor-pointer">
              <Scale className="h-6 w-6" />
              <span className="hidden sm:inline-block">Statutory Probate Courts – Dallas County</span>
              <span className="sm:hidden">Dallas Probate CMS</span>
            </span>
          </Link>
        </div>

        <div className="ml-auto flex items-center gap-3">
          {isAuthenticated ? (
            <>
              <div className="hidden sm:block text-right">
                <p className="text-xs font-medium text-primary-foreground leading-none">{user?.name}</p>
                <p className="text-[10px] text-primary-foreground/70 mt-0.5 capitalize">{user?.role}</p>
              </div>
              <div className="h-8 w-8 rounded-full bg-primary-foreground/10 flex items-center justify-center text-primary-foreground text-xs font-bold border border-primary-foreground/20 select-none">
                {userInitials}
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="text-primary-foreground hover:bg-primary/90"
                onClick={async () => { await logout(); window.location.href = "/"; }}
                title="Sign out"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <Link href="/login">
              <Button variant="ghost" size="sm" className="text-primary-foreground hover:bg-primary/90 gap-1.5">
                <LogIn className="h-4 w-4" />
                <span className="hidden sm:inline">Staff Sign In</span>
              </Button>
            </Link>
          )}
        </div>
      </header>

      <div className="flex flex-1">
        <aside className="hidden w-64 flex-col border-r bg-card md:flex overflow-y-auto">
          <div className="flex-1">
            <NavContent />
          </div>
        </aside>
        
        <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
