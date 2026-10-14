import { useEffect, useMemo, useRef, useState } from "react"

import type { IPrompt } from "../../types"

export function useGeminiPromptFilters(prompts: IPrompt[], isOpen: boolean) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedTag, setSelectedTag] = useState<string | null>(null)
  const [selectedIndex, setSelectedIndex] = useState<number>(0)
  const selectedIndexRef = useRef<number>(selectedIndex)
  selectedIndexRef.current = selectedIndex

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

  const filteredPrompts = useMemo(() => {
    const tokens = searchQuery.trim().toLowerCase().split(/\s+/).filter(Boolean)

    return prompts.filter((prompt) => {
      if (selectedTag) {
        const hasTag = (prompt.tags ?? []).some(
          (t) => t.toLowerCase() === selectedTag.toLowerCase()
        )
        if (!hasTag) return false
      }

      if (tokens.length === 0) {
        return true
      }

      const titleLower = prompt.title.toLowerCase()
      const bodyLower = prompt.body.toLowerCase()
      const tagsLower = (prompt.tags ?? []).map((t) => t.toLowerCase())

      return tokens.every((token) => {
        if (token.startsWith("#") && token.length > 1) {
          const tagQuery = token.slice(1)
          return tagsLower.some((tag) => tag.includes(tagQuery))
        }

        return (
          titleLower.includes(token) ||
          bodyLower.includes(token) ||
          tagsLower.some((tag) => tag.includes(token))
        )
      })
    })
  }, [prompts, searchQuery, selectedTag])

  const filteredPromptsRef = useRef(filteredPrompts)
  filteredPromptsRef.current = filteredPrompts

  useEffect(() => {
    setSelectedIndex(0)
    selectedIndexRef.current = 0
  }, [searchQuery])

  useEffect(() => {
    setSelectedIndex(0)
    selectedIndexRef.current = 0
  }, [selectedTag])

  useEffect(() => {
    if (isOpen) {
      setSelectedIndex(0)
      selectedIndexRef.current = 0
      setSelectedTag(null)
    }
  }, [isOpen])

  return {
    searchQuery,
    setSearchQuery,
    selectedTag,
    setSelectedTag,
    selectedIndex,
    setSelectedIndex,
    selectedIndexRef,
    availableTags,
    filteredPrompts,
    filteredPromptsRef
  }
}
