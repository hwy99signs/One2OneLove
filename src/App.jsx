import './App.css'
import Pages from "@/pages/index.jsx"
import { Toaster } from "sonner"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { AuthProvider } from "@/contexts/AuthContext"

// Configure QueryClient with better cache management
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Refetch on window focus to get fresh data
      refetchOnWindowFocus: true,
      // Refetch when reconnecting to the internet
      refetchOnReconnect: true,
      // Retry failed requests
      retry: 1,
      // Cache data for 5 minutes instead of indefinitely
      staleTime: 5 * 60 * 1000, // 5 minutes
      // Keep unused data in cache for 10 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      // Refetch in background to keep data fresh
      refetchInterval: false, // Set to a number (ms) if you want periodic refetching
    },
  },
})

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
      <Pages />
      <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  )
}


export default App
