import React, { useEffect, useState } from "react"
import {
  MdArrowBack,
  MdDarkMode,
  MdLightMode,
  MdLogout
} from "react-icons/md"

import { logout } from "~src/utils/auth"
import {
  getTheme,
  subscribeThemeChange,
  toggleTheme,
  type ThemeMode
} from "~src/utils/theme"

import css from "./SettingsPage.module.scss"

interface SettingsPageProps {
  onBack: () => void
  isAuthenticated?: boolean
}

export default function SettingsPage({
  onBack,
  isAuthenticated = false
}: SettingsPageProps) {
  const [theme, setThemeState] = useState<ThemeMode>(() => getTheme())
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  useEffect(() => {
    return subscribeThemeChange((nextTheme) => {
      setThemeState(nextTheme)
    })
  }, [])

  const isDark = theme === "dark"

  const handleToggleTheme = () => {
    const next = toggleTheme()
    setThemeState(next)
  }

  const handleLogout = async () => {
    if (isLoggingOut) return
    setIsLoggingOut(true)
    try {
      await logout()
      onBack()
    } finally {
      setIsLoggingOut(false)
    }
  }

  return (
    <section
      className={css.settingsPage}
      aria-label="Settings">
      <div className={css.topBar}>
        <h2 className={css.pageTitle}>Settings</h2>
        <button
          type="button"
          className={css.backBtn}
          onClick={onBack}>
          <MdArrowBack size={15} />
          <span>Back</span>
        </button>
      </div>

      <div className={css.card}>
        <span className={css.sectionLabel}>Appearance</span>
        <div className={css.settingRow}>
          <div className={css.settingInfo}>
            <div className={css.themeIconWrapper}>
              {isDark ? <MdDarkMode size={18} /> : <MdLightMode size={18} />}
            </div>
            <div className={css.settingTextGroup}>
              <span className={css.settingTitle}>Dark theme</span>
              <span className={css.settingSubtitle}>
                {isDark ? "Dark mode is enabled" : "Light mode is enabled"}
              </span>
            </div>
          </div>

          <button
            type="button"
            role="switch"
            aria-checked={isDark}
            aria-label="Dark theme"
            className={`${css.switchBtn} ${isDark ? css.switchBtnActive : ""}`}
            onClick={handleToggleTheme}>
            <span className={css.switchThumb} />
          </button>
        </div>
      </div>

      {isAuthenticated && (
        <div className={css.card}>
          <span className={css.sectionLabel}>Account</span>
          <button
            type="button"
            className={css.logoutBtn}
            onClick={() => void handleLogout()}
            disabled={isLoggingOut}>
            <MdLogout size={16} />
            <span>{isLoggingOut ? "Signing out..." : "Sign Out"}</span>
          </button>
        </div>
      )}
    </section>
  )
}
