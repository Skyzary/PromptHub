import { act, renderHook } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { useGeminiOverlayEvents } from "../contents/hooks/useGeminiOverlayEvents"
import { useGeminiPopoverPosition } from "../contents/hooks/useGeminiPopoverPosition"
import { useGeminiPromptFilters } from "../contents/hooks/useGeminiPromptFilters"
import { useThemeStorage } from "../contents/hooks/useThemeStorage"
import type { IPrompt } from "../types"
import { THEME_STORAGE_KEY } from "../utils/theme"

const testPrompts: IPrompt[] = [
  {
    _id: "1",
    title: "Alpha Prompt",
    body: "First prompt body",
    tags: ["react", "frontend"]
  },
  {
    _id: "2",
    title: "Beta Prompt",
    body: "Second prompt body",
    tags: ["node", "backend"]
  },
  {
    _id: "3",
    title: "Gamma Prompt",
    body: "Third prompt body",
    tags: ["react"]
  }
]

describe("useGeminiPromptFilters", () => {
  it("extracts unique tags and returns all prompts when no search query or tag selected", () => {
    const { result } = renderHook(() =>
      useGeminiPromptFilters(testPrompts, true)
    )

    expect(result.current.availableTags).toEqual(
      expect.arrayContaining(["react", "frontend", "node", "backend"])
    )
    expect(result.current.filteredPrompts).toHaveLength(3)
    expect(result.current.selectedIndex).toBe(0)
  })

  it("filters prompts by text search token and resets selectedIndex", () => {
    const { result } = renderHook(() =>
      useGeminiPromptFilters(testPrompts, true)
    )

    act(() => {
      result.current.setSelectedIndex(2)
      result.current.setSearchQuery("beta")
    })

    expect(result.current.filteredPrompts).toHaveLength(1)
    expect(result.current.filteredPrompts[0].title).toBe("Beta Prompt")
    expect(result.current.selectedIndex).toBe(0)
  })

  it("filters prompts by hashtag query like #react", () => {
    const { result } = renderHook(() =>
      useGeminiPromptFilters(testPrompts, true)
    )

    act(() => {
      result.current.setSearchQuery("#react")
    })

    expect(result.current.filteredPrompts).toHaveLength(2)
  })

  it("filters prompts by selectedTag and resets selectedIndex", () => {
    const { result } = renderHook(() =>
      useGeminiPromptFilters(testPrompts, true)
    )

    act(() => {
      result.current.setSelectedIndex(1)
      result.current.setSelectedTag("backend")
    })

    expect(result.current.filteredPrompts).toHaveLength(1)
    expect(result.current.filteredPrompts[0]._id).toBe("2")
    expect(result.current.selectedIndex).toBe(0)
  })

  it("resets selectedTag and selectedIndex when isOpen transitions to true", () => {
    const { result, rerender } = renderHook(
      ({ open }) => useGeminiPromptFilters(testPrompts, open),
      { initialProps: { open: false } }
    )

    act(() => {
      result.current.setSelectedTag("backend")
      result.current.setSelectedIndex(1)
    })

    rerender({ open: true })

    expect(result.current.selectedTag).toBeNull()
    expect(result.current.selectedIndex).toBe(0)
  })
})

describe("useGeminiPopoverPosition", () => {
  it("returns default position and handles updatePositionForTarget for null or unmatched target", () => {
    const popoverRef = { current: document.createElement("div") }
    const { result } = renderHook(() =>
      useGeminiPopoverPosition(true, popoverRef)
    )

    expect(result.current.position).toEqual({
      top: 24,
      left: 24,
      width: 360,
      dockedAbove: true
    })

    act(() => {
      const updated = result.current.updatePositionForTarget(null)
      expect(updated).toBe(false)
    })
  })

  it("updates position when valid input target is passed and handles window resize/scroll events", () => {
    const popoverRef = { current: document.createElement("div") }
    const container = document.createElement("div")
    container.className = "chat-input-container"
    const textarea = document.createElement("textarea")
    container.appendChild(textarea)
    document.body.appendChild(container)

    const { result, rerender } = renderHook(
      ({ open }) => useGeminiPopoverPosition(open, popoverRef),
      { initialProps: { open: true } }
    )

    // Trigger window resize when activeInputRef is null
    act(() => {
      window.dispatchEvent(new Event("resize"))
    })

    // Update with input inside container
    act(() => {
      const updated = result.current.updatePositionForTarget(textarea)
      expect(updated).toBe(true)
    })

    expect(result.current.activeInputRef.current).toBe(textarea)

    // Trigger window resize and scroll with container
    act(() => {
      window.dispatchEvent(new Event("resize"))
      window.dispatchEvent(new Event("scroll"))
    })

    // Rerender with open: false to verify listener cleanup
    rerender({ open: false })

    document.body.removeChild(container)
  })
})

