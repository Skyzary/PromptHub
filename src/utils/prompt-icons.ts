import type { IconType } from "react-icons"
import {
  LuBookOpen,
  LuBot,
  LuBrain,
  LuBriefcase,
  LuCalendar,
  LuCamera,
  LuChartBar,
  LuClock,
  LuCode,
  LuCoffee,
  LuCompass,
  LuCpu,
  LuDatabase,
  LuFileText,
  LuFilm,
  LuFlame,
  LuFolder,
  LuGamepad2,
  LuGlobe,
  LuGraduationCap,
  LuHeadphones,
  LuHeart,
  LuImage,
  LuLanguages,
  LuLayers,
  LuLightbulb,
  LuMessageSquare,
  LuMusic,
  LuPenTool,
  LuQuote,
  LuRocket,
  LuShield,
  LuSmile,
  LuSparkles,
  LuSquareCheck,
  LuStar,
  LuSun,
  LuTarget,
  LuTerminal,
  LuZap
} from "react-icons/lu"

import type { IPrompt } from "../types"

export type IconColor = "blue" | "purple" | "green" | "amber" | "red" | "gray"

export interface PromptIconDescriptor {
  id: string
  name: string
  category: string
  color: IconColor
  icon: IconType
}

export const PROMPT_ICON_CATEGORIES = [
  "All",
  "AI & Tech",
  "Writing & Learning",
  "Productivity",
  "Media & Fun",
  "General"
] as const

export type PromptIconCategory = (typeof PROMPT_ICON_CATEGORIES)[number]

export const PROMPT_ICONS: PromptIconDescriptor[] = [
  // AI & Tech
  {
    id: "sparkles",
    name: "Sparkles",
    category: "AI & Tech",
    color: "blue",
    icon: LuSparkles
  },
  {
    id: "bot",
    name: "AI Robot",
    category: "AI & Tech",
    color: "blue",
    icon: LuBot
  },
  {
    id: "brain",
    name: "Brain / Logic",
    category: "AI & Tech",
    color: "purple",
    icon: LuBrain
  },
  {
    id: "code",
    name: "Code",
    category: "AI & Tech",
    color: "blue",
    icon: LuCode
  },
  {
    id: "terminal",
    name: "Terminal",
    category: "AI & Tech",
    color: "blue",
    icon: LuTerminal
  },
  {
    id: "cpu",
    name: "Processor",
    category: "AI & Tech",
    color: "blue",
    icon: LuCpu
  },
  {
    id: "database",
    name: "Database",
    category: "AI & Tech",
    color: "blue",
    icon: LuDatabase
  },
  {
    id: "zap",
    name: "Fast / Zap",
    category: "AI & Tech",
    color: "amber",
    icon: LuZap
  },
  {
    id: "rocket",
    name: "Rocket",
    category: "AI & Tech",
    color: "red",
    icon: LuRocket
  },
  {
    id: "lightbulb",
    name: "Idea",
    category: "AI & Tech",
    color: "amber",
    icon: LuLightbulb
  },

  // Writing & Learning
  {
    id: "pen",
    name: "Writing",
    category: "Writing & Learning",
    color: "purple",
    icon: LuPenTool
  },
  {
    id: "file",
    name: "Document",
    category: "Writing & Learning",
    color: "purple",
    icon: LuFileText
  },
  {
    id: "book",
    name: "Book",
    category: "Writing & Learning",
    color: "purple",
    icon: LuBookOpen
  },
  {
    id: "languages",
    name: "Translation",
    category: "Writing & Learning",
    color: "blue",
    icon: LuLanguages
  },
  {
    id: "graduation",
    name: "Education",
    category: "Writing & Learning",
    color: "green",
    icon: LuGraduationCap
  },
  {
    id: "quote",
    name: "Quotes",
    category: "Writing & Learning",
    color: "purple",
    icon: LuQuote
  },

  // Productivity
  {
    id: "briefcase",
    name: "Work",
    category: "Productivity",
    color: "green",
    icon: LuBriefcase
  },
  {
    id: "calendar",
    name: "Calendar",
    category: "Productivity",
    color: "green",
    icon: LuCalendar
  },
  {
    id: "check",
    name: "Tasks",
    category: "Productivity",
    color: "green",
    icon: LuSquareCheck
  },
  {
    id: "clock",
    name: "Timer",
    category: "Productivity",
    color: "green",
    icon: LuClock
  },
  {
    id: "chart",
    name: "Analytics",
    category: "Productivity",
    color: "green",
    icon: LuChartBar
  },
  {
    id: "target",
    name: "Goals",
    category: "Productivity",
    color: "red",
    icon: LuTarget
  },
  {
    id: "folder",
    name: "Projects",
    category: "Productivity",
    color: "amber",
    icon: LuFolder
  },
  {
    id: "layers",
    name: "Architecture",
    category: "Productivity",
    color: "blue",
    icon: LuLayers
  },

  // Media & Fun
  {
    id: "music",
    name: "Music",
    category: "Media & Fun",
    color: "amber",
    icon: LuMusic
  },
  {
    id: "film",
    name: "Video",
    category: "Media & Fun",
    color: "amber",
    icon: LuFilm
  },
  {
    id: "gamepad",
    name: "Gaming",
    category: "Media & Fun",
    color: "amber",
    icon: LuGamepad2
  },
  {
    id: "image",
    name: "Image / Art",
    category: "Media & Fun",
    color: "amber",
    icon: LuImage
  },
  {
    id: "camera",
    name: "Photography",
    category: "Media & Fun",
    color: "amber",
    icon: LuCamera
  },
  {
    id: "headphones",
    name: "Audio",
    category: "Media & Fun",
    color: "amber",
    icon: LuHeadphones
  },

  // General
  {
    id: "message",
    name: "Chat",
    category: "General",
    color: "blue",
    icon: LuMessageSquare
  },
  {
    id: "coffee",
    name: "Daily Routine",
    category: "General",
    color: "gray",
    icon: LuCoffee
  },
  {
    id: "heart",
    name: "Health & Care",
    category: "General",
    color: "red",
    icon: LuHeart
  },
  {
    id: "smile",
    name: "Lifestyle",
    category: "General",
    color: "amber",
    icon: LuSmile
  },
  {
    id: "sun",
    name: "Daylight",
    category: "General",
    color: "amber",
    icon: LuSun
  },
  {
    id: "star",
    name: "Favorite",
    category: "General",
    color: "amber",
    icon: LuStar
  },
  {
    id: "flame",
    name: "Trending",
    category: "General",
    color: "red",
    icon: LuFlame
  },
  {
    id: "shield",
    name: "Security",
    category: "General",
    color: "green",
    icon: LuShield
  },
  {
    id: "compass",
    name: "Discovery",
    category: "General",
    color: "blue",
    icon: LuCompass
  },
  {
    id: "globe",
    name: "Web / Global",
    category: "General",
    color: "blue",
    icon: LuGlobe
  }
]

