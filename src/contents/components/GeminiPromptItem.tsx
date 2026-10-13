import React from "react"

import TemplateHighlight from "../../components/TemplateHighlight/TemplateHighlight"
import type { IPrompt } from "../../types"
import css from "../gemini-prompts.module.scss"
import { EnterIcon } from "./GeminiIcons"

export interface GeminiPromptItemProps {
  prompt: IPrompt
  isSelected: boolean
  onSelect: (prompt: IPrompt) => void
  onMouseEnter: () => void
}

export const GeminiPromptItem: React.FC<GeminiPromptItemProps> = ({
  prompt,
  isSelected,
  onSelect,
  onMouseEnter
}) => (
  <button
    type="button"
    className={`${css.promptItem} ${isSelected ? css.promptItemSelected : ""}`}
    onClick={() => onSelect(prompt)}
    onMouseEnter={onMouseEnter}>
    <div className={css.promptItemContent}>
      <div className={css.itemSparkleBadge}>
        <span className={css.promptBullet}>✦</span>
      </div>
      <div className={css.itemDetails}>
        <div className={css.promptHeader}>
          <span className={css.promptTitle}>{prompt.title}</span>
          {prompt.tags && prompt.tags.length > 0 && (
            <div className={css.tagRow}>
              {prompt.tags.map((tag) => (
                <span
                  key={tag}
                  className={css.tagBadge}>
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className={css.promptPreview}>
          <TemplateHighlight text={prompt.body} />
        </div>
      </div>
    </div>
    <div className={css.insertHint}>
      <EnterIcon className={css.enterIcon} />
      <span>Insert</span>
    </div>
  </button>
)
