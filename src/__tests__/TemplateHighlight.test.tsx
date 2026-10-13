import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import TemplateHighlight from "../components/TemplateHighlight/TemplateHighlight"

describe("TemplateHighlight component", () => {
  it("renders plain text without variables", () => {
    const { container } = render(
      <TemplateHighlight text="Just plain text without variables" />
    )
    expect(container.textContent).toBe("Just plain text without variables")
    expect(screen.queryByTestId(/template-variable-/)).not.toBeInTheDocument()
  })

  it("renders variables and highlights active variable", () => {
    const onVariableClick = vi.fn()
    render(
      <TemplateHighlight
        text="Write a {{tone}} essay about {{topic}}"
        values={{ tone: "funny" }}
        activeVariableIndex={1}
        onVariableClick={onVariableClick}
      />
    )

    // First variable has custom value "funny"
    const toneVar = screen.getByTestId("template-variable-tone")
    expect(toneVar).toHaveTextContent("funny")

    // Second variable is not filled, falls back to raw "{{topic}}"
    const topicVar = screen.getByTestId("template-variable-topic")
    expect(topicVar).toHaveTextContent("{{topic}}")

    // Active variable is index 1 (topic)
    expect(topicVar.className).toMatch(/variableActive/)
    expect(toneVar.className).not.toMatch(/variableActive/)

    // Clicking variable invokes callback
    fireEvent.click(toneVar)
    expect(onVariableClick).toHaveBeenCalledWith(0, "tone")

    fireEvent.click(topicVar)
    expect(onVariableClick).toHaveBeenCalledWith(1, "topic")
  })
})
