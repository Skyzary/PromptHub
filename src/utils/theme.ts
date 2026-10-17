export type ThemeMode = "light" | "dark"
export type ThemePreference = "system" | "light" | "dark"

export const THEME_STORAGE_KEY = "templagem_theme"

let currentPreference: ThemePreference | null = null
const themeListeners = new Set<(theme: ThemeMode) => void>()
let mediaQueryList: MediaQueryList | null = null

function getSystemTheme(): ThemeMode {
  if (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  ) {
    return "dark"
  }
  return "light"
}

function resolveTheme(preference: ThemePreference): ThemeMode {
  if (preference === "system") {
    return getSystemTheme()
  }
  return preference
}

function syncThemeToChromeStorage(preference: ThemePreference): void {
  if (typeof chrome !== "undefined" && chrome.storage?.local) {
    void chrome.storage.local.set({ [THEME_STORAGE_KEY]: preference })
  }
}

function applyThemeToDom(theme: ThemeMode): void {
  if (typeof document !== "undefined" && document.documentElement) {
    document.documentElement.setAttribute("data-theme", theme)
  }
}

function ensureSystemThemeListener(): void {
  if (
    typeof window === "undefined" ||
    typeof window.matchMedia !== "function" ||
    mediaQueryList !== null
  ) {
    return
  }

  try {
    mediaQueryList = window.matchMedia("(prefers-color-scheme: dark)")
    const handleSystemChange = () => {
      if (getThemePreference() === "system") {
        const nextTheme = getSystemTheme()
        applyThemeToDom(nextTheme)
        themeListeners.forEach((listener) => listener(nextTheme))
      }
    }

    mediaQueryList.addEventListener?.("change", handleSystemChange)
  } catch {
    // Ignore matchMedia listener registration errors
  }
}

export function getThemePreference(): ThemePreference {
  if (typeof window !== "undefined" && window.localStorage) {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY)
    if (stored === "system" || stored === "dark" || stored === "light") {
      currentPreference = stored
      return currentPreference
    }
  }
  if (currentPreference !== null) {
    return currentPreference
  }
  currentPreference = "system"
  return currentPreference
}

export function getTheme(): ThemeMode {
  ensureSystemThemeListener()
  const preference = getThemePreference()
  const resolved = resolveTheme(preference)
  applyThemeToDom(resolved)
  syncThemeToChromeStorage(preference)
  return resolved
}

export function setThemePreference(preference: ThemePreference): void {
  ensureSystemThemeListener()
  currentPreference = preference
  if (typeof window !== "undefined" && window.localStorage) {
    window.localStorage.setItem(THEME_STORAGE_KEY, preference)
  }
  syncThemeToChromeStorage(preference)
  const resolved = resolveTheme(preference)
  applyThemeToDom(resolved)
  themeListeners.forEach((listener) => listener(resolved))
}

export function setTheme(theme: ThemeMode): void {
  setThemePreference(theme)
}

export function toggleTheme(): ThemeMode {
  const current = getTheme()
  const next: ThemeMode = current === "dark" ? "light" : "dark"
  setThemePreference(next)
  return next
}

export function subscribeThemeChange(
  listener: (theme: ThemeMode) => void
): () => void {
  ensureSystemThemeListener()
  themeListeners.add(listener)
  return () => {
    themeListeners.delete(listener)
  }
}

export function resetThemeState(): void {
  currentPreference = null
  themeListeners.clear()
  mediaQueryList = null
}


