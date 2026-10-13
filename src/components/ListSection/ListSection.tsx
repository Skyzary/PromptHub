import { useEffect, useState } from "react"

import {
  fetchPrompts,
  getCachedPrompts,
  subscribePromptsCache
} from "~src/prompts-api"
import type { IPrompt } from "~src/types"

import PromptCard from "../PromptCard/PromptCard"
import PromptDetailsModal from "../PromptDetailsModal/PromptDetailsModal"
import css from "./ListSection.module.scss"

interface ListSectionProps {
  prompts?: IPrompt[]
  searchQuery?: string
  onClearFilters?: () => void
}

export default function ListSection({
  prompts: externalPrompts,
  searchQuery = "",
  onClearFilters
}: ListSectionProps) {
  const [prompts, setPrompts] = useState<IPrompt[]>(
    () => externalPrompts ?? getCachedPrompts() ?? []
  )
  const [selectedPrompt, setSelectedPrompt] = useState<IPrompt | null>(null)

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
  const isFiltering = queryTokens.length > 0

  const filteredPrompts = isFiltering
    ? prompts.filter((prompt) => {
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

  return (
    <section className={css.listSection}>
      <div className={css.listHeaderRow}>
        <h2 className={css.listHeading}>
          {isFiltering ? "Search Results" : "Recent & Favorites"}
        </h2>
        <span className={css.listCount}>{filteredPrompts.length}</span>
      </div>
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
          {isFiltering && onClearFilters && (
            <button
              type="button"
              className={css.resetFilterBtn}
              onClick={onClearFilters}>
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
