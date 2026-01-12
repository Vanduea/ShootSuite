/**
 * TanStack Query Client Configuration with Offline Persistence
 */

import { QueryClient } from '@tanstack/react-query'
import { persistQueryClient } from '@tanstack/react-query-persist-client'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes (formerly cacheTime)
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

// Persist query client for offline support (client-side only)
if (typeof window !== 'undefined') {
  try {
    // Simple localStorage persister
    const persister = {
      persistClient: async (client: any) => {
        try {
          window.localStorage.setItem('SHOOTSUITE_QUERY_CACHE', JSON.stringify(client))
        } catch (error) {
          console.warn('Failed to persist query client:', error)
        }
      },
      restoreClient: async () => {
        try {
          const cached = window.localStorage.getItem('SHOOTSUITE_QUERY_CACHE')
          return cached ? JSON.parse(cached) : undefined
        } catch (error) {
          console.warn('Failed to restore query client:', error)
          return undefined
        }
      },
      removeClient: async () => {
        try {
          window.localStorage.removeItem('SHOOTSUITE_QUERY_CACHE')
        } catch (error) {
          console.warn('Failed to remove query client:', error)
        }
      },
    }

    persistQueryClient({
      queryClient,
      persister: persister as any,
      maxAge: 1000 * 60 * 60 * 24, // 24 hours
    })
  } catch (error) {
    // Silently fail if localStorage is not available
    console.warn('Failed to initialize query persistence:', error)
  }
}

