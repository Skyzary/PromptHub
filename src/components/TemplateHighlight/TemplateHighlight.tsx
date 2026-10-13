import clsx from "clsx"
import React from "react"

import { parseTemplateSegments } from "../../utils/template"
import css from "./TemplateHighlight.module.scss"

interface TemplateHighlightProps {
  text: string
  values?: Record<string, string>
  activeVariableIndex?: number
  className?: string
  onVariableClick?: (variableIndex: number, variableName: string) => void
}

export default function TemplateHighlight({
  text,
  values = {},
  activeVariableIndex,
  className,
  onVariableClick
}: TemplateHighlightProps) {
  const segments = parseTemplateSegments(text)

  return (
    <div className={clsx(css.templateContainer, className)}>
      {segments.map((segment) => {
        if (segment.type === "text") {
          return <span key={segment.index}>{segment.value}</span>
        }

        const isCurrentActive =
          typeof activeVariableIndex === "number" &&
          segment.variableIndex === activeVariableIndex

        const displayValue =
          values[segment.value] && values[segment.value].length > 0
            ? values[segment.value]
            : segment.raw

        return (
          <span
            key={segment.index}
            className={clsx(
              css.variable,
              isCurrentActive && css.variableActive
            )}
            onClick={() => {
              if (
                typeof segment.variableIndex === "number" &&
                onVariableClick
              ) {
                onVariableClick(segment.variableIndex, segment.value)
              }
            }}
            data-variable-index={segment.variableIndex}
            data-testid={`template-variable-${segment.value}`}>
            {displayValue}
          </span>
        )
      })}
    </div>
  )
}