describe("useGeminiOverlayEvents", () => {
  it("dismisses overlay on typing and prevents focusin loop from reopening it until focusout", () => {
    const setIsOpen = vi.fn()
    const popoverDiv = document.createElement("div")
    document.body.appendChild(popoverDiv)
    const popoverRef = { current: popoverDiv }

    const inputDiv = document.createElement("div")
    inputDiv.setAttribute("contenteditable", "true")
    inputDiv.classList.add("ql-editor")
    document.body.appendChild(inputDiv)

    const activeInputRef = { current: inputDiv as HTMLElement | null }
    const filteredPromptsRef = { current: testPrompts }
    const selectedIndexRef = { current: 0 }
    const setSelectedIndex = vi.fn()
    const handleSelectPrompt = vi.fn()
    const updatePositionForTarget = vi.fn(() => true)

    const { rerender, unmount } = renderHook(
      ({ open }) =>
        useGeminiOverlayEvents({
          isOpen: open,
          setIsOpen,
          popoverRef,
          activeInputRef,
          filteredPromptsRef,
          selectedIndexRef,
          setSelectedIndex,
          handleSelectPrompt,
          updatePositionForTarget
        }),
      { initialProps: { open: true } }
    )

    // 1. User types in the Gemini input -> triggers keydown
    act(() => {
      inputDiv.dispatchEvent(
        new KeyboardEvent("keydown", { key: "a", bubbles: true })
      )
    })
    expect(setIsOpen).toHaveBeenCalledWith(false)
    rerender({ open: false })

    // 2. Trailing focusin event fired by Quill / browser must NOT reopen overlay
    setIsOpen.mockClear()
    act(() => {
      inputDiv.dispatchEvent(
        new FocusEvent("focusin", { bubbles: true, relatedTarget: null })
      )
    })
    expect(setIsOpen).not.toHaveBeenCalled()

    // 3. User leaves input (focusout) -> resets dismissal flag
    act(() => {
      inputDiv.dispatchEvent(
        new FocusEvent("focusout", {
          bubbles: true,
          relatedTarget: document.body
        })
      )
    })

    // 4. Now focusin from outside opens the overlay again
    act(() => {
      inputDiv.dispatchEvent(
        new FocusEvent("focusin", {
          bubbles: true,
          relatedTarget: document.body
        })
      )
    })
    expect(setIsOpen).toHaveBeenCalledWith(true)

    unmount()
    document.body.removeChild(popoverDiv)
    document.body.removeChild(inputDiv)
  })

  it("dismisses overlay on compositionstart (IME) and paste", () => {
    const setIsOpen = vi.fn()
    const popoverDiv = document.createElement("div")
    document.body.appendChild(popoverDiv)
    const popoverRef = { current: popoverDiv }

    const inputDiv = document.createElement("div")
    inputDiv.setAttribute("contenteditable", "true")
    inputDiv.classList.add("ql-editor")
    document.body.appendChild(inputDiv)

    const activeInputRef = { current: inputDiv as HTMLElement | null }
    const filteredPromptsRef = { current: testPrompts }
    const selectedIndexRef = { current: 0 }
    const setSelectedIndex = vi.fn()
    const handleSelectPrompt = vi.fn()
    const updatePositionForTarget = vi.fn(() => true)

    const { unmount } = renderHook(() =>
      useGeminiOverlayEvents({
        isOpen: true,
        setIsOpen,
        popoverRef,
        activeInputRef,
        filteredPromptsRef,
        selectedIndexRef,
        setSelectedIndex,
        handleSelectPrompt,
        updatePositionForTarget
      })
    )

    // IME compositionstart dismisses popover
    act(() => {
      inputDiv.dispatchEvent(
        new CompositionEvent("compositionstart", { bubbles: true })
      )
    })
    expect(setIsOpen).toHaveBeenCalledWith(false)

    // Paste dismisses popover
    setIsOpen.mockClear()
    act(() => {
      inputDiv.dispatchEvent(new Event("paste", { bubbles: true }))
    })
    expect(setIsOpen).toHaveBeenCalledWith(false)

    unmount()
    document.body.removeChild(popoverDiv)
    document.body.removeChild(inputDiv)
  })

  it("handles keyboard navigation (ArrowDown, ArrowUp, Enter, Tab, Escape)", () => {
    const setIsOpen = vi.fn()
    const popoverDiv = document.createElement("div")
    document.body.appendChild(popoverDiv)
    const popoverRef = { current: popoverDiv }

    const inputDiv = document.createElement("div")
    inputDiv.setAttribute("contenteditable", "true")
    inputDiv.classList.add("ql-editor")
    document.body.appendChild(inputDiv)

    const activeInputRef = { current: inputDiv as HTMLElement | null }
    const filteredPromptsRef = { current: testPrompts }
    const selectedIndexRef = { current: 0 }
    const setSelectedIndex = vi.fn((idx) => {
      selectedIndexRef.current =
        typeof idx === "function" ? idx(selectedIndexRef.current) : idx
    })
    const handleSelectPrompt = vi.fn()
    const updatePositionForTarget = vi.fn(() => true)

    const { unmount } = renderHook(() =>
      useGeminiOverlayEvents({
        isOpen: true,
        setIsOpen,
        popoverRef,
        activeInputRef,
        filteredPromptsRef,
        selectedIndexRef,
        setSelectedIndex,
        handleSelectPrompt,
        updatePositionForTarget
      })
    )

    // 1. ArrowDown increments index
    act(() => {
      inputDiv.dispatchEvent(
        new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true })
      )
    })
    expect(setSelectedIndex).toHaveBeenCalled()
    expect(selectedIndexRef.current).toBe(1)

    // 2. ArrowUp decrements index
    act(() => {
      inputDiv.dispatchEvent(
        new KeyboardEvent("keydown", { key: "ArrowUp", bubbles: true })
      )
    })
    expect(setSelectedIndex).toHaveBeenCalled()
    expect(selectedIndexRef.current).toBe(0)

    // 3. Tab selects current prompt
    act(() => {
      inputDiv.dispatchEvent(
        new KeyboardEvent("keydown", { key: "Tab", bubbles: true })
      )
    })
    expect(handleSelectPrompt).toHaveBeenCalledWith(testPrompts[0])
    expect(setIsOpen).toHaveBeenCalledWith(false)

    // 4. Enter selects current prompt
    handleSelectPrompt.mockClear()
    act(() => {
      inputDiv.dispatchEvent(
        new KeyboardEvent("keydown", { key: "Enter", bubbles: true })
      )
    })
    expect(handleSelectPrompt).toHaveBeenCalledWith(testPrompts[0])

    // 5. Escape closes popover
    setIsOpen.mockClear()
    act(() => {
      inputDiv.dispatchEvent(
        new KeyboardEvent("keydown", { key: "Escape", bubbles: true })
      )
    })
    expect(setIsOpen).toHaveBeenCalledWith(false)

    unmount()
    document.body.removeChild(popoverDiv)
    document.body.removeChild(inputDiv)
  })

  it("handles template variable priority and submission in editor", () => {
    const setIsOpen = vi.fn()
    const popoverDiv = document.createElement("div")
    document.body.appendChild(popoverDiv)
    const popoverRef = { current: popoverDiv }

    const inputDiv = document.createElement("div")
    inputDiv.setAttribute("contenteditable", "true")
    inputDiv.classList.add("ql-editor")
    inputDiv.textContent = "Hello {{name}}, welcome!"
    document.body.appendChild(inputDiv)

    const activeInputRef = { current: inputDiv as HTMLElement | null }
    const filteredPromptsRef = { current: testPrompts }
    const selectedIndexRef = { current: 0 }
    const setSelectedIndex = vi.fn()
    const handleSelectPrompt = vi.fn()
    const updatePositionForTarget = vi.fn(() => true)

    const { unmount } = renderHook(() =>
      useGeminiOverlayEvents({
        isOpen: true,
        setIsOpen,
        popoverRef,
        activeInputRef,
        filteredPromptsRef,
        selectedIndexRef,
        setSelectedIndex,
        handleSelectPrompt,
        updatePositionForTarget
      })
    )

    // When hasVars in editor outside popover, Enter dismisses on typing
    act(() => {
      inputDiv.dispatchEvent(
        new KeyboardEvent("keydown", { key: "Enter", bubbles: true })
      )
    })
    expect(setIsOpen).toHaveBeenCalledWith(false)

    unmount()
    document.body.removeChild(popoverDiv)
    document.body.removeChild(inputDiv)
  })

  it("handles clicks inside and outside popover, and input events with programmatic guard", async () => {
    const setIsOpen = vi.fn()
    const popoverDiv = document.createElement("div")
    const popoverButton = document.createElement("button")
    popoverDiv.appendChild(popoverButton)
    document.body.appendChild(popoverDiv)
    const popoverRef = { current: popoverDiv }

    const inputDiv = document.createElement("div")
    inputDiv.setAttribute("contenteditable", "true")
    inputDiv.classList.add("ql-editor")
    document.body.appendChild(inputDiv)

    const activeInputRef = { current: inputDiv as HTMLElement | null }
    const filteredPromptsRef = { current: testPrompts }
    const selectedIndexRef = { current: 0 }
    const setSelectedIndex = vi.fn()
    const handleSelectPrompt = vi.fn()
    const updatePositionForTarget = vi.fn(() => true)

    const { unmount } = renderHook(() =>
      useGeminiOverlayEvents({
        isOpen: true,
        setIsOpen,
        popoverRef,
        activeInputRef,
        filteredPromptsRef,
        selectedIndexRef,
        setSelectedIndex,
        handleSelectPrompt,
        updatePositionForTarget
      })
    )

    // 1. Click inside popover -> returns early
    setIsOpen.mockClear()
    act(() => {
      popoverButton.dispatchEvent(new MouseEvent("click", { bubbles: true }))
    })
    expect(updatePositionForTarget).not.toHaveBeenCalled()

    // 2. Click outside on document body -> mousedown outside closes popover
    act(() => {
      document.body.dispatchEvent(
        new MouseEvent("mousedown", { bubbles: true })
      )
    })
    expect(setIsOpen).toHaveBeenCalledWith(false)

    // 3. Click on active input with template variables -> returns early
    inputDiv.textContent = "Hello {{user}}"
    setIsOpen.mockClear()
    act(() => {
      inputDiv.dispatchEvent(new MouseEvent("click", { bubbles: true }))
    })
    expect(setIsOpen).not.toHaveBeenCalled()

    // 4. Click on active input without template variables -> opens
    inputDiv.textContent = ""
    act(() => {
      inputDiv.dispatchEvent(new MouseEvent("click", { bubbles: true }))
    })
    expect(setIsOpen).toHaveBeenCalledWith(true)

    // 5. Input event with programmatic insert guard
    const { setProgrammaticInsert } = await import(
      "../contents/gemini-input-sync"
    )
    setProgrammaticInsert(true)
    setIsOpen.mockClear()
    act(() => {
      inputDiv.dispatchEvent(new Event("input", { bubbles: true }))
      inputDiv.dispatchEvent(
        new CompositionEvent("compositionstart", { bubbles: true })
      )
    })
    expect(setIsOpen).not.toHaveBeenCalled()
    setProgrammaticInsert(false)

    // 6. Input event with template variables in editor -> returns early without dismissing
    inputDiv.textContent = "Hi {{friend}}"
    act(() => {
      inputDiv.dispatchEvent(new Event("input", { bubbles: true }))
    })
    expect(setIsOpen).not.toHaveBeenCalled()

    // 7. Input event with regular text -> dismisses on typing
    inputDiv.textContent = "regular text"
    act(() => {
      inputDiv.dispatchEvent(new Event("input", { bubbles: true }))
    })
    expect(setIsOpen).toHaveBeenCalledWith(false)

    // 8. Submit event
    act(() => {
      inputDiv.dispatchEvent(new Event("submit", { bubbles: true }))
    })

    unmount()
    document.body.removeChild(popoverDiv)
    document.body.removeChild(inputDiv)
  })
})

