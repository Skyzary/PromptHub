import React from "react"

import { types } from "~src/components/ui/iconRender/iconStore"
import css from "~src/components/ui/iconRender/iconStore.module.scss"
import {
  getPromptIconDescriptor,
  PROMPT_ICONS_BY_ID
} from "~src/utils/prompt-icons"

const TYPE_ALIASES: Record<string, string> = {
  // Development
  development: "development",
  dev: "development",
  code: "development",
  coding: "development",
  programming: "development",
  tech: "development",
  typescript: "development",
  javascript: "development",
  python: "development",
  frontend: "development",
  backend: "development",

  // Daily
  daily: "daily",
  routine: "daily",
  day: "daily",
  work: "daily",
  task: "daily",
  todo: "daily",
  planning: "daily",
  schedule: "daily",

  // Education
  education: "education",
  study: "education",
  school: "education",
  learn: "education",
  learning: "education",
  reading: "education",

  // Entertainment
  entertainment: "entertainment",
  fun: "entertainment",
  movie: "entertainment",
  game: "entertainment",
  gaming: "entertainment",
  music: "entertainment",
  creative: "entertainment",

  // Other / default
  other: "other",
  default: "other",
  general: "other",
  ai: "other"
}

export function resolvePromptIconType(type?: string, tags?: string[]): string {
  // If tags provided, find the first tag that resolves to a known category
  if (Array.isArray(tags) && tags.length > 0) {
    for (const tag of tags) {
      if (!tag || typeof tag !== "string") continue
      const cleaned = tag.trim().toLowerCase()
      const match = TYPE_ALIASES[cleaned]
      if (match && match !== "other") {
        return match
      }
    }
  }

  if (type && typeof type === "string") {
    const cleaned = type.trim().toLowerCase()
    if (TYPE_ALIASES[cleaned]) {
      return TYPE_ALIASES[cleaned]
    }
    if (types[cleaned]) {
      return cleaned
    }
  }

  // Fallback to first tag's mapping or "other"
  if (Array.isArray(tags) && tags.length > 0) {
    const firstCleaned = tags[0]?.trim().toLowerCase()
    return TYPE_ALIASES[firstCleaned] ?? "other"
  }

  return "other"
}

export interface PromptIconProps {
  icon?: string
  type?: string
  tags?: string[]
  className?: string
  size?: number | string
}

export default function PromptIcon({
  icon,
  type,
  tags,
  className,
  size = "20px"
}: PromptIconProps) {
  // 1. Direct Lucide icon check
  const candidateId =
    icon ??
    (type && PROMPT_ICONS_BY_ID.has(type.toLowerCase()) ? type : undefined) ??
    (tags
      ? tags.find((t) => t.startsWith("icon:"))?.slice(5) ??
        tags.find((t) => PROMPT_ICONS_BY_ID.has(t.toLowerCase()))
      : undefined)

  const descriptor = getPromptIconDescriptor(candidateId)

  if (descriptor) {
    const IconComponent = descriptor.icon
    const colorClass = css[`color_${descriptor.color}`] ?? css.color_blue

    const content = (
      <div
        className={`${css.iconWrapper} ${colorClass}`}
        data-testid={`prompt-icon-${descriptor.id}`}>
        <IconComponent
          className={css.icon}
          size={size}
          aria-hidden={true}
        />
      </div>
    )

    if (className) {
      return <div className={className}>{content}</div>
    }
    return content
  }

  // 2. Legacy fallback via types / categories
  const resolvedType = resolvePromptIconType(type, tags)
  const iconRender = types[resolvedType] || types.other

  if (className) {
    return <div className={className}>{iconRender()}</div>
  }

  return iconRender()
}
