import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import ListSection from "./ListSection"

describe("ListSection component", () => {
  it("renders the heading", () => {
    // Arrange
    render(<ListSection />)

    // Act
    const heading = screen.getByRole("heading", { name: /Recent & Favorites/i })

    // Assert
    expect(heading).toBeInTheDocument()
  })

  it("renders the list container", () => {
    // Arrange
    render(<ListSection />)

    // Act
    const list = screen.getByRole("list")

    // Assert
    expect(list).toBeInTheDocument()
  })
})
