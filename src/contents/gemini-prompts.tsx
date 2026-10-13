import type { PlasmoCSConfig } from "plasmo"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"

import {
  PROMPTHUB_GET_PROMPTS_MESSAGE,
  type GetPromptsResponse
} from "../background"
import TemplateHighlight from "../components/TemplateHighlight/TemplateHighlight"
import { fetchPrompts, PROMPTS_CACHE_STORAGE_KEY } from "../prompts-api"
import type { IPrompt } from "../types"
import { THEME_STORAGE_KEY, type ThemeMode } from "../utils/theme"
import {
  cleanTemplateBracketsInInput,
  computeGeminiPopoverPosition,
  detectGeminiPageTheme,
  findGeminiInput,
  findGeminiInputContainer,
  GEMINI_INPUT_SELECTOR,
  getOrCreateGeminiRootContainer,
  handleGeminiSendTrigger,
  handleGeminiTemplateKeyDown,
  handleGeminiTemplatePaste,
  handleTemplateVariableTyping,
  insertTextIntoGeminiInput,
  jumpToNextTemplateVariable,
  type GeminiPopoverPosition
} from "./gemini-dom"
import css from "./gemini-prompts.module.scss"

export const config: PlasmoCSConfig = {
  matches: ["https://gemini.google.com/*"]
}

// Re-export DOM helpers for backwards-compatibility with tests and external consumers
export const getRootContainer = getOrCreateGeminiRootContainer
export const findGeminiInputTarget = findGeminiInput
export const computePopoverPosition = computeGeminiPopoverPosition
export const insertPromptIntoElement = insertTextIntoGeminiInput
export const detectPageTheme = detectGeminiPageTheme
export {
  cleanTemplateBracketsInInput,
  findGeminiInputContainer,
  handleGeminiSendTrigger,
  handleGeminiTemplateKeyDown,
  handleGeminiTemplatePaste,
  handleTemplateVariableTyping,
  jumpToNextTemplateVariable
}

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

const SparkleIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true">
    <path
      d="M12 2L14.4 9.6L22 12L14.4 14.4L12 22L9.6 14.4L2 12L9.6 9.6L12 2Z"
      fill="url(#gemini-sparkle-grad)"
    />
    <defs>
      <linearGradient
        id="gemini-sparkle-grad"
        x1="2"
        y1="2"
        x2="22"
        y2="22"
        gradientUnits="userSpaceOnUse">
        <stop stopColor="#4285f4" />
        <stop
          offset="0.5"
          stopColor="#9b72cb"
        />
        <stop
          offset="1"
          stopColor="#d96570"
        />
      </linearGradient>
    </defs>
  </svg>
)

const SearchIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true">
    <circle
      cx="11"
      cy="11"
      r="8"
    />
    <line
      x1="21"
      y1="21"
      x2="16.65"
      y2="16.65"
    />
  </svg>
)

const RefreshIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true">
    <path d="M21.5 2v6h-6" />
    <path d="M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-1.19" />
  </svg>
)

const CloseIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true">
    <line
      x1="18"
      y1="6"
      x2="6"
      y2="18"
    />
    <line
      x1="6"
      y1="6"
      x2="18"
      y2="18"
    />
  </svg>
)

const EnterIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    width="12"
    height="12"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true">
    <polyline points="9 10 4 15 9 20" />
    <path d="M20 4v7a4 4 0 0 1-4 4H4" />
  </svg>
)