describe("useThemeStorage", () => {
  it("initializes with initialTheme, reacts to storage changes and matchMedia changes", () => {
    let mediaChangeHandler: (() => void) | null = null
    let prefersDark = false

    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      get matches() {
        return prefersDark
      },
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn((event: string, handler: () => void) => {
        if (event === "change") {
          mediaChangeHandler = handler
        }
      }),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn()
    }))

    let storageListener: ((changes: Record<string, chrome.storage.StorageChange>) => void) | null = null
    const mockAddListener = vi.fn((listener) => {
      storageListener = listener
    })
    const mockRemoveListener = vi.fn()

    const globalWithChrome = globalThis as typeof globalThis & { chrome?: unknown }
    globalWithChrome.chrome = {
      storage: {
        onChanged: {
          addListener: mockAddListener,
          removeListener: mockRemoveListener
        }
      }
    } as unknown as typeof chrome

    const { result, rerender, unmount } = renderHook(
      ({ init }: { init?: string }) => useThemeStorage(init as "light" | "dark" | "system"),
      { initialProps: { init: "system" } }
    )

    expect(result.current[0]).toBe("light")

    // Update via initialTheme prop rerender
    rerender({ init: "dark" })
    expect(result.current[0]).toBe("dark")

    // Storage change to light
    act(() => {
      if (storageListener) {
        storageListener({
          [THEME_STORAGE_KEY]: {
            oldValue: "dark",
            newValue: "light"
          }
        })
      }
    })
    expect(result.current[0]).toBe("light")

    // Storage change to system
    act(() => {
      if (storageListener) {
        storageListener({
          [THEME_STORAGE_KEY]: {
            oldValue: "light",
            newValue: "system"
          }
        })
      }
    })

    // Simulate matchMedia change while system mode active
    prefersDark = true
    act(() => {
      if (mediaChangeHandler) {
        ;(mediaChangeHandler as () => void)()
      }
    })
    expect(result.current[0]).toBe("dark")

    unmount()
    expect(mockRemoveListener).toHaveBeenCalled()
  })
})

