import {
  PROMPTHUB_GET_PROMPTS_MESSAGE,
  type GetPromptsResponse
} from "../background"
import { fetchPrompts, PROMPTS_CACHE_STORAGE_KEY } from "../prompts-api"
import type { IPrompt } from "../types"
import { THEME_STORAGE_KEY, type ThemeMode } from "../utils/theme"

export async function loadPromptsForContentScript(
  forceRefresh: boolean = false
): Promise<GetPromptsResponse> {
  if (typeof chrome !== "undefined" && chrome.runtime?.sendMessage) {
    try {
      const response = (await chrome.runtime.sendMessage({
        type: PROMPTHUB_GET_PROMPTS_MESSAGE,
        forceRefresh
      })) as GetPromptsResponse | undefined

      if (response && Array.isArray(response.prompts)) {
        return response
      }
    } catch {
      // Fallback to storage or direct fetch below
    }
  }

  if (!forceRefresh && typeof chrome !== "undefined" && chrome.storage?.local) {
    const stored = await chrome.storage.local.get([
      PROMPTS_CACHE_STORAGE_KEY,
      THEME_STORAGE_KEY
    ])
    const cachedPrompts = stored[PROMPTS_CACHE_STORAGE_KEY]
    const storedTheme =
      stored[THEME_STORAGE_KEY] === "dark" ||
      stored[THEME_STORAGE_KEY] === "light"
        ? (stored[THEME_STORAGE_KEY] as ThemeMode)
        : undefined
    if (Array.isArray(cachedPrompts)) {
      return {
        ok: true,
        prompts: cachedPrompts as IPrompt[],
        isAuthenticated: true,
        theme: storedTheme
      }
    }
  }

  const prompts = await fetchPrompts(undefined, forceRefresh)
  return {
    ok: true,
    prompts,
    isAuthenticated: true
  }
}
