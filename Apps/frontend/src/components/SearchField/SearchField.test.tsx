import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import SearchField from "./SearchField"

describe("SearchField component", () => {
  it("renders search input", () => {
    // Arrange
    const onSearchMock = vi.fn()
    render(<SearchField onSearch={onSearchMock} />)

    // Act & Assert
    const input = screen.getByPlaceholderText("Search prompts")
    expect(input).toBeInTheDocument()
  })

  it("calls onSearch when typing in the input", async () => {
    // Arrange
    const onSearchMock = vi.fn()
    const user = userEvent.setup()
    render(<SearchField onSearch={onSearchMock} />)

    // Act
    const input = screen.getByPlaceholderText("Search prompts")
    await user.type(input, "test query")

    // Assert
    // It should be called for each character typed (10 characters)
    expect(onSearchMock).toHaveBeenCalledTimes(10)
    expect(onSearchMock).toHaveBeenLastCalledWith("test query")
  })
})
