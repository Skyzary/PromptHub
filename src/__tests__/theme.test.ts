import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import {
  getTheme,
  getThemePreference,
  resetThemeState,
  setTheme,
  setThemePreference,
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
    resetThemeState()
    localStorage.clear()
    document.documentElement.removeAttribute("data-theme")
    // Default matchMedia mock returning light mode
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn()
    }))
  })

  afterEach(() => {
    resetThemeState()
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

  it("falls back to cached currentPreference or light when localStorage has unexpected value", () => {
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

  it("automatically switches theme according to system browser theme when preference is system", () => {
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

    setThemePreference("system")
    expect(getThemePreference()).toBe("system")
    expect(getTheme()).toBe("light")

    const listener = vi.fn()
    const unsubscribe = subscribeThemeChange(listener)

    // Simulate browser/system theme switching to dark
    prefersDark = true
    if (mediaChangeHandler) {
      ;(mediaChangeHandler as () => void)()
    }

    expect(listener).toHaveBeenCalledWith("dark")
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark")
    expect(getTheme()).toBe("dark")

    unsubscribe()
  })

  it("supports explicit light and dark preferences via setThemePreference", () => {
    setThemePreference("light")
    expect(getThemePreference()).toBe("light")
    expect(getTheme()).toBe("light")
    expect(document.documentElement.getAttribute("data-theme")).toBe("light")

    setThemePreference("dark")
    expect(getThemePreference()).toBe("dark")
    expect(getTheme()).toBe("dark")
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark")
  })
})

