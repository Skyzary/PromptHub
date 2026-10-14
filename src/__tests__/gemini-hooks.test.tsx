import { act, renderHook } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { useGeminiOverlayEvents } from "../contents/hooks/useGeminiOverlayEvents"
import { useGeminiPopoverPosition } from "../contents/hooks/useGeminiPopoverPosition"
import { useGeminiPromptFilters } from "../contents/hooks/useGeminiPromptFilters"
import type { IPrompt } from "../types"

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
    const textarea = document.createElement("textarea")
    document.body.appendChild(textarea)

    const { result } = renderHook(() =>
      useGeminiPopoverPosition(true, popoverRef)
    )

    act(() => {
      const updated = result.current.updatePositionForTarget(textarea)
      expect(updated).toBe(true)
    })

    expect(result.current.activeInputRef.current).toBe(textarea)

    // Trigger window resize and scroll
    act(() => {
      window.dispatchEvent(new Event("resize"))
      window.dispatchEvent(new Event("scroll"))
    })

    document.body.removeChild(textarea)
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
})
