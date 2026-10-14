import { QueryClient } from "@tanstack/react-query"

export const createDefaultQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        refetchOnWindowFocus: false,
        gcTime: 0
      }
    }
  })
