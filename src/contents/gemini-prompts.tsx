import type { PlasmoCSConfig } from "plasmo"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"

import {
  PROMPTHUB_GET_PROMPTS_MESSAGE,
  type GetPromptsResponse
} from "../background"
import { fetchPrompts, PROMPTS_CACHE_STORAGE_KEY } from "../prompts-api"
import type { IPrompt } from "../types"
import { THEME_STORAGE_KEY, type ThemeMode } from "../utils/theme"
import css from "./gemini-prompts.module.scss"

import {
  computeGeminiPopoverPosition,
  detectGeminiPageTheme,
  findGeminiInput,
  getOrCreateGeminiRootContainer,
  insertTextIntoGeminiInput
} from "./gemini-dom"

export const config: PlasmoCSConfig = {
  matches: ["https://gemini.google.com/*"]
}

// Re-export DOM helpers for backwards-compatibility with tests and external consumers
export const getRootContainer = getOrCreateGeminiRootContainer
export const findGeminiInputTarget = findGeminiInput
export const computePopoverPosition = computeGeminiPopoverPosition
export const insertPromptIntoElement = insertTextIntoGeminiInput
export const detectPageTheme = detectGeminiPageTheme

async function loadPromptsForContentScript(
  forceRefresh: boolean
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

  if (
    !forceRefresh &&
    typeof chrome !== "undefined" &&
    chrome.storage?.local
  ) {
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

export const GeminiPromptsOverlay = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [prompts, setPrompts] = useState<IPrompt[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [theme, setTheme] = useState<ThemeMode>(() => detectPageTheme())
  const [position, setPosition] = useState<{ top: number; left: number }>({
    top: 24,
    left: 24
  })

  const activeInputRef = useRef<HTMLElement | null>(null)
  const popoverRef = useRef<HTMLDivElement | null>(null)

  const loadPrompts = useCallback(async (forceRefresh: boolean = false) => {
    setIsLoading(true)
    setErrorMessage(null)
    try {
      const result = await loadPromptsForContentScript(forceRefresh)
      setPrompts(result.prompts)
      setIsAuthenticated(result.isAuthenticated)
      setTheme(result.theme ?? detectPageTheme())
      if (!result.ok && result.error) {
        setErrorMessage(result.error)
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to load prompts"
      )
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    const handleStorageChanged = (
      changes: Record<string, chrome.storage.StorageChange>
    ) => {
      const themeChange = changes[THEME_STORAGE_KEY]
      if (
        themeChange?.newValue === "dark" ||
        themeChange?.newValue === "light"
      ) {
        setTheme(themeChange.newValue)
      }
    }

    if (typeof chrome !== "undefined" && chrome.storage?.onChanged) {
      chrome.storage.onChanged.addListener(handleStorageChanged)
    }

    return () => {
      if (typeof chrome !== "undefined" && chrome.storage?.onChanged) {
        chrome.storage.onChanged.removeListener(handleStorageChanged)
      }
    }
  }, [])

  useEffect(() => {
    const openForTarget = (target: EventTarget | null) => {
      const matchedInput = findGeminiInput(target, popoverRef.current)
      if (!matchedInput) {
        return
      }
      activeInputRef.current = matchedInput
      setPosition(
        computeGeminiPopoverPosition(matchedInput.getBoundingClientRect())
      )
      setIsOpen(true)
    }

    const handleFocusIn = (event: FocusEvent) => {
      openForTarget(event.target)
    }

    const handleClick = (event: MouseEvent) => {
      openForTarget(event.target)
    }

    const handleMouseDownOutside = (event: MouseEvent) => {
      const target = event.target
      if (!(target instanceof Node)) {
        return
      }
      if (popoverRef.current?.contains(target)) {
        return
      }
      if (activeInputRef.current?.contains(target)) {
        return
      }
      setIsOpen(false)
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false)
      }
    }

    document.addEventListener("focusin", handleFocusIn, true)
    document.addEventListener("click", handleClick, true)
    document.addEventListener("mousedown", handleMouseDownOutside, true)
    document.addEventListener("keydown", handleKeyDown, true)

    return () => {
      document.removeEventListener("focusin", handleFocusIn, true)
      document.removeEventListener("click", handleClick, true)
      document.removeEventListener("mousedown", handleMouseDownOutside, true)
      document.removeEventListener("keydown", handleKeyDown, true)
    }
  }, [])

  useEffect(() => {
    if (isOpen) {
      void loadPrompts(false)
    }
  }, [isOpen, loadPrompts])

  const filteredPrompts = useMemo(() => {
    const tokens = searchQuery
      .trim()
      .toLowerCase()
      .split(/\s+/)
      .filter(Boolean)

    if (tokens.length === 0) {
      return prompts
    }

    return prompts.filter((prompt) => {
      const titleLower = prompt.title.toLowerCase()
      const bodyLower = prompt.body.toLowerCase()
      const tagsLower = (prompt.tags ?? []).map((t) => t.toLowerCase())

      return tokens.every((token) => {
        if (token.startsWith("#") && token.length > 1) {
          const tagQuery = token.slice(1)
          return tagsLower.some((tag) => tag.includes(tagQuery))
        }
        return (
          titleLower.includes(token) ||
          bodyLower.includes(token) ||
          tagsLower.some((tag) => tag.includes(token))
        )
      })
    })
  }, [prompts, searchQuery])

  const handleSelectPrompt = (prompt: IPrompt) => {
    if (activeInputRef.current) {
      insertTextIntoGeminiInput(activeInputRef.current, prompt.body)
    }
    setIsOpen(false)
  }

  if (!isOpen) {
    return null
  }

  return (
    <div
      ref={popoverRef}
      className={css.popover}
      data-theme={theme}
      style={{ top: `${position.top}px`, left: `${position.left}px` }}
      role="dialog"
      aria-label="PromptHub Gemini Prompts">
      <div className={css.header}>
        <div className={css.brand}>
          <span className={css.logoBadge}>PH</span>
          <h3 className={css.title}>PromptHub</h3>
        </div>
        <div className={css.headerActions}>
          <button
            type="button"
            className={css.iconBtn}
            onClick={() => void loadPrompts(true)}
            disabled={isLoading}
            aria-label="Refresh prompts"
            title="Refresh prompts">
            ↻
          </button>
          <button
            type="button"
            className={css.iconBtn}
            onClick={() => setIsOpen(false)}
            aria-label="Close prompts popover"
            title="Close">
            ×
          </button>
        </div>
      </div>

      <div className={css.searchBar}>
        <input
          type="text"
          className={css.searchInput}
          placeholder="Search prompts or #tag..."
          aria-label="Search Gemini prompts"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className={css.stateBox}>Loading prompts...</div>
      ) : !isAuthenticated ? (
        <div className={css.stateBox}>
          Please sign in via the PromptHub extension popup to see your prompts.
        </div>
      ) : errorMessage ? (
        <div className={css.errorBox} role="alert">
          {errorMessage}
        </div>
      ) : filteredPrompts.length === 0 ? (
        <div className={css.stateBox}>
          {prompts.length === 0
            ? "No prompts saved yet."
            : "No prompts match your search."}
        </div>
      ) : (
        <ul className={css.list}>
          {filteredPrompts.map((prompt) => (
            <li key={prompt._id}>
              <button
                type="button"
                className={css.promptItem}
                onClick={() => handleSelectPrompt(prompt)}>
                <div className={css.promptHeader}>
                  <span className={css.promptTitle}>{prompt.title}</span>
                  <span className={css.insertHint}>Insert</span>
                </div>
                <span className={css.promptPreview}>{prompt.body}</span>
                {prompt.tags && prompt.tags.length > 0 && (
                  <div className={css.tagRow}>
                    {prompt.tags.map((tag) => (
                      <span key={tag} className={css.tagBadge}>
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default GeminiPromptsOverlay