export const GeminiPromptsOverlay = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [prompts, setPrompts] = useState<IPrompt[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [theme, setTheme] = useState<ThemeMode>(() => detectPageTheme())
  const [selectedIndex, setSelectedIndex] = useState<number>(0)
  const selectedIndexRef = useRef<number>(selectedIndex)
  selectedIndexRef.current = selectedIndex
  const listRef = useRef<HTMLUListElement | null>(null)

  const [position, setPosition] = useState<GeminiPopoverPosition>({
    top: 24,
    left: 24,
    width: 360,
    dockedAbove: true
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
      const container = findGeminiInputContainer(matchedInput)
      const containerRect = container ? container.getBoundingClientRect() : null
      setPosition(
        computeGeminiPopoverPosition(
          matchedInput.getBoundingClientRect(),
          containerRect
        )
      )
      setIsOpen(true)
    }

    const handleFocusIn = (event: FocusEvent) => {
      openForTarget(event.target)
    }

    const handlePointerDown = (event: PointerEvent) => {
      handleGeminiSendTrigger(event, activeInputRef.current)
    }

    const handleClick = (event: MouseEvent) => {
      handleGeminiSendTrigger(event, activeInputRef.current)
      openForTarget(event.target)
    }

    const handleMouseDownOutside = (event: MouseEvent) => {
      handleGeminiSendTrigger(event, activeInputRef.current)
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

    const handleSubmit = (event: Event) => {
      handleGeminiSendTrigger(event, activeInputRef.current)
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      // 1. If drawer is closed, delegate to template variable keyboard handling
      if (!isOpen) {
        handleGeminiTemplateKeyDown(event)
        return
      }

      // 2. Drawer is open:
      if (event.key === "Escape") {
        event.preventDefault()
        event.stopPropagation()
        setIsOpen(false)
        return
      }

      const target = event.target as Node | null
      const isInsidePopover = Boolean(popoverRef.current?.contains(target))
      const isGeminiInputTarget =
        target === activeInputRef.current ||
        (target instanceof HTMLElement && Boolean(findGeminiInput(target)))

      // Allow navigation when interacting with popover, Gemini input, or document body
      if (
        isInsidePopover ||
        isGeminiInputTarget ||
        !target ||
        target === document.body
      ) {
        if (event.key === "ArrowDown") {
          event.preventDefault()
          event.stopPropagation()
          setSelectedIndex((prev) => {
            const count = Math.max(1, filteredPromptsRef.current.length)
            const next = (prev + 1) % count
            selectedIndexRef.current = next
            return next
          })
          return
        }

        if (event.key === "ArrowUp") {
          event.preventDefault()
          event.stopPropagation()
          setSelectedIndex((prev) => {
            const count = Math.max(1, filteredPromptsRef.current.length)
            const next = (prev - 1 + count) % count
            selectedIndexRef.current = next
            return next
          })
          return
        }

        if (
          (event.key === "Enter" &&
            !event.shiftKey &&
            !event.ctrlKey &&
            !event.metaKey &&
            !event.altKey) ||
          event.key === "Tab"
        ) {
          const list = filteredPromptsRef.current
          const currentIdx = selectedIndexRef.current
          if (list.length > 0 && currentIdx >= 0 && currentIdx < list.length) {
            event.preventDefault()
            event.stopPropagation()
            handleSelectPrompt(list[currentIdx])
            return
          }
        }
      }

      // If key was not handled by drawer, let template handler process it
      if (handleGeminiTemplateKeyDown(event)) {
        return
      }
    }

    const handlePaste = (event: ClipboardEvent) => {
      handleGeminiTemplatePaste(event)
    }

    document.addEventListener("focusin", handleFocusIn, true)
    document.addEventListener("pointerdown", handlePointerDown, true)
    document.addEventListener("mousedown", handleMouseDownOutside, true)
    document.addEventListener("click", handleClick, true)
    document.addEventListener("paste", handlePaste, true)
    document.addEventListener("submit", handleSubmit, true)
    document.addEventListener("keydown", handleKeyDown, true)

    return () => {
      document.removeEventListener("focusin", handleFocusIn, true)
      document.removeEventListener("pointerdown", handlePointerDown, true)
      document.removeEventListener("mousedown", handleMouseDownOutside, true)
      document.removeEventListener("click", handleClick, true)
      document.removeEventListener("paste", handlePaste, true)
      document.removeEventListener("submit", handleSubmit, true)
      document.removeEventListener("keydown", handleKeyDown, true)
    }
  }, [isOpen])

  // Keep drawer aligned on window resize or scroll
  useEffect(() => {
    if (!isOpen) return

    const updatePosition = () => {
      if (!activeInputRef.current) return
      const container = findGeminiInputContainer(activeInputRef.current)
      const containerRect = container ? container.getBoundingClientRect() : null
      setPosition(
        computeGeminiPopoverPosition(
          activeInputRef.current.getBoundingClientRect(),
          containerRect
        )
      )
    }

    window.addEventListener("resize", updatePosition)
    window.addEventListener("scroll", updatePosition, true)
    return () => {
      window.removeEventListener("resize", updatePosition)
      window.removeEventListener("scroll", updatePosition, true)
    }
  }, [isOpen])

  useEffect(() => {
    if (isOpen) {
      void loadPrompts(false)
    }
  }, [isOpen, loadPrompts])

  const filteredPrompts = useMemo(() => {
    const tokens = searchQuery.trim().toLowerCase().split(/\s+/).filter(Boolean)

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

  const filteredPromptsRef = useRef(filteredPrompts)
  filteredPromptsRef.current = filteredPrompts

  useEffect(() => {
    setSelectedIndex(0)
    selectedIndexRef.current = 0
  }, [searchQuery])

  useEffect(() => {
    if (isOpen) {
      setSelectedIndex(0)
      selectedIndexRef.current = 0
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen || !listRef.current) return
    const buttons = listRef.current.querySelectorAll("button")
    const activeBtn = buttons[selectedIndex]
    activeBtn?.scrollIntoView?.({ block: "nearest" })
  }, [selectedIndex, isOpen])

  const handleSelectPrompt = (prompt: IPrompt) => {
    const input =
      activeInputRef.current ??
      findGeminiInput(document.activeElement) ??
      document.querySelector<HTMLElement>(GEMINI_INPUT_SELECTOR)
    if (input) {
      activeInputRef.current = input
      insertTextIntoGeminiInput(input, prompt.body)
    }
    setIsOpen(false)
  }

  if (!isOpen) {
    return null
  }

  const isDockedAbove = position.dockedAbove && position.bottom !== undefined

  return (
    <div
      ref={popoverRef}
      className={`${css.popover} ${
        position.dockedAbove ? css.dockedAbove : css.dockedBelow
      }`}
      data-theme={theme}
      style={{
        left: `${position.left}px`,
        width: `${position.width}px`,
        ...(isDockedAbove
          ? { bottom: `${position.bottom}px` }
          : { top: `${position.top}px` })
      }}
      role="dialog"
      aria-label="PromptHub Gemini Prompts">
      <div className={css.header}>
        <div className={css.brand}>
          <SparkleIcon className={css.brandSparkle} />
          <h3 className={css.title}>PromptHub</h3>
        </div>
        <div className={css.searchBar}>
          <SearchIcon className={css.searchIcon} />
          <input
            type="text"
            className={css.searchInput}
            placeholder="Search prompts or #tag..."
            aria-label="Search Gemini prompts"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className={css.headerActions}>
          <button
            type="button"
            className={css.iconBtn}
            onClick={() => void loadPrompts(true)}
            disabled={isLoading}
            aria-label="Refresh prompts"
            title="Refresh prompts">
            <RefreshIcon />
          </button>
          <button
            type="button"
            className={css.iconBtn}
            onClick={() => setIsOpen(false)}
            aria-label="Close prompts popover"
            title="Close">
            <CloseIcon />
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className={css.stateBox}>Loading prompts...</div>
      ) : !isAuthenticated ? (
        <div className={css.stateBox}>
          Please sign in via the PromptHub extension popup to see your prompts.
        </div>
      ) : errorMessage ? (
        <div
          className={css.errorBox}
          role="alert">
          {errorMessage}
        </div>
      ) : filteredPrompts.length === 0 ? (
        <div className={css.stateBox}>
          {prompts.length === 0
            ? "No prompts saved yet."
            : "No prompts match your search."}
        </div>
      ) : (
        <ul
          ref={listRef}
          className={css.list}>
          {filteredPrompts.map((prompt, index) => (
            <li key={prompt._id}>
              <button
                type="button"
                className={`${css.promptItem} ${
                  index === selectedIndex ? css.promptItemSelected : ""
                }`}
                onClick={() => handleSelectPrompt(prompt)}
                onMouseEnter={() => setSelectedIndex(index)}>
                <div className={css.promptItemContent}>
                  <div className={css.itemSparkleBadge}>
                    <span className={css.promptBullet}>✦</span>
                  </div>
                  <div className={css.itemDetails}>
                    <div className={css.promptHeader}>
                      <span className={css.promptTitle}>{prompt.title}</span>
                      {prompt.tags && prompt.tags.length > 0 && (
                        <div className={css.tagRow}>
                          {prompt.tags.map((tag) => (
                            <span
                              key={tag}
                              className={css.tagBadge}>
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className={css.promptPreview}>
                      <TemplateHighlight text={prompt.body} />
                    </div>
                  </div>
                </div>
                <div className={css.insertHint}>
                  <EnterIcon className={css.enterIcon} />
                  <span>Insert</span>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default GeminiPromptsOverlay
