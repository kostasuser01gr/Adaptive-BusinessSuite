import { lazy, Suspense, useEffect } from "react";
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppStateProvider, useAppState } from "./lib/store";
import { ErrorBoundary } from "./components/ErrorBoundary";

import AppLayout from "./components/layout/AppLayout";
// Keep auth and dashboard as static imports (primary entry points)
import AuthPage from "./pages/auth/AuthPage";
import DashboardPage from "./pages/dashboard/DashboardPage";
import NotFound from "@/pages/not-found";

// Lazy-load secondary pages
const FleetPage = lazy(() => import("./pages/fleet/FleetPage"));
const BookingsPage = lazy(() => import("./pages/bookings/BookingsPage"));
const CustomersPage = lazy(() => import("./pages/customers/CustomersPage"));
const TasksPage = lazy(() => import("./pages/tasks/TasksPage"));
const NotesPage = lazy(() => import("./pages/notes/NotesPage"));
const MaintenancePage = lazy(() => import("./pages/maintenance/MaintenancePage"));
const SettingsPage = lazy(() => import("./pages/settings/SettingsPage"));
const FinancialPage = lazy(() => import("./pages/financial/FinancialPage"));
const NexusUltraPage = lazy(() => import("./pages/nexus/NexusUltraPage"));
const TodayPage = lazy(() => import("./pages/today/TodayPage"));

function PageSkeleton() {
  return (
    <div className="flex h-full items-center justify-center p-8">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
    </div>
  );
}

function ProtectedRoute({
  component: Component,
}: {
  component: React.ComponentType;
  path?: string;
}) {
  const [, setLocation] = useLocation();
  const { isAuthenticated, isLoading } = useAppState();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      setLocation("/auth");
    }
  }, [isAuthenticated, isLoading, setLocation]);

  if (isLoading) return null;
  if (!isAuthenticated) return null;
  return <Component />;
}

function Router() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Switch>
        <Route path="/auth">
          <AuthPage />
        </Route>
        <Route path="/">
          <ProtectedRoute component={DashboardPage} />
        </Route>
        <Route path="/today">
          <ProtectedRoute component={TodayPage} />
        </Route>
        <Route path="/fleet">
          <ProtectedRoute component={FleetPage} />
        </Route>
        <Route path="/bookings">
          <ProtectedRoute component={BookingsPage} />
        </Route>
        <Route path="/customers">
          <ProtectedRoute component={CustomersPage} />
        </Route>
        <Route path="/tasks">
          <ProtectedRoute component={TasksPage} />
        </Route>
        <Route path="/notes">
          <ProtectedRoute component={NotesPage} />
        </Route>
        <Route path="/maintenance">
          <ProtectedRoute component={MaintenancePage} />
        </Route>
        <Route path="/settings">
          <ProtectedRoute component={SettingsPage} />
        </Route>
        <Route path="/financial">
          <ProtectedRoute component={FinancialPage} />
        </Route>
        <Route path="/nexus-ultra">
          <ProtectedRoute component={NexusUltraPage} />
        </Route>
        <Route>
          <NotFound />
        </Route>
      </Switch>
    </Suspense>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AppStateProvider>
          <TooltipProvider>
            <Toaster />
            <AppLayout>
              <Router />
            </AppLayout>
          </TooltipProvider>
        </AppStateProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
