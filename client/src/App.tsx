import React, { Suspense, useEffect } from "react";
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { AnimatePresence, MotionConfig } from "framer-motion";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppStateProvider, useAppState } from "./lib/store";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { PageTransition } from "@/components/animation/PageTransition";
import { Spinner } from "@/components/ui/spinner";

import AppLayout from "./components/layout/AppLayout";
import AuthPage from "./pages/auth/AuthPage";

// Lazy-loaded page components for code splitting
const DashboardPage = React.lazy(() => import("./pages/dashboard/DashboardPage"));
const FleetPage = React.lazy(() => import("./pages/fleet/FleetPage"));
const BookingsPage = React.lazy(() => import("./pages/bookings/BookingsPage"));
const CustomersPage = React.lazy(() => import("./pages/customers/CustomersPage"));
const TasksPage = React.lazy(() => import("./pages/tasks/TasksPage"));
const NotesPage = React.lazy(() => import("./pages/notes/NotesPage"));
const MaintenancePage = React.lazy(() => import("./pages/maintenance/MaintenancePage"));
const SettingsPage = React.lazy(() => import("./pages/settings/SettingsPage"));
const FinancialPage = React.lazy(() => import("./pages/financial/FinancialPage"));
const AnalyticsPage = React.lazy(() => import("./pages/analytics/AnalyticsPage"));
const NexusUltraPage = React.lazy(() => import("./pages/nexus/NexusUltraPage"));
const NotFound = React.lazy(() => import("@/pages/not-found"));

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[300px]">
      <Spinner className="h-8 w-8 text-muted-foreground" />
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
  return (
    <ErrorBoundary>
      <Suspense fallback={<PageLoader />}>
        <PageTransition>
          <Component />
        </PageTransition>
      </Suspense>
    </ErrorBoundary>
  );
}

function Router() {
  const [location] = useLocation();
  return (
    <AnimatePresence mode="wait">
    <Switch key={location}>
      <Route path="/auth">
        <AuthPage />
      </Route>
      <Route path="/">
        <ProtectedRoute component={DashboardPage} />
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
      <Route path="/analytics">
        <ProtectedRoute component={AnalyticsPage} />
      </Route>
      <Route path="/nexus-ultra">
        <ProtectedRoute component={NexusUltraPage} />
      </Route>
      <Route>
        <Suspense fallback={<PageLoader />}>
          <NotFound />
        </Suspense>
      </Route>
    </Switch>
    </AnimatePresence>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppStateProvider>
        <MotionConfig reducedMotion="user">
          <TooltipProvider>
            <Toaster />
            <AppLayout>
              <Router />
            </AppLayout>
          </TooltipProvider>
        </MotionConfig>
      </AppStateProvider>
    </QueryClientProvider>
  );
}

export default App;
