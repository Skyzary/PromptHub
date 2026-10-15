import { useEffect, useMemo, useState } from "react"

import {
  fetchPrompts,
  getCachedPrompts,
  subscribePromptsCache
} from "~src/prompts-api"
import type { IPrompt } from "~src/types"
import { resolvePromptIcon } from "~src/utils/prompt-icons"
import {
  getStoredSortOption,
  setStoredSortOption,
  sortPrompts,
  type SortOption
} from "~src/utils/prompt-sort"

import PromptCard from "../PromptCard/PromptCard"
import PromptDetailsModal from "../PromptDetailsModal/PromptDetailsModal"
import SortSelect from "../SortSelect/SortSelect"
import TagFilter from "../TagFilter/TagFilter"
import css from "./ListSection.module.scss"

interface ListSectionProps {
  prompts?: IPrompt[]
  searchQuery?: string
  selectedTag?: string | null
  onSelectTag?: (tag: string | null) => void
  onClearFilters?: () => void
}

export default function ListSection({
  prompts: externalPrompts,
  searchQuery = "",
  selectedTag,
  onSelectTag,
  onClearFilters
}: ListSectionProps) {
  const [prompts, setPrompts] = useState<IPrompt[]>(
    () => externalPrompts ?? getCachedPrompts() ?? []
  )
  const [selectedPrompt, setSelectedPrompt] = useState<IPrompt | null>(null)
  const [internalTag, setInternalTag] = useState<string | null>(null)
  const [sortOption, setSortOption] = useState<SortOption>(() =>
    getStoredSortOption()
  )

  const handleSortChange = (newSort: SortOption) => {
    setSortOption(newSort)
    setStoredSortOption(newSort)
  }

  const activeTag = selectedTag !== undefined ? selectedTag : internalTag
  const setActiveTag = onSelectTag ?? setInternalTag

  useEffect(() => {
    if (externalPrompts) {
      setPrompts(externalPrompts)
      return
    }

    const loadPrompts = async (forceRefresh = false) => {
      // 1. Try to fetch fresh or memory/localStorage cached prompts
      const data = await fetchPrompts(undefined, forceRefresh)
      if (Array.isArray(data) && data.length > 0) {
        setPrompts(data)
        return
      }

      // 2. If empty (e.g. backend offline or extension reopened), fallback to chrome.storage.local
      if (typeof chrome !== "undefined" && chrome.storage?.local) {
        try {
          const stored = await chrome.storage.local.get("prompthub_prompts_cache")
          const storedCache = stored?.prompthub_prompts_cache
          if (Array.isArray(storedCache) && storedCache.length > 0) {
            setPrompts(storedCache)
            return
          }
        } catch {
          // Ignore storage read error
        }
      }

      setPrompts(data ?? [])
    }

    void loadPrompts(true)

    const unsubscribe = subscribePromptsCache(() => {
      void loadPrompts(true)
    })

    return unsubscribe
  }, [externalPrompts])

  const availableTags = useMemo(() => {
    const set = new Set<string>()
    for (const p of prompts) {
      if (Array.isArray(p.tags)) {
        for (const t of p.tags) {
          const trimmed = t.trim()
          if (trimmed) set.add(trimmed)
        }
      }
    }
    return Array.from(set)
  }, [prompts])

  const handlePromptUpdated = (updatedPrompt: IPrompt) => {
    setSelectedPrompt(updatedPrompt)
    setPrompts((prev) =>
      prev.map((item) =>
        item._id && item._id === updatedPrompt._id ? updatedPrompt : item
      )
    )
  }

  const handlePromptDeleted = (deletedPromptId: string) => {
    setSelectedPrompt(null)
    setPrompts((prev) => prev.filter((item) => item._id !== deletedPromptId))
  }

  const normalizedQuery = searchQuery.trim().toLowerCase()
  const queryTokens = normalizedQuery
    ? normalizedQuery.split(/\s+/).filter(Boolean)
    : []
  const isFiltering = queryTokens.length > 0 || Boolean(activeTag)

  const filteredPrompts = isFiltering
    ? prompts.filter((prompt) => {
        if (activeTag) {
          const hasTag = (prompt.tags ?? []).some(
            (t) => t.toLowerCase() === activeTag.toLowerCase()
          )
          if (!hasTag) return false
        }

        if (queryTokens.length === 0) return true

        const titleLower = prompt.title.toLowerCase()
        const bodyLower = prompt.body.toLowerCase()
        const tagsLower = (prompt.tags ?? []).map((t) => t.toLowerCase())

        return queryTokens.every((token) => {
          if (token.startsWith("#") && token.length > 1) {
            const tagToken = token.slice(1)
            return tagsLower.some((tag) => tag.includes(tagToken))
          }
          return (
            titleLower.includes(token) ||
            bodyLower.includes(token) ||
            tagsLower.some((tag) => tag.includes(token))
          )
        })
      })
    : prompts

  const sortedAndFilteredPrompts = useMemo(() => {
    return sortPrompts(filteredPrompts, sortOption)
  }, [filteredPrompts, sortOption])

  const handleResetFilters = () => {
    setActiveTag(null)
    onClearFilters?.()
  }

  return (
    <section className={css.listSection}>
      <div className={css.listHeaderRow}>
        <div className={css.headerTitleGroup}>
          <h2 className={css.listHeading}>
            {isFiltering ? "Search Results" : "Recent & Favorites"}
          </h2>
          <span className={css.listCount}>{sortedAndFilteredPrompts.length}</span>
        </div>
        <SortSelect
          value={sortOption}
          onChange={handleSortChange}
        />
      </div>
      {availableTags.length > 0 && (
        <TagFilter
          tags={availableTags}
          selectedTag={activeTag}
          onSelectTag={setActiveTag}
        />
      )}
      {sortedAndFilteredPrompts.length > 0 ? (
        <ul className={css.listContainer}>
          {sortedAndFilteredPrompts.map((prompt, index) => (
            <PromptCard
              key={prompt._id ?? `${prompt.title}-${index}`}
              name={prompt.title}
              description={prompt.body}
              type={prompt.tags?.[0] ?? "other"}
              tags={prompt.tags}
              icon={prompt.icon ?? resolvePromptIcon(prompt)}
              onClick={() => setSelectedPrompt(prompt)}
            />
          ))}
        </ul>
      ) : (
        <div className={css.emptyState}>
          <span>
            {isFiltering
              ? "No prompts match your search."
              : "No prompts yet. Create your first prompt below!"}
          </span>
          {isFiltering && (
            <button
              type="button"
              className={css.resetFilterBtn}
              onClick={handleResetFilters}>
              Reset search
            </button>
          )}
        </div>
      )}
      <PromptDetailsModal
        prompt={selectedPrompt}
        isOpen={Boolean(selectedPrompt)}
        onClose={() => setSelectedPrompt(null)}
        onUpdated={handlePromptUpdated}
        onDeleted={handlePromptDeleted}
      />
    </section>
  )
}
