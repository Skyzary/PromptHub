import { useEffect, useMemo, useState } from "react"

import {
  fetchPrompts,
  getCachedPrompts,
  subscribePromptsCache
} from "~src/prompts-api"
import type { IPrompt } from "~src/types"

import PromptCard from "../PromptCard/PromptCard"
import PromptDetailsModal from "../PromptDetailsModal/PromptDetailsModal"
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

  const activeTag = selectedTag !== undefined ? selectedTag : internalTag
  const setActiveTag = onSelectTag ?? setInternalTag

  useEffect(() => {
    if (externalPrompts) {
      setPrompts(externalPrompts)
      return
    }

    const loadPrompts = async (forceRefresh = false) => {
      const data = await fetchPrompts(undefined, forceRefresh)
      setPrompts(data)
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

  const handleResetFilters = () => {
    setActiveTag(null)
    onClearFilters?.()
  }

  return (
    <section className={css.listSection}>
      <div className={css.listHeaderRow}>
        <h2 className={css.listHeading}>
          {isFiltering ? "Search Results" : "Recent & Favorites"}
        </h2>
        <span className={css.listCount}>{filteredPrompts.length}</span>
      </div>
      {availableTags.length > 0 && (
        <TagFilter
          tags={availableTags}
          selectedTag={activeTag}
          onSelectTag={setActiveTag}
        />
      )}
      {filteredPrompts.length > 0 ? (
        <ul className={css.listContainer}>
          {filteredPrompts.map((prompt, index) => (
            <PromptCard
              key={prompt._id ?? `${prompt.title}-${index}`}
              name={prompt.title}
              description={prompt.body}
              type={prompt.tags?.[0] ?? "other"}
              tags={prompt.tags}
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
