import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/auth-context";
import NotFound from "@/pages/not-found";

import Home from "@/pages/home";
import Dashboard from "@/pages/dashboard";
import SearchCases from "@/pages/search";
import AllCases from "@/pages/cases";
import CaseDetail from "@/pages/case-detail";
import Parties from "@/pages/parties";
import Hearings from "@/pages/hearings";
import Fees from "@/pages/fees";
import Notices from "@/pages/notices";
import Documents from "@/pages/documents";
import Reports from "@/pages/reports";
import Calendar from "@/pages/calendar";
import Users from "@/pages/users";
import Settings from "@/pages/settings";
import AuditLogs from "@/pages/audit-logs";
import UpdateCase from "@/pages/update-case";
import NewCase from "@/pages/new-case";
import Login from "@/pages/login";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    }
  }
});

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return null;
  if (!isAuthenticated) {
    window.location.href = "/login";
    return null;
  }
  return <Component />;
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/" component={Home} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/search" component={SearchCases} />
      <Route path="/cases" component={AllCases} />
      <Route path="/cases/new" component={NewCase} />
      <Route path="/cases/:id/update" component={UpdateCase} />
      <Route path="/cases/:id" component={CaseDetail} />
      <Route path="/update-case" component={UpdateCase} />
      <Route path="/parties" component={Parties} />
      <Route path="/hearings" component={Hearings} />
      <Route path="/fees" component={Fees} />
      <Route path="/notices" component={Notices} />
      <Route path="/documents" component={Documents} />
      <Route path="/reports" component={Reports} />
      <Route path="/calendar" component={Calendar} />
      <Route path="/users">{() => <ProtectedRoute component={Users} />}</Route>
      <Route path="/settings">{() => <ProtectedRoute component={Settings} />}</Route>
      <Route path="/audit-logs">{() => <ProtectedRoute component={AuditLogs} />}</Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
        </AuthProvider>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
