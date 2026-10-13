import { useEffect, useState } from "react"

import { THEME_STORAGE_KEY, type ThemeMode } from "../../utils/theme"
import { detectGeminiPageTheme } from "../gemini-dom"

export function useThemeStorage(initialTheme?: ThemeMode) {
  const [theme, setTheme] = useState<ThemeMode>(
    () => initialTheme ?? detectGeminiPageTheme()
  )

  useEffect(() => {
    if (initialTheme) {
      setTheme(initialTheme)
    }
  }, [initialTheme])

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

  return [theme, setTheme] as const
}
