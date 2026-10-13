import { fetchPrompts, PROMPTS_CACHE_STORAGE_KEY } from "./prompts-api"
import type { IPrompt } from "./types"
import {
  ACCESS_TOKEN_STORAGE_KEY,
  REFRESH_TOKEN_STORAGE_KEY,
  setAccessToken,
  setRefreshToken
} from "./utils/auth"
import { THEME_STORAGE_KEY, type ThemeMode } from "./utils/theme"

export const PROMPTHUB_GET_PROMPTS_MESSAGE = "PROMPTHUB_GET_PROMPTS"

export interface GetPromptsMessage {
  type: typeof PROMPTHUB_GET_PROMPTS_MESSAGE
  forceRefresh?: boolean
}

export interface GetPromptsResponse {
  ok: boolean
  prompts: IPrompt[]
  isAuthenticated: boolean
  theme?: ThemeMode
  error?: string
}

export async function handleGetPromptsMessage(
  forceRefresh: boolean = false
): Promise<GetPromptsResponse> {
  let storedAccessToken: string | null = null
  let storedRefreshToken: string | null = null
  let storedCache: IPrompt[] | null = null
  let storedTheme: ThemeMode | undefined

  if (typeof chrome !== "undefined" && chrome.storage?.local) {
    const data = await chrome.storage.local.get([
      ACCESS_TOKEN_STORAGE_KEY,
      REFRESH_TOKEN_STORAGE_KEY,
      PROMPTS_CACHE_STORAGE_KEY,
      THEME_STORAGE_KEY
    ])
    if (typeof data[ACCESS_TOKEN_STORAGE_KEY] === "string") {
      storedAccessToken = data[ACCESS_TOKEN_STORAGE_KEY]
    }
    if (typeof data[REFRESH_TOKEN_STORAGE_KEY] === "string") {
      storedRefreshToken = data[REFRESH_TOKEN_STORAGE_KEY]
    }
    if (Array.isArray(data[PROMPTS_CACHE_STORAGE_KEY])) {
      storedCache = data[PROMPTS_CACHE_STORAGE_KEY] as IPrompt[]
    }
    if (
      data[THEME_STORAGE_KEY] === "dark" ||
      data[THEME_STORAGE_KEY] === "light"
    ) {
      storedTheme = data[THEME_STORAGE_KEY]
    }
  }

  setAccessToken(storedAccessToken)
  setRefreshToken(storedRefreshToken)

  const isAuthenticated = Boolean(storedAccessToken || storedRefreshToken)

  if (!isAuthenticated) {
    return {
      ok: true,
      prompts: [],
      isAuthenticated: false,
      theme: storedTheme
    }
  }

  if (!forceRefresh && storedCache !== null) {
    return {
      ok: true,
      prompts: storedCache,
      isAuthenticated: true,
      theme: storedTheme
    }
  }

  try {
    const prompts = await fetchPrompts(storedAccessToken ?? undefined, true)
    return {
      ok: true,
      prompts,
      isAuthenticated: true,
      theme: storedTheme
    }
  } catch (error) {
    return {
      ok: false,
      prompts: storedCache ?? [],
      isAuthenticated,
      theme: storedTheme,
      error: error instanceof Error ? error.message : "Failed to load prompts"
    }
  }
}

export function registerBackgroundMessageListener(): void {
  if (typeof chrome === "undefined" || !chrome.runtime?.onMessage) {
    return
  }

  chrome.runtime.onMessage.addListener(
    (
      message: unknown,
      _sender: chrome.runtime.MessageSender,
      sendResponse: (response: GetPromptsResponse) => void
    ) => {
      if (
        typeof message === "object" &&
        message !== null &&
        (message as Partial<GetPromptsMessage>).type ===
          PROMPTHUB_GET_PROMPTS_MESSAGE
      ) {
        const forceRefresh = Boolean(
          (message as Partial<GetPromptsMessage>).forceRefresh
        )
        void handleGetPromptsMessage(forceRefresh).then(sendResponse)
        return true
      }
      return false
    }
  )
}

registerBackgroundMessageListener()
