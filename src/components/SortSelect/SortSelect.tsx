import React, { useEffect, useRef, useState } from "react"
import {
  LuArrowDownAZ,
  LuArrowUpAZ,
  LuCalendarArrowDown,
  LuCalendarArrowUp,
  LuClockArrowDown,
  LuClockArrowUp
} from "react-icons/lu"
import { MdCheck } from "react-icons/md"

import {
  SORT_OPTIONS,
  type SortOption
} from "~src/utils/prompt-sort"

import css from "./SortSelect.module.scss"

interface SortSelectProps {
  value: SortOption
  onChange: (sort: SortOption) => void
}

function getSortOptionIcon(optionId: SortOption, className?: string) {
  switch (optionId) {
    case "created-desc":
      return <LuCalendarArrowDown className={className} />
    case "created-asc":
      return <LuCalendarArrowUp className={className} />
    case "title-asc":
      return <LuArrowUpAZ className={className} />
    case "title-desc":
      return <LuArrowDownAZ className={className} />
    case "updated-desc":
      return <LuClockArrowDown className={className} />
    case "updated-asc":
      return <LuClockArrowUp className={className} />
  }
}

export default function SortSelect({ value, onChange }: SortSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleOutsideClick)
      document.addEventListener("keydown", handleKeyDown)
    }

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick)
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [isOpen])

  const currentOption = SORT_OPTIONS.find((opt) => opt.id === value) ?? SORT_OPTIONS[0]

  const handleSelect = (optionId: SortOption) => {
    onChange(optionId)
    setIsOpen(false)
  }

  return (
    <div
      className={css.sortContainer}
      ref={containerRef}>
      <button
        type="button"
        className={`${css.sortTrigger} ${isOpen ? css.sortTriggerActive : ""}`}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="Sort prompts"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        title={`Sort prompts: ${currentOption.label}`}>
        {getSortOptionIcon(currentOption.id, css.sortIcon)}
      </button>

      {isOpen && (
        <ul
          className={css.dropdownMenu}
          role="listbox"
          aria-label="Sort options">
          {SORT_OPTIONS.map((option) => {
            const isSelected = option.id === value
            return (
              <li
                key={option.id}
                role="option"
                aria-selected={isSelected}>
                <button
                  type="button"
                  className={`${css.menuItem} ${isSelected ? css.menuItemActive : ""}`}
                  onClick={() => handleSelect(option.id)}>
                  <div className={css.menuItemLeading}>
                    {getSortOptionIcon(option.id, css.optionIcon)}
                    <span className={css.menuItemLabel}>{option.label}</span>
                  </div>
                  {isSelected && <MdCheck className={css.checkIcon} />}
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

