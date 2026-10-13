import React from "react"

import css from "./TagFilter.module.scss"

export interface TagFilterProps {
  tags: string[]
  selectedTag: string | null
  onSelectTag: (tag: string | null) => void
  className?: string
  ariaLabel?: string
}

export default function TagFilter({
  tags,
  selectedTag,
  onSelectTag,
  className,
  ariaLabel = "Filter by tags"
}: TagFilterProps) {
  if (tags.length === 0) {
    return null
  }

  return (
    <nav
      className={`${css.tagFilter} ${className ?? ""}`}
      aria-label={ariaLabel}
      data-testid="tag-filter-bar">
      <button
        type="button"
        className={`${css.tagChip} ${selectedTag === null ? css.tagChipActive : ""}`}
        onClick={() => onSelectTag(null)}
        aria-pressed={selectedTag === null}>
        All
      </button>
      {tags.map((tag) => {
        const isSelected = selectedTag?.toLowerCase() === tag.toLowerCase()
        return (
          <button
            key={tag}
            type="button"
            className={`${css.tagChip} ${isSelected ? css.tagChipActive : ""}`}
            onClick={() => onSelectTag(isSelected ? null : tag)}
            aria-pressed={isSelected}>
            #{tag}
          </button>
        )
      })}
    </nav>
  )
}
