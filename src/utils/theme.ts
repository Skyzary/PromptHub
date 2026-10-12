export type ThemeMode = "light" | "dark"

const THEME_STORAGE_KEY = "prompthub_theme"

let currentTheme: ThemeMode | null = null
const themeListeners = new Set<(theme: ThemeMode) => void>()

function applyThemeToDom(theme: ThemeMode): void {
  if (typeof document !== "undefined" && document.documentElement) {
    document.documentElement.setAttribute("data-theme", theme)
  }
}

export function getTheme(): ThemeMode {
  if (currentTheme !== null) {
    return currentTheme
  }
  if (typeof window !== "undefined" && window.localStorage) {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY)
    if (stored === "dark" || stored === "light") {
      currentTheme = stored
      applyThemeToDom(currentTheme)
      return currentTheme
    }
  }
  currentTheme = "light"
  applyThemeToDom(currentTheme)
  return currentTheme
}

export function setTheme(theme: ThemeMode): void {
  currentTheme = theme
  if (typeof window !== "undefined" && window.localStorage) {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme)
  }
  applyThemeToDom(theme)
  themeListeners.forEach((listener) => listener(theme))
}

export function toggleTheme(): ThemeMode {
  const next: ThemeMode = getTheme() === "dark" ? "light" : "dark"
  setTheme(next)
  return next
}

export function subscribeThemeChange(
  listener: (theme: ThemeMode) => void
): () => void {
  themeListeners.add(listener)
  return () => {
    themeListeners.delete(listener)
  }
}
