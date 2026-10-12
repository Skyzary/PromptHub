import { useEffect, useState } from "react"

import {
  fetchPrompts,
  getCachedPrompts,
  subscribePromptsCache
} from "~src/prompts-api"
import type { IPrompt } from "~src/types"

import PromptCard from "../PromptCard/PromptCard"
import css from "./ListSection.module.scss"

interface ListSectionProps {
  prompts?: IPrompt[]
}

export default function ListSection({
  prompts: externalPrompts
}: ListSectionProps) {
  const [prompts, setPrompts] = useState<IPrompt[]>(
    () => externalPrompts ?? getCachedPrompts() ?? []
  )

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

  return (
    <section className={css.listSection}>
      <h2 className={css.listHeading}>Recent & Favorites</h2>
      <ul className={css.listContainer}>
        {prompts.map((prompt, index) => (
          <PromptCard
            key={prompt._id ?? `${prompt.title}-${index}`}
            name={prompt.title}
            description={prompt.body}
            type={prompt.tags?.[0] ?? "other"}
          />
        ))}
      </ul>
    </section>
  )
}
