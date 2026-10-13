export const TEMPLATE_VARIABLE_REGEX = /\{\{\s*([^}]+?)\s*\}\}/g

export interface TemplateSegment {
  type: "text" | "variable"
  value: string
  raw: string
  index: number
  variableIndex?: number
}

/**
 * Checks if the given text contains any {{something}} template variables.
 */
export function hasTemplateVariables(text: string): boolean {
  if (!text) {
    return false
  }
  const regex = new RegExp(TEMPLATE_VARIABLE_REGEX.source, "g")
  return regex.test(text)
}

/**
 * Extracts a list of unique variable names from the text in order of appearance.
 */
export function extractTemplateVariables(text: string): string[] {
  if (!text) {
    return []
  }
  const regex = new RegExp(TEMPLATE_VARIABLE_REGEX.source, "g")
  const variables: string[] = []
  const seen = new Set<string>()

  let match: RegExpExecArray | null
  while ((match = regex.exec(text)) !== null) {
    const varName = (match[1] ?? "").trim()
    if (varName && !seen.has(varName)) {
      seen.add(varName)
      variables.push(varName)
    }
  }

  return variables
}

/**
 * Parses text into ordered segments of plain text and template variables.
 * Each variable segment receives a `variableIndex` for sequential navigation.
 */
export function parseTemplateSegments(text: string): TemplateSegment[] {
  if (!text) {
    return []
  }

  const uniqueVars = extractTemplateVariables(text)
  const segments: TemplateSegment[] = []
  const regex = new RegExp(TEMPLATE_VARIABLE_REGEX.source, "g")
  let lastIndex = 0
  let segmentIndex = 0

  let match: RegExpExecArray | null
  while ((match = regex.exec(text)) !== null) {
    const matchStart = match.index
    const matchEnd = regex.lastIndex

    if (matchStart > lastIndex) {
      const textSlice = text.slice(lastIndex, matchStart)
      segments.push({
        type: "text",
        value: textSlice,
        raw: textSlice,
        index: segmentIndex++
      })
    }

    const varName = (match[1] ?? "").trim()
    const varIdx = uniqueVars.indexOf(varName)
    segments.push({
      type: "variable",
      value: varName,
      raw: match[0],
      index: segmentIndex++,
      variableIndex: varIdx >= 0 ? varIdx : 0
    })

    lastIndex = matchEnd
  }

  if (lastIndex < text.length) {
    const trailingText = text.slice(lastIndex)
    segments.push({
      type: "text",
      value: trailingText,
      raw: trailingText,
      index: segmentIndex
    })
  }

  return segments
}

/**
 * Replaces all {{variable}} expressions in `text` with provided values.
 * If a variable is not provided or empty, falls back to the variable name itself.
 */
export function fillTemplate(
  text: string,
  values: Record<string, string>
): string {
  if (!text) {
    return ""
  }
  const regex = new RegExp(TEMPLATE_VARIABLE_REGEX.source, "g")
  return text.replace(regex, (_match, group1: string) => {
    const key = group1.trim()
    const val = values[key]
    return typeof val === "string" && val.length > 0 ? val : key
  })
}

/**
 * Strips {{ and }} bracket wrappers, leaving only the inner content.
 */
export function stripTemplateBrackets(text: string): string {
  if (!text) {
    return ""
  }
  const regex = new RegExp(TEMPLATE_VARIABLE_REGEX.source, "g")
  const stripped = text.replace(regex, (_match, group1: string) =>
    group1.trim()
  )
  return stripped.replace(/\{\{|\}\}/g, "")
}
