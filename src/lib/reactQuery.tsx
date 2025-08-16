import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

// Create a client optimized for Firebase real-time updates
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Real-time data should be considered stale immediately
      staleTime: 0,
      // Keep data in cache for a reasonable time
      gcTime: 10 * 60 * 1000, // 10 minutes
      // Don't refetch on window focus as we have real-time updates
      refetchOnWindowFocus: false,
      // Enable background refetch for real-time updates
      refetchOnReconnect: true,
      // Retry configuration for Firebase operations
      retry: (failureCount, error) => {
        // Don't retry certain Firebase errors
        const errorMessage = error?.message?.toLowerCase() || "";
        if (
          errorMessage.includes("room not found") ||
          errorMessage.includes("room is full") ||
          errorMessage.includes("permission denied") ||
          errorMessage.includes("not found")
        ) {
          return false;
        }
        // Retry up to 3 times for other errors
        return failureCount < 3;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    mutations: {
      // Retry mutations once on failure
      retry: 1,
      retryDelay: 1000,
      // Network mode for mutations
      networkMode: "online",
    },
  },
});

interface ReactQueryProviderProps {
  children: ReactNode;
}

export function ReactQueryProvider({ children }: ReactQueryProviderProps) {
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

export { queryClient };
export default queryClient;
