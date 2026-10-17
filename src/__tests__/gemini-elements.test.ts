import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import {
  detectGeminiPageTheme,
  findAllGeminiInputs,
  findGeminiInput,
  findGeminiInputContainer,
  findGeminiSendButton,
  GEMINI_CONTAINER_SELECTOR,
  GEMINI_INPUT_SELECTOR,
  GEMINI_INPUT_SELECTORS,
  getOrCreateGeminiRootContainer,
  isGeminiInputContainer,
  isGeminiInputElement,
  isGeminiRootContainer,
  isGeminiSendButton,
  TEMPLAGEM_GEMINI_ROOT_ID
} from "../contents/gemini-elements"

describe("gemini-elements module", () => {
  beforeEach(() => {
    document.body.innerHTML = ""
    document.body.className = ""
    document.documentElement.className = ""
    document.documentElement.removeAttribute("data-theme")
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe("Constants", () => {
    it("exports selectors and root id correctly", () => {
      expect(Array.isArray(GEMINI_INPUT_SELECTORS)).toBe(true)
      expect(GEMINI_INPUT_SELECTOR).toContain(".ql-editor")
      expect(GEMINI_CONTAINER_SELECTOR).toContain(".chat-input-container")
      expect(TEMPLAGEM_GEMINI_ROOT_ID).toBe("templagem-gemini-root")
    })
  })

  describe("getOrCreateGeminiRootContainer & isGeminiRootContainer", () => {
    it("creates container if missing and reuses existing one", () => {
      const created = getOrCreateGeminiRootContainer()
      expect(created.id).toBe(TEMPLAGEM_GEMINI_ROOT_ID)
      expect(document.getElementById(TEMPLAGEM_GEMINI_ROOT_ID)).toBe(created)
      expect(isGeminiRootContainer(created)).toBe(true)

      const reused = getOrCreateGeminiRootContainer()
      expect(reused).toBe(created)
    })

    it("isGeminiRootContainer returns false for non-matching elements or null", () => {
      expect(isGeminiRootContainer(null)).toBe(false)
      const other = document.createElement("div")
      expect(isGeminiRootContainer(other)).toBe(false)
    })
  })

  describe("findGeminiInput & findAllGeminiInputs & isGeminiInputElement", () => {
    it("returns null for non-elements or when target is inside excludeElement", () => {
      expect(findGeminiInput(null)).toBeNull()

      const popover = document.createElement("div")
      const childBtn = document.createElement("button")
      popover.appendChild(childBtn)
      document.body.appendChild(popover)

      expect(findGeminiInput(childBtn, popover)).toBeNull()
    })

    it("matches .ql-editor and rich-textarea inputs", () => {
      const editor = document.createElement("div")
      editor.className = "ql-editor"
      editor.setAttribute("contenteditable", "true")
      const p = document.createElement("p")
      editor.appendChild(p)
      document.body.appendChild(editor)

      expect(findGeminiInput(p)).toBe(editor)
      expect(isGeminiInputElement(editor)).toBe(true)
      expect(isGeminiInputElement(p)).toBe(true)
    })

    it("matches textarea elements", () => {
      const textarea = document.createElement("textarea")
      document.body.appendChild(textarea)

      expect(findGeminiInput(textarea)).toBe(textarea)
      expect(isGeminiInputElement(textarea)).toBe(true)
    })

    it("matches rich-textarea wrapper when clicked directly", () => {
      const rich = document.createElement("rich-textarea")
      const input = document.createElement("div")
      input.setAttribute("contenteditable", "true")
      rich.appendChild(input)
      document.body.appendChild(rich)

      expect(findGeminiInput(rich)).toBe(input)
    })

    it("findAllGeminiInputs finds all input elements in document or root", () => {
      expect(findAllGeminiInputs(null as unknown as ParentNode)).toEqual([])

      const container = document.createElement("div")
      const t1 = document.createElement("textarea")
      const t2 = document.createElement("textarea")
      container.appendChild(t1)
      container.appendChild(t2)
      document.body.appendChild(container)

      const all = findAllGeminiInputs(container)
      expect(all).toHaveLength(2)
      expect(all).toContain(t1)
      expect(all).toContain(t2)
    })

    it("isGeminiInputElement returns false for null or non-matching elements", () => {
      expect(isGeminiInputElement(null)).toBe(false)
      const nonInput = document.createElement("div")
      expect(isGeminiInputElement(nonInput)).toBe(false)
    })
  })

  describe("findGeminiInputContainer & isGeminiInputContainer", () => {
    it("returns null if input element is null", () => {
      expect(findGeminiInputContainer(null)).toBeNull()
    })

    it("finds outer chat-input-container ignoring body", () => {
      const outer = document.createElement("div")
      outer.className = "chat-input-container"
      const input = document.createElement("textarea")
      outer.appendChild(input)
      document.body.appendChild(outer)

      expect(findGeminiInputContainer(input)).toBe(outer)
      expect(isGeminiInputContainer(outer)).toBe(true)
    })

    it("finds ancestor rich-textarea or input-area container with parent width >= 320", () => {
      const parent = document.createElement("div")
      vi.spyOn(parent, "getBoundingClientRect").mockReturnValue({
        width: 450,
        height: 100,
        top: 0,
        left: 0,
        bottom: 100,
        right: 450,
        x: 0,
        y: 0,
        toJSON: () => {}
      })
      const rich = document.createElement("rich-textarea")
      parent.appendChild(rich)
      const input = document.createElement("div")
      input.setAttribute("contenteditable", "true")
      rich.appendChild(input)
      document.body.appendChild(parent)

      expect(findGeminiInputContainer(input)).toBe(parent)
      expect(isGeminiInputContainer(rich)).toBe(true)
    })

    it("falls back to rich-textarea when parent width is less than 320", () => {
      const parent = document.createElement("div")
      vi.spyOn(parent, "getBoundingClientRect").mockReturnValue({
        width: 250,
        height: 100,
        top: 0,
        left: 0,
        bottom: 100,
        right: 250,
        x: 0,
        y: 0,
        toJSON: () => {}
      })
      const rich = document.createElement("rich-textarea")
      parent.appendChild(rich)
      const input = document.createElement("div")
      input.setAttribute("contenteditable", "true")
      rich.appendChild(input)
      document.body.appendChild(parent)

      expect(findGeminiInputContainer(input)).toBe(rich)
    })

    it("falls back to input element if no special container exists", () => {
      const standalone = document.createElement("textarea")
      document.body.appendChild(standalone)
      expect(findGeminiInputContainer(standalone)).toBe(standalone)
    })

    it("isGeminiInputContainer returns false for null or non-container elements", () => {
      expect(isGeminiInputContainer(null)).toBe(false)
      const div = document.createElement("div")
      expect(isGeminiInputContainer(div)).toBe(false)
    })
  })

  describe("isGeminiSendButton & findGeminiSendButton", () => {
    it("returns false for null or non-elements", () => {
      expect(isGeminiSendButton(null)).toBe(false)
      const textNode = document.createTextNode("send")
      expect(isGeminiSendButton(textNode as unknown as EventTarget)).toBe(false)
    })

    it("ignores TemplaGem own buttons", () => {
      const root = getOrCreateGeminiRootContainer()
      const hubBtn = document.createElement("button")
      hubBtn.setAttribute("aria-label", "Send Prompt")
      root.appendChild(hubBtn)

      expect(isGeminiSendButton(hubBtn)).toBe(false)
    })

    it("excludes mic, voice, upload, file, and attach buttons", () => {
      const micBtn = document.createElement("button")
      micBtn.setAttribute("aria-label", "Microphone voice input")
      expect(isGeminiSendButton(micBtn)).toBe(false)

      const attachBtn = document.createElement("button")
      attachBtn.setAttribute("aria-label", "Attach file or upload")
      expect(isGeminiSendButton(attachBtn)).toBe(false)
    })

    it("identifies send buttons via aria-label, mattooltip, data-tooltip, title, data-testid, and class", () => {
      const ariaBtn = document.createElement("button")
      ariaBtn.setAttribute("aria-label", "Send message")
      expect(isGeminiSendButton(ariaBtn)).toBe(true)

      const ruBtn = document.createElement("button")
      ruBtn.setAttribute("aria-label", "Отправить")
      expect(isGeminiSendButton(ruBtn)).toBe(true)

      const matBtn = document.createElement("button")
      matBtn.setAttribute("mattooltip", "Send prompt")
      expect(isGeminiSendButton(matBtn)).toBe(true)

      const tipBtn = document.createElement("button")
      tipBtn.setAttribute("data-tooltip", "Отправить сообщение")
      expect(isGeminiSendButton(tipBtn)).toBe(true)

      const titleBtn = document.createElement("button")
      titleBtn.setAttribute("title", "Send prompt")
      expect(isGeminiSendButton(titleBtn)).toBe(true)

      const testBtn = document.createElement("button")
      testBtn.setAttribute("data-testid", "send-button")
      expect(isGeminiSendButton(testBtn)).toBe(true)

      const classBtn = document.createElement("button")
      classBtn.className = "send-button"
      expect(isGeminiSendButton(classBtn)).toBe(true)
    })

    it("detects send icon inside chat input area", () => {
      const container = document.createElement("div")
      container.className = "chat-input"
      const btn = document.createElement("button")
      btn.innerHTML = `<span class="google-material-icons">arrow_upward</span>`
      container.appendChild(btn)
      document.body.appendChild(container)

      expect(isGeminiSendButton(btn)).toBe(true)
    })

    it("findGeminiSendButton finds button inside container or returns null", () => {
      expect(findGeminiSendButton(null as unknown as ParentNode)).toBeNull()

      const emptyDiv = document.createElement("div")
      expect(findGeminiSendButton(emptyDiv)).toBeNull()

      const container = document.createElement("div")
      const btn = document.createElement("button")
      btn.setAttribute("aria-label", "Send")
      container.appendChild(btn)
      document.body.appendChild(container)

      expect(findGeminiSendButton(container)).toBe(btn)
    })
  })

  describe("detectGeminiPageTheme", () => {
    it("returns dark when body has dark-theme class", () => {
      document.body.classList.add("dark-theme")
      expect(detectGeminiPageTheme()).toBe("dark")
    })

    it("returns dark when html has data-theme dark", () => {
      document.documentElement.setAttribute("data-theme", "dark")
      expect(detectGeminiPageTheme()).toBe("dark")
    })

    it("returns dark when html has dark class", () => {
      document.documentElement.classList.add("dark")
      expect(detectGeminiPageTheme()).toBe("dark")
    })

    it("returns light by default when no dark markers exist", () => {
      expect(detectGeminiPageTheme()).toBe("light")
    })

    it("returns dark when matchMedia matches dark", () => {
      const original = window.matchMedia
      window.matchMedia = vi.fn().mockImplementation((query: string) => ({
        matches: query.includes("dark"),
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn()
      })) as unknown as typeof window.matchMedia

      expect(detectGeminiPageTheme()).toBe("dark")
      window.matchMedia = original
    })
  })
})
