import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { useAuth } from "./_core/hooks/useAuth";
import DashboardLayout from "./components/DashboardLayout";
import LoginPage from "./pages/Login";
import ManagerDashboard from "./pages/ManagerDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import BranchCheckIn from "./pages/BranchCheckIn";
import VisitHistory from "./pages/VisitHistory";
import AdminBranches from "./pages/AdminBranches";
import AdminManagers from "./pages/AdminManagers";
import AdminReports from "./pages/AdminReports";
import AdminUsers from "./pages/AdminUsers";
import AdminLiveTracking from "./pages/AdminLiveTracking";
import SyncPage from "./pages/SyncPage";
import ManagerReports from "./pages/ManagerReports";
import AreaManagerSchedule from "./pages/AreaManagerSchedule";
import { DashboardLayoutSkeleton } from "./components/DashboardLayoutSkeleton";
import { useGeofence } from "./hooks/useGeofence";
import { LocationPermissionGuide } from "./components/LocationPermissionGuide";
import { useLocationPermissionState } from "./hooks/useLocationPermission";
import { Capacitor } from "@capacitor/core";
import { createContext, useContext, useEffect } from "react";
import { ManagerBottomNav } from "./components/ManagerBottomNav";
import { LocalNotifications } from "@capacitor/local-notifications";
// ── Geofence Context — share the single GPS watcher with all pages ─────────
interface GeofenceContextValue {
  latestLocation: {
    lat: number;
    lon: number;
    accuracy?: number;
    isMocked: boolean;
  } | null;
}
const GeofenceContext = createContext<GeofenceContextValue>({ latestLocation: null });
export const useGeofenceContext = () => useContext(GeofenceContext);

// Separate component so hooks follow Rules of Hooks correctly
function ManagerGeofenceProvider({ children }: { children: React.ReactNode }) {
  // ✅ Single watcher — runs globally and survives page navigation
  const { latestLocation } = useGeofence();

  const { shouldShow, dismiss } = useLocationPermissionState();
  const showGuide = shouldShow && Capacitor.isNativePlatform();

  // Request Notification Permissions on mount
  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      LocalNotifications.requestPermissions().catch(console.error);
    }
  }, []);

  return (
    <GeofenceContext.Provider value={{ latestLocation }}>
      {children}
      <ManagerBottomNav />
      {showGuide && (
        <LocationPermissionGuide
          onDismiss={dismiss}
          onPermissionGranted={dismiss}
        />
      )}
    </GeofenceContext.Provider>
  );
}

function ProtectedRouter() {
  const { user, loading } = useAuth();

  if (loading) {
    return <DashboardLayoutSkeleton />;
  }

  if (!user) {
    return <LoginPage />;
  }

  const isAdmin = user.role === "admin" || user.role === "superadmin";
  // area_manager = مدير المنطقة (الدور القديم "user" مُعاد تسميته)
  // branch_manager = مدير فرع جديد — نفس الواجهة المحمولة مع قيود مختلفة
  const isFieldManager = user.role === "area_manager" || user.role === "branch_manager" || user.role === "user";

  // ── Admin / Superadmin: white card layout ─────────────────────────────────
  if (isAdmin) {
    return (
      <DashboardLayout>
        <Switch>
          <Route path="/" component={AdminDashboard} />
          <Route path="/dashboard" component={AdminDashboard} />
          <Route path="/branches" component={AdminBranches} />
          <Route path="/live-map" component={AdminLiveTracking} />
          <Route path="/managers" component={AdminManagers} />
          <Route path="/users" component={AdminUsers} />
          <Route path="/reports" component={AdminReports} />
          <Route component={NotFound} />
        </Switch>
      </DashboardLayout>
    );
  }

  // ── Area Manager / Branch Manager: dark mobile layout ─────────────────────
  if (isFieldManager) {
    const managerRoutes = (
      <Switch>
        <Route path="/" component={ManagerDashboard} />
        <Route path="/dashboard" component={ManagerDashboard} />
        <Route path="/check-in" component={BranchCheckIn} />
        <Route path="/history" component={VisitHistory} />
        <Route path="/reports" component={ManagerReports} />
        <Route path="/sync" component={SyncPage} />
        {/* جدول الزيارات الأسبوعي — متاح لمدير المنطقة فقط، الصفحة تتحقق من الدور */}
        <Route path="/schedule" component={AreaManagerSchedule} />
        <Route component={NotFound} />
      </Switch>
    );

    return <ManagerGeofenceProvider>{managerRoutes}</ManagerGeofenceProvider>;
  }

  // Fallback
  return <LoginPage />;
}


function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          <ProtectedRouter />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
