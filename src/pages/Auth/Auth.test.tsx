import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import Auth from "./Auth"

describe("Auth Component", () => {
  let logSpy

  beforeEach(() => {
    logSpy = vi.spyOn(console, "log").mockImplementation(() => {})
  })

  afterEach(() => {
    logSpy.mockRestore()
  })

  it("should render the auth form", () => {
    render(<Auth />)
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /^login$/i })).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: /register/i })
    ).toBeInTheDocument()
  })

  it("should log the result on valid submission", async () => {
    const user = userEvent.setup()
    render(<Auth />)

    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const loginButton = screen.getByRole("button", { name: /^login$/i })

    await user.type(emailInput, "test@example.com")
    await user.type(passwordInput, "Password123!")
    await user.click(loginButton)

    await waitFor(
      () => {
        expect(logSpy).toHaveBeenCalledWith(
          expect.objectContaining({
            email: "test@example.com",
            password: "Password123!"
          })
        )
      },
      { timeout: 3000 }
    )
  })

  it("should log validation error on invalid email", async () => {
    const user = userEvent.setup()
    render(<Auth />)

    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const loginButton = screen.getByRole("button", { name: /^login$/i })

    await user.type(emailInput, "invalid-email")
    await user.type(passwordInput, "Password123!")
    await user.click(loginButton)

    await waitFor(() => {
      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining("Invalid email")
      )
    })
  })

  it("should log validation error on short password", async () => {
    const user = userEvent.setup()
    render(<Auth />)

    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const loginButton = screen.getByRole("button", { name: /^login$/i })

    await user.type(emailInput, "test@example.com")
    await user.type(passwordInput, "short")
    await user.click(loginButton)

    await waitFor(() => {
      // ZodError.message for multiple errors is a stringified array
      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining("too_small"))
    })
  })
})
