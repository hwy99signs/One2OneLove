import './App.css'
import Pages from "@/pages/index.jsx"
import Admin from "@/pages/Admin.jsx"
import Analytics from "@/pages/Analytics.jsx"
import LoveNotesLimitAddSends from "@/components/lovenotes/LoveNotesLimitAddSends.jsx"
import DateIdeasPlanAccess from "@/components/dateideas/DateIdeasPlanAccess.jsx"
import SubscriptionLaunchNotice from "@/components/subscriptions/SubscriptionLaunchNotice.jsx"
import ProfileLaunchFixes from "@/components/profile/ProfileLaunchFixes.jsx"
import LaunchSurfaceCleanup from "@/components/launch/LaunchSurfaceCleanup.jsx"
import AdminFeatureHeaderLock from "@/components/admin/AdminFeatureHeaderLock.jsx"
import AdminEntryTab from "@/components/admin/AdminEntryTab.jsx"
import AdminMfaGate from "@/components/admin/AdminMfaGate.jsx"
import AdminUserModeToggle from "@/components/admin/AdminUserModeToggle.jsx"
import { Toaster } from "@/components/ui/toaster"
import { Toaster as SonnerToaster } from "sonner"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { BrowserRouter } from "react-router-dom"
import { AuthProvider } from "@/contexts/AuthContext"

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      retry: 1,
      staleTime: 5 * 60 * 1000,
      cacheTime: 10 * 60 * 1000,
      refetchInterval: false,
    },
  },
})

function App() {
  const pathname = window.location.pathname.toLowerCase();
  const isAdminRoute = pathname === '/admin' || pathname === '/admin/';
  const isAnalyticsRoute = pathname === '/analytics' || pathname === '/analytics/';

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        {isAdminRoute ? (
          <BrowserRouter>
            <AdminMfaGate><Admin /></AdminMfaGate>
          </BrowserRouter>
        ) : isAnalyticsRoute ? (
          <BrowserRouter>
            <AdminMfaGate><Analytics /></AdminMfaGate>
          </BrowserRouter>
        ) : (
          <Pages />
        )}
        <AdminEntryTab />
        <AdminUserModeToggle />
        <LoveNotesLimitAddSends />
        <DateIdeasPlanAccess />
        <SubscriptionLaunchNotice />
        <ProfileLaunchFixes />
        <LaunchSurfaceCleanup />
        <AdminFeatureHeaderLock />
        <Toaster />
        <SonnerToaster richColors position="top-center" />
      </AuthProvider>
    </QueryClientProvider>
  )
}

export default App
