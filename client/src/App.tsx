import { useEffect } from "react";
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppStateProvider, useAppState } from "./lib/store";

import AppLayout from "./components/layout/AppLayout";
import AuthPage from "./pages/auth/AuthPage";
import DashboardPage from "./pages/dashboard/DashboardPage";
import FleetPage from "./pages/fleet/FleetPage";
import BookingsPage from "./pages/bookings/BookingsPage";
import CustomersPage from "./pages/customers/CustomersPage";
import TasksPage from "./pages/tasks/TasksPage";
import NotesPage from "./pages/notes/NotesPage";
import MaintenancePage from "./pages/maintenance/MaintenancePage";
import SettingsPage from "./pages/settings/SettingsPage";
import FinancialPage from "./pages/financial/FinancialPage";
import NexusUltraPage from "./pages/nexus/NexusUltraPage";
import NotFound from "@/pages/not-found";

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
    <Switch>
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
      <Route path="/nexus-ultra">
        <ProtectedRoute component={NexusUltraPage} />
      </Route>
      <Route>
        <NotFound />
      </Route>
    </Switch>
  );
}

function App() {
  return (
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
  );
}

export default App;
