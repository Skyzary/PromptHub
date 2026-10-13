import React, { useEffect } from "react"

import type { IPrompt } from "../../types"
import css from "../gemini-prompts.module.scss"
import { GeminiPromptItem } from "./GeminiPromptItem"

export interface GeminiPromptListProps {
  prompts: IPrompt[]
  selectedIndex: number
  onSelectPrompt: (prompt: IPrompt) => void
  onHoverIndex: (index: number) => void
  listRef?: React.RefObject<HTMLUListElement>
}

export const GeminiPromptList: React.FC<GeminiPromptListProps> = ({
  prompts,
  selectedIndex,
  onSelectPrompt,
  onHoverIndex,
  listRef
}) => {
  useEffect(() => {
    if (!listRef?.current) return
    const buttons = listRef.current.querySelectorAll("button")
    const activeBtn = buttons[selectedIndex]
    activeBtn?.scrollIntoView?.({ block: "nearest" })
  }, [selectedIndex, listRef])

  return (
    <ul
      ref={listRef}
      className={css.list}>
      {prompts.map((prompt, index) => (
        <li key={prompt._id}>
          <GeminiPromptItem
            prompt={prompt}
            isSelected={index === selectedIndex}
            onSelect={onSelectPrompt}
            onMouseEnter={() => onHoverIndex(index)}
          />
        </li>
      ))}
    </ul>
  )
}
