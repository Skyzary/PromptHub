import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import {
  getTheme,
  setTheme,
  subscribeThemeChange,
  THEME_STORAGE_KEY,
  toggleTheme
} from "../utils/theme"

type GlobalWithChrome = typeof globalThis & {
  chrome?: {
    storage?: {
      local?: {
        set?: (items: Record<string, unknown>) => Promise<void> | void
      }
    }
  }
}

describe("theme utility", () => {
  const globalRef = globalThis as GlobalWithChrome
  const originalChrome = globalRef.chrome

  beforeEach(() => {
    localStorage.clear()
    document.documentElement.removeAttribute("data-theme")
  })

  afterEach(() => {
    globalRef.chrome = originalChrome
    vi.restoreAllMocks()
  })

  it("reads stored theme from localStorage and applies to DOM and chrome storage", () => {
    const mockSet = vi.fn()
    globalRef.chrome = {
      storage: {
        local: {
          set: mockSet
        }
      }
    } as unknown as typeof chrome

    localStorage.setItem(THEME_STORAGE_KEY, "dark")
    const theme = getTheme()
    expect(theme).toBe("dark")
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark")
    expect(mockSet).toHaveBeenCalledWith({ [THEME_STORAGE_KEY]: "dark" })
  })

  it("falls back to cached currentTheme or light when localStorage has unexpected value", () => {
    setTheme("light")
    localStorage.setItem(THEME_STORAGE_KEY, "invalid-theme")
    const theme = getTheme()
    expect(theme).toBe("light")
    expect(document.documentElement.getAttribute("data-theme")).toBe("light")
  })

  it("safely handles missing chrome or chrome.storage.local", () => {
    delete globalRef.chrome
    setTheme("dark")
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark")
    expect(getTheme()).toBe("dark")
  })

  it("toggles theme between dark and light and notifies subscribers", () => {
    setTheme("light")
    const listener = vi.fn()
    const unsubscribe = subscribeThemeChange(listener)

    const next1 = toggleTheme()
    expect(next1).toBe("dark")
    expect(listener).toHaveBeenCalledWith("dark")

    const next2 = toggleTheme()
    expect(next2).toBe("light")
    expect(listener).toHaveBeenCalledWith("light")

    unsubscribe()
    toggleTheme()
    expect(listener).toHaveBeenCalledTimes(2)
  })
})
