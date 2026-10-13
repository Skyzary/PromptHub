import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import {
  handleGetPromptsMessage,
  PROMPTHUB_GET_PROMPTS_MESSAGE,
  registerBackgroundMessageListener
} from "../background"
import GeminiPromptsOverlay, {
  computePopoverPosition,
  detectPageTheme,
  findGeminiInputTarget,
  getRootContainer,
  insertPromptIntoElement
} from "../contents/gemini-prompts"
import * as promptsApiModule from "../prompts-api"
import type { IPrompt } from "../types"
import {
  ACCESS_TOKEN_STORAGE_KEY,
  clearAccessToken,
  clearRefreshToken,
  REFRESH_TOKEN_STORAGE_KEY
} from "../utils/auth"
import { THEME_STORAGE_KEY } from "../utils/theme"

const mockPrompts: IPrompt[] = [
  {
    _id: "p1",
    title: "Code Review Assistant",
    body: "Please review the following TypeScript code for bugs.",
    tags: ["typescript", "review"]
  },
  {
    _id: "p2",
    title: "Summarize Article",
    body: "Summarize this article in 5 bullet points.",
    tags: ["summary"]
  }
]

describe("Background script & Gemini content script", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    localStorage.clear()
    clearAccessToken()
    clearRefreshToken()
    promptsApiModule.invalidatePromptsCache()
    document.body.innerHTML = ""
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  describe("background.ts", () => {
    it("returns unauthenticated state when no tokens exist in chrome.storage.local", async () => {
      vi.stubGlobal("chrome", {
        storage: {
          local: {
            get: vi.fn().mockResolvedValue({}),
            set: vi.fn().mockResolvedValue(undefined),
            remove: vi.fn().mockResolvedValue(undefined)
          }
        }
      })

      const res = await handleGetPromptsMessage(false)
      expect(res).toEqual({
        ok: true,
        prompts: [],
        isAuthenticated: false
      })
    })

    it("returns cached prompts from chrome.storage.local when not force-refreshing", async () => {
      vi.stubGlobal("chrome", {
        storage: {
          local: {
            get: vi.fn().mockResolvedValue({
              [ACCESS_TOKEN_STORAGE_KEY]: "header.eyJleHAiOjk5OTk5OTk5OTl9.sig",
              [promptsApiModule.PROMPTS_CACHE_STORAGE_KEY]: mockPrompts
            }),
            set: vi.fn().mockResolvedValue(undefined),
            remove: vi.fn().mockResolvedValue(undefined)
          }
        }
      })

      const res = await handleGetPromptsMessage(false)
      expect(res.ok).toBe(true)
      expect(res.isAuthenticated).toBe(true)
      expect(res.prompts).toEqual(mockPrompts)
    })

    it("fetches fresh prompts when forceRefresh is true or cache is empty", async () => {
      vi.stubGlobal("chrome", {
        storage: {
          local: {
            get: vi.fn().mockResolvedValue({
              [REFRESH_TOKEN_STORAGE_KEY]: "header.eyJleHAiOjk5OTk5OTk5OTl9.sig"
            }),
            set: vi.fn().mockResolvedValue(undefined),
            remove: vi.fn().mockResolvedValue(undefined)
          }
        }
      })
      vi.spyOn(promptsApiModule, "fetchPrompts").mockResolvedValue(mockPrompts)

      const res = await handleGetPromptsMessage(true)
      expect(res.ok).toBe(true)
      expect(res.prompts).toEqual(mockPrompts)
    })

    it("handles fetchPrompts error gracefully in background handler", async () => {
      vi.stubGlobal("chrome", {
        storage: {
          local: {
            get: vi.fn().mockResolvedValue({
              [ACCESS_TOKEN_STORAGE_KEY]: "header.eyJleHAiOjk5OTk5OTk5OTl9.sig"
            }),
            set: vi.fn().mockResolvedValue(undefined),
            remove: vi.fn().mockResolvedValue(undefined)
          }
        }
      })
      vi.spyOn(promptsApiModule, "fetchPrompts").mockRejectedValue(
        new Error("Backend unreachable")
      )

      const res = await handleGetPromptsMessage(true)
      expect(res.ok).toBe(false)
      expect(res.error).toBe("Backend unreachable")
    })

    it("registers chrome.runtime.onMessage listener and responds to PROMPTHUB_GET_PROMPTS", async () => {
      let registeredListener:
        | ((
            msg: unknown,
            sender: chrome.runtime.MessageSender,
            sendResponse: (res: unknown) => void
          ) => boolean)
        | undefined

      vi.stubGlobal("chrome", {
        storage: {
          local: {
            get: vi.fn().mockResolvedValue({
              [ACCESS_TOKEN_STORAGE_KEY]: "header.eyJleHAiOjk5OTk5OTk5OTl9.sig",
              [promptsApiModule.PROMPTS_CACHE_STORAGE_KEY]: mockPrompts
            }),
            set: vi.fn().mockResolvedValue(undefined),
            remove: vi.fn().mockResolvedValue(undefined)
          }
        },
        runtime: {
          onMessage: {
            addListener: vi.fn((fn) => {
              registeredListener = fn
            })
          }
        }
      })

      registerBackgroundMessageListener()
      expect(registeredListener).toBeDefined()

      // Ignore unrelated messages
      const ignored = registeredListener!(
        { type: "OTHER" },
        {} as chrome.runtime.MessageSender,
        vi.fn()
      )
      expect(ignored).toBe(false)

      // Handle PROMPTHUB_GET_PROMPTS
      const sendResponse = vi.fn()
      const handled = registeredListener!(
        { type: PROMPTHUB_GET_PROMPTS_MESSAGE, forceRefresh: false },
        {} as chrome.runtime.MessageSender,
        sendResponse
      )
      expect(handled).toBe(true)
      await waitFor(() => {
        expect(sendResponse).toHaveBeenCalledWith({
          ok: true,
          prompts: mockPrompts,
          isAuthenticated: true
        })
      })
    })
  })

  describe("gemini-prompts helpers", () => {
    it("creates and reuses #prompthub-gemini-root container", () => {
      const first = getRootContainer()
      const second = getRootContainer()
      expect(first).toBe(second)
      expect(first.id).toBe("prompthub-gemini-root")
    })

    it("identifies Gemini input elements and ignores clicks inside popover", () => {
      const editor = document.createElement("div")
      editor.className = "ql-editor"
      editor.setAttribute("contenteditable", "true")
      const innerP = document.createElement("p")
      editor.appendChild(innerP)
      document.body.appendChild(editor)

      const popover = document.createElement("div")
      const popoverBtn = document.createElement("button")
      popover.appendChild(popoverBtn)
      document.body.appendChild(popover)

      expect(findGeminiInputTarget(innerP, popover)).toBe(editor)
      expect(findGeminiInputTarget(popoverBtn, popover)).toBeNull()
      expect(findGeminiInputTarget(null, popover)).toBeNull()
    })

    it("computes popover position above and below the target rect", () => {
      const abovePos = computePopoverPosition({
        top: 500,
        bottom: 560,
        left: 100,
        right: 600,
        width: 500,
        height: 60,
        x: 100,
        y: 500,
        toJSON: () => ({})
      })
      expect(abovePos.top).toBeLessThan(500)
      expect(abovePos.left).toBe(100)

      const belowPos = computePopoverPosition({
        top: 50,
        bottom: 100,
        left: 5,
        right: 300,
        width: 295,
        height: 50,
        x: 5,
        y: 50,
        toJSON: () => ({})
      })
      expect(belowPos.top).toBe(112)
      expect(belowPos.left).toBe(12)
    })

    it("inserts prompt text into contenteditable and textarea elements", () => {
      const editorWithP = document.createElement("div")
      editorWithP.setAttribute("contenteditable", "true")
      const p = document.createElement("p")
      editorWithP.appendChild(p)
      document.body.appendChild(editorWithP)

      insertPromptIntoElement(editorWithP, "Hello Gemini")
      expect(p.textContent).toBe("Hello Gemini")

      const editorPlain = document.createElement("div")
      editorPlain.setAttribute("contenteditable", "true")
      document.body.appendChild(editorPlain)

      insertPromptIntoElement(editorPlain, "Direct content")
      expect(editorPlain.textContent).toBe("Direct content")

      const textarea = document.createElement("textarea")
      document.body.appendChild(textarea)

      insertPromptIntoElement(textarea, "Textarea prompt")
      expect(textarea.value).toBe("Textarea prompt")
    })
  })

  describe("GeminiPromptsOverlay component", () => {
    it("opens on clicking Gemini input, filters prompts, and inserts selected prompt", async () => {
      vi.stubGlobal("chrome", {
        runtime: {
          sendMessage: vi.fn().mockResolvedValue({
            ok: true,
            prompts: mockPrompts,
            isAuthenticated: true
          })
        }
      })

      const geminiInput = document.createElement("div")
      geminiInput.className = "ql-editor"
      geminiInput.setAttribute("contenteditable", "true")
      const paragraph = document.createElement("p")
      geminiInput.appendChild(paragraph)
      document.body.appendChild(geminiInput)

      render(<GeminiPromptsOverlay />)

      expect(
        screen.queryByRole("dialog", { name: /prompthub gemini prompts/i })
      ).not.toBeInTheDocument()

      // Click on Gemini input
      fireEvent.click(paragraph)

      expect(
        await screen.findByRole("dialog", { name: /prompthub gemini prompts/i })
      ).toBeInTheDocument()

      expect(
        await screen.findByText("Code Review Assistant")
      ).toBeInTheDocument()
      expect(screen.getByText("Summarize Article")).toBeInTheDocument()

      // Filter by #tag
      const searchInput = screen.getByLabelText("Search Gemini prompts")
      fireEvent.change(searchInput, { target: { value: "#review" } })

      expect(screen.getByText("Code Review Assistant")).toBeInTheDocument()
      expect(screen.queryByText("Summarize Article")).not.toBeInTheDocument()

      // Filter by text with no match
      fireEvent.change(searchInput, { target: { value: "nonexistent" } })
      expect(
        screen.getByText("No prompts match your search.")
      ).toBeInTheDocument()

      // Clear search and click a prompt to insert
      fireEvent.change(searchInput, { target: { value: "" } })
      fireEvent.click(screen.getByText("Code Review Assistant"))

      expect(paragraph.textContent).toBe(
        "Please review the following TypeScript code for bugs."
      )
      expect(
        screen.queryByRole("dialog", { name: /prompthub gemini prompts/i })
      ).not.toBeInTheDocument()
    })

    it("supports refresh, Escape key, close button, and outside click", async () => {
      const sendMessageMock = vi.fn().mockResolvedValue({
        ok: true,
        prompts: mockPrompts,
        isAuthenticated: true
      })
      vi.stubGlobal("chrome", {
        runtime: {
          sendMessage: sendMessageMock
        }
      })

      const textarea = document.createElement("textarea")
      document.body.appendChild(textarea)

      render(<GeminiPromptsOverlay />)

      // Focus Gemini input
      fireEvent.focusIn(textarea)
      expect(
        await screen.findByText("Code Review Assistant")
      ).toBeInTheDocument()

      // Mousedown inside popover or inside active input does not close
      fireEvent.mouseDown(screen.getByText("PromptHub"))
      fireEvent.mouseDown(textarea)
      fireEvent.keyDown(document, { key: "Enter" })
      expect(
        screen.getByRole("dialog", { name: /prompthub gemini prompts/i })
      ).toBeInTheDocument()

      // Click refresh button
      fireEvent.click(screen.getByRole("button", { name: /refresh prompts/i }))
      await waitFor(() => {
        expect(sendMessageMock).toHaveBeenCalledWith({
          type: PROMPTHUB_GET_PROMPTS_MESSAGE,
          forceRefresh: true
        })
      })

      // Close with Escape
      fireEvent.keyDown(document, { key: "Escape" })
      expect(
        screen.queryByRole("dialog", { name: /prompthub gemini prompts/i })
      ).not.toBeInTheDocument()

      // Reopen and close via outside mousedown
      fireEvent.click(textarea)
      expect(
        await screen.findByRole("dialog", { name: /prompthub gemini prompts/i })
      ).toBeInTheDocument()

      fireEvent.mouseDown(document.body)
      expect(
        screen.queryByRole("dialog", { name: /prompthub gemini prompts/i })
      ).not.toBeInTheDocument()

      // Reopen and close via close button
      fireEvent.click(textarea)
      expect(
        await screen.findByRole("dialog", { name: /prompthub gemini prompts/i })
      ).toBeInTheDocument()
      fireEvent.click(
        screen.getByRole("button", { name: /close prompts popover/i })
      )
      expect(
        screen.queryByRole("dialog", { name: /prompthub gemini prompts/i })
      ).not.toBeInTheDocument()
    })

    it("renders unauthenticated and error states and falls back to storage or fetchPrompts", async () => {
      vi.stubGlobal("chrome", {
        runtime: {
          sendMessage: vi.fn().mockResolvedValue({
            ok: true,
            prompts: [],
            isAuthenticated: false
          })
        }
      })

      const textarea = document.createElement("textarea")
      document.body.appendChild(textarea)

      const { unmount } = render(<GeminiPromptsOverlay />)
      fireEvent.click(textarea)

      expect(
        await screen.findByText(
          /please sign in via the prompthub extension popup/i
        )
      ).toBeInTheDocument()
      unmount()

      // Error state from background response
      vi.stubGlobal("chrome", {
        runtime: {
          sendMessage: vi.fn().mockResolvedValue({
            ok: false,
            prompts: [],
            isAuthenticated: true,
            error: "Service unavailable"
          })
        }
      })

      const { unmount: unmountError } = render(<GeminiPromptsOverlay />)
      fireEvent.click(textarea)
      expect(await screen.findByRole("alert")).toHaveTextContent(
        "Service unavailable"
      )
      unmountError()

      // Fallback when chrome.runtime.sendMessage rejects -> storage cache
      vi.stubGlobal("chrome", {
        runtime: {
          sendMessage: vi.fn().mockRejectedValue(new Error("No SW"))
        },
        storage: {
          local: {
            get: vi.fn().mockResolvedValue({
              [promptsApiModule.PROMPTS_CACHE_STORAGE_KEY]: []
            })
          }
        }
      })

      const { unmount: unmountStorage } = render(<GeminiPromptsOverlay />)
      fireEvent.click(textarea)
      expect(
        await screen.findByText("No prompts saved yet.")
      ).toBeInTheDocument()
      unmountStorage()

      // Fallback when neither runtime nor storage has cached array -> fetchPrompts
      vi.stubGlobal("chrome", undefined)
      vi.spyOn(promptsApiModule, "fetchPrompts").mockResolvedValue(mockPrompts)

      render(<GeminiPromptsOverlay />)
      fireEvent.click(textarea)
      expect(
        await screen.findByText("Code Review Assistant")
      ).toBeInTheDocument()
    })

    it("adapts popover data-theme to stored dark theme, page dark-theme class, and storage changes", async () => {
      document.body.classList.add("dark-theme")
      expect(detectPageTheme()).toBe("dark")
      document.body.classList.remove("dark-theme")

      let storageListener:
        | ((changes: Record<string, chrome.storage.StorageChange>) => void)
        | undefined

      vi.stubGlobal("chrome", {
        runtime: {
          sendMessage: vi.fn().mockResolvedValue({
            ok: true,
            prompts: mockPrompts,
            isAuthenticated: true,
            theme: "dark"
          })
        },
        storage: {
          onChanged: {
            addListener: vi.fn((fn) => {
              storageListener = fn
            }),
            removeListener: vi.fn()
          }
        }
      })

      const textarea = document.createElement("textarea")
      document.body.appendChild(textarea)

      const { unmount } = render(<GeminiPromptsOverlay />)
      fireEvent.click(textarea)

      const dialog = await screen.findByRole("dialog", {
        name: /prompthub gemini prompts/i
      })
      await waitFor(() => {
        expect(dialog).toHaveAttribute("data-theme", "dark")
      })

      storageListener?.({
        [THEME_STORAGE_KEY]: { oldValue: "dark", newValue: "light" }
      })
      await waitFor(() => {
        expect(dialog).toHaveAttribute("data-theme", "light")
      })

      unmount()
    })
  })
})
