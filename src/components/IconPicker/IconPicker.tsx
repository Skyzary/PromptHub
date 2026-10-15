import React, { useMemo, useState } from "react"
import { LuChevronDown, LuSearch, LuX } from "react-icons/lu"

import {
  DEFAULT_PROMPT_ICON_ID,
  getPromptIconDescriptor,
  PROMPT_ICON_CATEGORIES,
  PROMPT_ICONS,
  type PromptIconCategory
} from "~src/utils/prompt-icons"

import PromptIcon from "../PromptIcon/PromptIcon"
import css from "./IconPicker.module.scss"

export interface IconPickerProps {
  value?: string | null
  onChange: (iconId: string) => void
  label?: string
  className?: string
  compact?: boolean
  disabled?: boolean
}

export default function IconPicker({
  value,
  onChange,
  label = "Icon",
  className,
  compact = false,
  disabled = false
}: IconPickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [selectedCategory, setSelectedCategory] =
    useState<PromptIconCategory>("All")

  const currentIconId = value || DEFAULT_PROMPT_ICON_ID
  const currentDescriptor =
    getPromptIconDescriptor(currentIconId) ||
    getPromptIconDescriptor(DEFAULT_PROMPT_ICON_ID)

  const filteredIcons = useMemo(() => {
    const query = search.trim().toLowerCase()
    return PROMPT_ICONS.filter((item) => {
      const matchesCategory =
        selectedCategory === "All" || item.category === selectedCategory
      if (!matchesCategory) return false

      if (!query) return true
      return (
        item.name.toLowerCase().includes(query) ||
        item.id.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query)
      )
    })
  }, [search, selectedCategory])

  const handleSelectIcon = (iconId: string) => {
    onChange(iconId)
    setIsOpen(false)
  }

  return (
    <div
      className={`${css.iconPickerContainer} ${
        compact ? css.compactContainer : ""
      } ${className ?? ""}`}>
      {label && !compact && <span className={css.label}>{label}</span>}

      <button
        type="button"
        className={`${css.triggerBtn} ${compact ? css.compactTrigger : ""}`}
        onClick={() => {
          if (!disabled) {
            setIsOpen(true)
          }
        }}
        disabled={disabled}
        aria-label={`Select icon, currently ${currentDescriptor?.name ?? "Sparkles"}`}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        data-testid="icon-picker-trigger">
        <div className={css.triggerLeft}>
          <div className={css.triggerIconWrapper}>
            <PromptIcon
              icon={currentIconId}
              size={18}
            />
          </div>
          {!compact && (
            <span className={css.triggerText}>
              {currentDescriptor?.name ?? "Sparkles"}
            </span>
          )}
        </div>
        <span className={css.triggerChevron}>
          <LuChevronDown aria-hidden={true} />
        </span>
      </button>

      {isOpen && (
        <div
          className={css.overlay}
          onClick={() => setIsOpen(false)}
          role="presentation">
          <div
            className={css.modal}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Choose icon"
            data-testid="icon-picker-modal">
            {/* Header */}
            <div className={css.modalHeader}>
              <h3 className={css.modalTitle}>Choose an icon</h3>
              <button
                type="button"
                className={css.closeBtn}
                onClick={() => setIsOpen(false)}
                aria-label="Close icon picker">
                <LuX />
              </button>
            </div>

            {/* Search Input */}
            <div className={css.searchWrapper}>
              <span className={css.searchIcon}>
                <LuSearch size={14} />
              </span>
              <input
                type="text"
                placeholder="Search icons..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={css.searchInput}
                autoFocus
                aria-label="Search icons"
              />
              {search && (
                <button
                  type="button"
                  className={css.clearSearchBtn}
                  onClick={() => setSearch("")}
                  aria-label="Clear search">
                  <LuX size={12} />
                </button>
              )}
            </div>

            {/* Categories */}
            <div className={css.categoryTabs}>
              {PROMPT_ICON_CATEGORIES.map((category) => (
                <button
                  key={category}
                  type="button"
                  className={`${css.categoryChip} ${
                    selectedCategory === category ? css.categoryChipActive : ""
                  }`}
                  onClick={() => setSelectedCategory(category)}>
                  {category}
                </button>
              ))}
            </div>

            {/* Grid */}
            <div
              className={css.grid}
              role="listbox"
              aria-label="Available icons">
              {filteredIcons.map((item) => {
                const isSelected = item.id === currentIconId
                return (
                  <button
                    key={item.id}
                    type="button"
                    className={`${css.iconTile} ${
                      isSelected ? css.iconTileSelected : ""
                    }`}
                    onClick={() => handleSelectIcon(item.id)}
                    title={item.name}
                    aria-label={item.name}
                    aria-selected={isSelected}
                    role="option"
                    data-testid={`icon-tile-${item.id}`}>
                    <PromptIcon
                      icon={item.id}
                      size={20}
                    />
                  </button>
                )
              })}
            </div>

            {filteredIcons.length === 0 && (
              <div className={css.emptyState}>No icons found</div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