export const PROMPT_ICONS_BY_ID = new Map<string, PromptIconDescriptor>(
  PROMPT_ICONS.map((descriptor) => [descriptor.id.toLowerCase(), descriptor])
)

export const DEFAULT_PROMPT_ICON_ID = "sparkles"

export function getPromptIconDescriptor(
  iconId?: string | null
): PromptIconDescriptor | undefined {
  if (!iconId || typeof iconId !== "string") {
    return undefined
  }
  return PROMPT_ICONS_BY_ID.get(iconId.trim().toLowerCase())
}

// ----------------------------------------------------
// Storage & In-Memory Mapping for Prompt Icons
// ----------------------------------------------------
export const PROMPT_ICONS_STORAGE_KEY = "templagem_prompt_icons"

let inMemoryIconMap: Record<string, string> | null = null
const iconChangeListeners = new Set<() => void>()

export function getStoredPromptIcons(): Record<string, string> {
  if (inMemoryIconMap !== null) {
    return inMemoryIconMap
  }

  if (typeof window !== "undefined" && window.localStorage) {
    const raw = window.localStorage.getItem(PROMPT_ICONS_STORAGE_KEY)
    if (raw) {
      try {
        inMemoryIconMap = JSON.parse(raw) as Record<string, string>
        return inMemoryIconMap
      } catch {
        window.localStorage.removeItem(PROMPT_ICONS_STORAGE_KEY)
      }
    }
  }

  inMemoryIconMap = {}
  return inMemoryIconMap
}

export function subscribePromptIcons(listener: () => void): () => void {
  iconChangeListeners.add(listener)
  return () => {
    iconChangeListeners.delete(listener)
  }
}

export async function setPromptIcon(
  promptId: string,
  iconId: string
): Promise<void> {
  const map = { ...getStoredPromptIcons(), [promptId]: iconId }
  inMemoryIconMap = map

  if (typeof window !== "undefined" && window.localStorage) {
    window.localStorage.setItem(PROMPT_ICONS_STORAGE_KEY, JSON.stringify(map))
  }

  if (typeof chrome !== "undefined" && chrome.storage?.local) {
    await chrome.storage.local.set({ [PROMPT_ICONS_STORAGE_KEY]: map })
  }

  iconChangeListeners.forEach((fn) => fn())
}

export function resolvePromptIcon(prompt?: Partial<IPrompt> | null): string {
  if (!prompt) {
    return DEFAULT_PROMPT_ICON_ID
  }

  // 1. Direct prompt.icon property
  if (prompt.icon && PROMPT_ICONS_BY_ID.has(prompt.icon.toLowerCase())) {
    return prompt.icon.toLowerCase()
  }

  // 2. Storage lookup by prompt ID
  const promptId =
    prompt._id ??
    (prompt as { id?: string; promptId?: string }).id ??
    (prompt as { id?: string; promptId?: string }).promptId
  if (promptId) {
    const stored = getStoredPromptIcons()[promptId]
    if (stored && PROMPT_ICONS_BY_ID.has(stored.toLowerCase())) {
      return stored.toLowerCase()
    }
  }

  // 3. Storage lookup by prompt title
  if (prompt.title) {
    const storedByTitle = getStoredPromptIcons()[prompt.title]
    if (storedByTitle && PROMPT_ICONS_BY_ID.has(storedByTitle.toLowerCase())) {
      return storedByTitle.toLowerCase()
    }
  }

  // 4. Tags lookup: e.g. "icon:rocket" or directly "rocket", "code"
  if (Array.isArray(prompt.tags) && prompt.tags.length > 0) {
    for (const tag of prompt.tags) {
      if (!tag || typeof tag !== "string") continue
      const cleaned = tag.trim().toLowerCase()
      if (cleaned.startsWith("icon:")) {
        const candidate = cleaned.slice(5).trim()
        if (PROMPT_ICONS_BY_ID.has(candidate)) {
          return candidate
        }
      }
      if (PROMPT_ICONS_BY_ID.has(cleaned)) {
        return cleaned
      }
    }
  }

  return DEFAULT_PROMPT_ICON_ID
}
