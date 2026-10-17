import React from "react"

import css from "../gemini-prompts.module.scss"

export interface GeminiStateViewProps {
  isLoading: boolean
  isAuthenticated: boolean
  errorMessage: string | null
  totalPromptsCount: number
}

export const GeminiStateView: React.FC<GeminiStateViewProps> = ({
  isLoading,
  isAuthenticated,
  errorMessage,
  totalPromptsCount
}) => {
  if (isLoading) {
    return <div className={css.stateBox}>Loading prompts...</div>
  }

  if (!isAuthenticated) {
    return (
      <div className={css.stateBox}>
        Please sign in via the TemplaGem extension popup to see your prompts.
      </div>
    )
  }

  if (errorMessage) {
    return (
      <div
        className={css.errorBox}
        role="alert">
        {errorMessage}
      </div>
    )
  }

  return (
    <div className={css.stateBox}>
      {totalPromptsCount === 0
        ? "No prompts saved yet."
        : "No prompts match your search."}
    </div>
  )
}
