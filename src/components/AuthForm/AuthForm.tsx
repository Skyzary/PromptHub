import React, { useState } from "react"
import { LuEye, LuEyeOff } from "react-icons/lu"
import * as z from "zod"

import Btn from "~src/components/ui/Btn/Btn"
import { login, register } from "~src/utils/auth"
import BackendBadge from "../BackendBadge/BackendBadge"

import css from "./AuthForm.module.scss"

type AuthMode = "login" | "register"

interface AuthFormProps {
  initialMode?: AuthMode
  onAuthSuccess: () => void
}

export default function AuthForm({
  initialMode = "register",
  onAuthSuccess
}: AuthFormProps) {
  const [mode, setMode] = useState<AuthMode>(initialMode)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleModeChange = (nextMode: AuthMode) => {
    setMode(nextMode)
    setError(null)
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      if (mode === "register") {
        await register({ email, password })
      }
      await login({ email, password })
      onAuthSuccess()
    } catch (err) {
      if (err instanceof z.ZodError) {
        setError(err.issues[0]?.message || "Validation error")
      } else if (err instanceof Error) {
        setError(err.message)
      } else {
        setError("Authentication failed")
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <section className={css.authContainer}>
      <div className={css.tabs}>
        <button
          type="button"
          className={`${css.tabBtn} ${mode === "login" ? css.tabBtnActive : ""}`}
          onClick={() => handleModeChange("login")}>
          Sign In
        </button>
        <button
          type="button"
          className={`${css.tabBtn} ${mode === "register" ? css.tabBtnActive : ""}`}
          onClick={() => handleModeChange("register")}>
          Sign Up
        </button>
      </div>

      <form
        className={css.form}
        onSubmit={handleSubmit}
        noValidate>
        <div className={css.fieldGroup}>
          <label
            htmlFor="auth-email"
            className={css.label}>
            Email
          </label>
          <input
            id="auth-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="user@example.com"
            className={css.input}
            autoComplete="email"
            required
          />
        </div>

        <div className={css.fieldGroup}>
          <label
            htmlFor="auth-password"
            className={css.label}>
            Password
          </label>
          <div className={css.passwordInputWrapper}>
            <input
              id="auth-password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className={`${css.input} ${css.passwordInput}`}
              autoComplete={
                mode === "register" ? "new-password" : "current-password"
              }
              required
            />
            <button
              type="button"
              className={css.togglePasswordBtn}
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              title={showPassword ? "Hide password" : "Show password"}>
              {showPassword ? (
                <LuEyeOff className={css.togglePasswordIcon} />
              ) : (
                <LuEye className={css.togglePasswordIcon} />
              )}
            </button>
          </div>
          {mode === "register" && (
            <span className={css.hint}>
              8–32 chars, at least 1 uppercase letter and 1 special character
            </span>
          )}
        </div>

        {error && <div className={css.errorBox}>{error}</div>}

        <Btn
          type="submit"
          styleType="primary"
          onClick={() => {}}
          disabled={isLoading}
          className={css.submitBtn}>
          {isLoading
            ? "Please wait..."
            : mode === "register"
              ? "Create account"
              : "Sign In"}
        </Btn>
      </form>

      <div className={css.backendFooter}>
        <BackendBadge />
      </div>
    </section>
  )
}
