import type { IPrompt } from "../types"

export type SortOption =
  | "created-desc"
  | "created-asc"
  | "title-asc"
  | "title-desc"
  | "updated-desc"
  | "updated-asc"

export interface SortOptionConfig {
  id: SortOption
  label: string
}

export const SORT_OPTIONS: SortOptionConfig[] = [
  { id: "created-desc", label: "Date created (newest first)" },
  { id: "created-asc", label: "Date created (oldest first)" },
  { id: "title-asc", label: "Alphabetical (A → Z)" },
  { id: "title-desc", label: "Alphabetical (Z → A)" },
  { id: "updated-desc", label: "Last modified (newest first)" },
  { id: "updated-asc", label: "Last modified (oldest first)" }
]

export const DEFAULT_SORT_OPTION: SortOption = "created-desc"
export const SORT_STORAGE_KEY = "templagem_sort_order"

function parseDateValue(value?: Date | string): number {
  if (!value) return 0
  if (value instanceof Date) {
    const t = value.getTime()
    return Number.isNaN(t) ? 0 : t
  }
  const parsed = new Date(value).getTime()
  return Number.isNaN(parsed) ? 0 : parsed
}

export function sortPrompts(prompts: IPrompt[], sortOption: SortOption): IPrompt[] {
  // Preserve stable original index for tiebreakers
  const indexed = prompts.map((item, index) => ({ item, index }))

  indexed.sort((a, b) => {
    switch (sortOption) {
      case "created-desc": {
        const timeA = parseDateValue(a.item.createdAt)
        const timeB = parseDateValue(b.item.createdAt)
        if (timeA !== timeB) return timeB - timeA
        return a.index - b.index
      }
      case "created-asc": {
        const timeA = parseDateValue(a.item.createdAt)
        const timeB = parseDateValue(b.item.createdAt)
        if (timeA !== timeB) return timeA - timeB
        return a.index - b.index
      }
      case "title-asc": {
        const cmp = a.item.title.localeCompare(b.item.title, undefined, { sensitivity: "base" })
        if (cmp !== 0) return cmp
        return a.index - b.index
      }
      case "title-desc": {
        const cmp = b.item.title.localeCompare(a.item.title, undefined, { sensitivity: "base" })
        if (cmp !== 0) return cmp
        return a.index - b.index
      }
      case "updated-desc": {
        const timeA = parseDateValue(a.item.updatedAt) || parseDateValue(a.item.createdAt)
        const timeB = parseDateValue(b.item.updatedAt) || parseDateValue(b.item.createdAt)
        if (timeA !== timeB) return timeB - timeA
        return a.index - b.index
      }
      case "updated-asc": {
        const timeA = parseDateValue(a.item.updatedAt) || parseDateValue(a.item.createdAt)
        const timeB = parseDateValue(b.item.updatedAt) || parseDateValue(b.item.createdAt)
        if (timeA !== timeB) return timeA - timeB
        return a.index - b.index
      }
      default:
        return 0
    }
  })

  return indexed.map((x) => x.item)
}

export function getStoredSortOption(): SortOption {
  if (typeof window !== "undefined" && window.localStorage) {
    const stored = window.localStorage.getItem(SORT_STORAGE_KEY)
    if (
      stored &&
      SORT_OPTIONS.some((opt) => opt.id === stored)
    ) {
      return stored as SortOption
    }
  }
  return DEFAULT_SORT_OPTION
}

export function setStoredSortOption(sortOption: SortOption): void {
  if (typeof window !== "undefined" && window.localStorage) {
    window.localStorage.setItem(SORT_STORAGE_KEY, sortOption)
  }
  if (typeof chrome !== "undefined" && chrome.storage?.local) {
    void chrome.storage.local.set({ [SORT_STORAGE_KEY]: sortOption })
  }
}
