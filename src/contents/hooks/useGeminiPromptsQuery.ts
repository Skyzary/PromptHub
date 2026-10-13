import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useCallback } from "react"

import type { GetPromptsResponse } from "../../background"
import { loadPromptsForContentScript } from "../gemini-api"

export const GEMINI_PROMPTS_QUERY_KEY = ["gemini-prompts"] as const

export function useGeminiPromptsQuery(options?: { enabled?: boolean }) {
  const queryClient = useQueryClient()

  const query = useQuery<GetPromptsResponse>({
    queryKey: GEMINI_PROMPTS_QUERY_KEY,
    queryFn: () => loadPromptsForContentScript(false),
    enabled: options?.enabled ?? true,
    staleTime: 1000 * 60 * 5
  })

  const refreshPrompts = useCallback(async () => {
    try {
      return await queryClient.fetchQuery<GetPromptsResponse>({
        queryKey: GEMINI_PROMPTS_QUERY_KEY,
        queryFn: () => loadPromptsForContentScript(true)
      })
    } catch {
      return undefined
    }
  }, [queryClient])

  const result = query.data
  const prompts = result?.prompts ?? []
  const isAuthenticated = result?.isAuthenticated ?? true
  const errorMessage = query.error
    ? query.error instanceof Error
      ? query.error.message
      : "Failed to load prompts"
    : result && !result.ok && result.error
      ? result.error
      : null

  return {
    ...query,
    prompts,
    isAuthenticated,
    errorMessage,
    theme: result?.theme,
    refreshPrompts,
    isLoading: query.isLoading || (query.isFetching && !query.data)
  }
}
