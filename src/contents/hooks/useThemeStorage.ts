import { useEffect, useState } from "react"

import {
  THEME_STORAGE_KEY,
  type ThemeMode,
  type ThemePreference
} from "../../utils/theme"
import { detectGeminiPageTheme } from "../gemini-elements"

function resolveInitialTheme(
  initialTheme?: ThemeMode | ThemePreference
): ThemeMode {
  if (initialTheme === "dark" || initialTheme === "light") {
    return initialTheme
  }
  return detectGeminiPageTheme()
}

export function useThemeStorage(
  initialTheme?: ThemeMode | ThemePreference
) {
  const [theme, setTheme] = useState<ThemeMode>(() =>
    resolveInitialTheme(initialTheme)
  )

  useEffect(() => {
    if (initialTheme) {
      setTheme(resolveInitialTheme(initialTheme))
    }
  }, [initialTheme])

  useEffect(() => {
    let currentPref: ThemePreference =
      initialTheme === "system" ||
      initialTheme === "dark" ||
      initialTheme === "light"
        ? initialTheme
        : "system"

    const applyResolvedPreference = (pref: ThemePreference) => {
      currentPref = pref
      if (pref === "system") {
        setTheme(detectGeminiPageTheme())
      } else {
        setTheme(pref)
      }
    }

    const handleStorageChanged = (
      changes: Record<string, chrome.storage.StorageChange>
    ) => {
      const themeChange = changes[THEME_STORAGE_KEY]
      if (
        themeChange?.newValue === "dark" ||
        themeChange?.newValue === "light" ||
        themeChange?.newValue === "system"
      ) {
        applyResolvedPreference(themeChange.newValue as ThemePreference)
      }
    }

    if (typeof chrome !== "undefined" && chrome.storage?.onChanged) {
      chrome.storage.onChanged.addListener(handleStorageChanged)
    }

    // Listen to browser color scheme changes
    let mediaQuery: MediaQueryList | null = null
    const handleMediaChange = () => {
      if (currentPref === "system") {
        setTheme(detectGeminiPageTheme())
      }
    }

    if (
      typeof window !== "undefined" &&
      typeof window.matchMedia === "function"
    ) {
      try {
        mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")
        mediaQuery.addEventListener?.("change", handleMediaChange)
      } catch {
        // Ignore media query registration errors
      }
    }

    return () => {
      if (typeof chrome !== "undefined" && chrome.storage?.onChanged) {
        chrome.storage.onChanged.removeListener(handleStorageChanged)
      }
      mediaQuery?.removeEventListener?.("change", handleMediaChange)
    }
  }, [initialTheme])

  return [theme, setTheme] as const
}

