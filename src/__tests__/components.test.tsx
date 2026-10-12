import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import AddNewBtn from "~src/components/AddNewBtn/AddNewBtn"
import AuthForm from "~src/components/AuthForm/AuthForm"
import Header from "~src/components/Header/Header"
import PromptCard from "~src/components/PromptCard/PromptCard"
import PromptIcon from "~src/components/PromptIcon/PromptIcon"
import SearchField from "~src/components/SearchField/SearchField"
import Btn from "~src/components/ui/Btn/Btn"
import * as authModule from "~src/utils/auth"

describe("UI & Presentational Components", () => {
  it("renders Header with PromptHub title and settings button", () => {
    render(<Header />)
    expect(
      screen.getByRole("heading", { name: "PromptHub" })
    ).toBeInTheDocument()
    expect(screen.getByRole("button")).toBeInTheDocument()
  })

  it("renders Btn in primary and secondary variants and handles click", async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    const { rerender } = render(
      <Btn
        styleType="primary"
        onClick={onClick}>
        Primary Action
      </Btn>
    )

    await user.click(screen.getByRole("button", { name: "Primary Action" }))
    expect(onClick).toHaveBeenCalledTimes(1)

    rerender(
      <Btn
        styleType="secondary"
        onClick={onClick}>
        Secondary Action
      </Btn>
    )
    expect(
      screen.getByRole("button", { name: "Secondary Action" })
    ).toBeInTheDocument()
  })

  it("renders AddNewBtn and triggers callback", async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    render(<AddNewBtn onClick={onClick} />)

    await user.click(screen.getByRole("button", { name: /create new prompt/i }))
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it("renders SearchField and emits query changes", async () => {
    const user = userEvent.setup()
    const onSearch = vi.fn()
    render(<SearchField onSearch={onSearch} />)

    const input = screen.getByRole("textbox", { name: /search prompts/i })
    await user.type(input, "react")
    expect(onSearch).toHaveBeenLastCalledWith("react")
  })

  it("renders PromptIcon for all preset types and unknown fallback", () => {
    const types = [
      "development",
      "daily",
      "education",
      "entertainment",
      "other",
      "unknown-tag"
    ]
    for (const type of types) {
      const { container, unmount } = render(<PromptIcon type={type} />)
      expect(container.querySelector("svg")).toBeInTheDocument()
      unmount()
    }
  })

  it("renders PromptCard, handles card click, and copies description without bubbling", async () => {
    const user = userEvent.setup()
    const onCardClick = vi.fn()
    const writeTextSpy = vi
      .spyOn(navigator.clipboard, "writeText")
      .mockResolvedValue(undefined)

    render(
      <PromptCard
        name="TS Assistant"
        description="Review TypeScript code"
        type="development"
        onClick={onCardClick}
      />
    )

    expect(screen.getByText("TS Assistant")).toBeInTheDocument()
    expect(screen.getByText("Review TypeScript code")).toBeInTheDocument()

    // Click copy button -> should NOT trigger onCardClick
    const copyBtn = screen.getByRole("button", { name: /copy prompt/i })
    await user.click(copyBtn)
    expect(writeTextSpy).toHaveBeenCalledWith("Review TypeScript code")
    expect(onCardClick).not.toHaveBeenCalled()

    // Click card -> triggers onCardClick
    await user.click(screen.getByText("TS Assistant"))
    expect(onCardClick).toHaveBeenCalledTimes(1)
  })
})

describe("AuthForm Component", () => {
  it("switches between Sign Up and Sign In modes and handles validation/API errors and success", async () => {
    const user = userEvent.setup()
    const onAuthSuccess = vi.fn()

    const registerSpy = vi.spyOn(authModule, "register")
    const loginSpy = vi.spyOn(authModule, "login")

    render(<AuthForm onAuthSuccess={onAuthSuccess} />)

    // Default is register mode
    expect(
      screen.getByRole("button", { name: /create account/i })
    ).toBeInTheDocument()

    // Submit empty form -> shows Zod validation error
    await user.click(screen.getByRole("button", { name: /create account/i }))
    expect(await screen.findByText(/invalid email/i)).toBeInTheDocument()

    // Switch to Sign In mode
    await user.click(screen.getByRole("button", { name: "Sign In" }))
    expect(screen.queryByText(/invalid email/i)).not.toBeInTheDocument()

    // Fill valid credentials and test login error
    await user.type(screen.getByLabelText(/email/i), "user@example.com")
    await user.type(screen.getByLabelText(/password/i), "Password1!")

    loginSpy.mockRejectedValueOnce(new Error("Invalid credentials"))
    const submitButtons = screen.getAllByRole("button", { name: "Sign In" })
    await user.click(submitButtons[submitButtons.length - 1])
    expect(await screen.findByText("Invalid credentials")).toBeInTheDocument()

    // Switch back to Sign Up and succeed
    await user.click(screen.getByRole("button", { name: "Sign Up" }))
    registerSpy.mockResolvedValueOnce({ message: "Registered" })
    loginSpy.mockResolvedValueOnce({
      accessToken: "acc",
      refreshToken: "ref"
    })

    await user.click(screen.getByRole("button", { name: /create account/i }))
    expect(registerSpy).toHaveBeenCalledWith({
      email: "user@example.com",
      password: "Password1!"
    })
    expect(loginSpy).toHaveBeenCalledWith({
      email: "user@example.com",
      password: "Password1!"
    })
    expect(onAuthSuccess).toHaveBeenCalledTimes(1)
  })
})
