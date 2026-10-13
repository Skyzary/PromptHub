import React from "react"

import PromptHubLogo from "../../components/PromptHubLogo/PromptHubLogo"
import css from "../gemini-prompts.module.scss"
import { CloseIcon, RefreshIcon, SearchIcon } from "./GeminiIcons"

export interface GeminiHeaderProps {
  searchQuery: string
  onSearchChange: (value: string) => void
  onRefresh: () => void
  onClose: () => void
  isLoading: boolean
}

export const GeminiHeader: React.FC<GeminiHeaderProps> = ({
  searchQuery,
  onSearchChange,
  onRefresh,
  onClose,
  isLoading
}) => (
  <div className={css.header}>
    <div className={css.brand}>
      <PromptHubLogo size={24} />
      <h3 className={css.title}>PromptHub</h3>
    </div>
    <div className={css.searchBar}>
      <SearchIcon className={css.searchIcon} />
      <input
        type="text"
        className={css.searchInput}
        placeholder="Search prompts or #tag..."
        aria-label="Search Gemini prompts"
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
      />
    </div>
    <div className={css.headerActions}>
      <button
        type="button"
        className={css.iconBtn}
        onClick={onRefresh}
        disabled={isLoading}
        aria-label="Refresh prompts"
        title="Refresh prompts">
        <RefreshIcon />
      </button>
      <button
        type="button"
        className={css.iconBtn}
        onClick={onClose}
        aria-label="Close prompts popover"
        title="Close">
        <CloseIcon />
      </button>
    </div>
  </div>
)
