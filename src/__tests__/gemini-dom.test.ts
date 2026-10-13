import { describe, expect, it } from "vitest"

import {
  computeGeminiPopoverPosition,
  detectGeminiPageTheme,
  findGeminiInput,
  getOrCreateGeminiRootContainer,
  insertTextIntoGeminiInput,
  POPOVER_ESTIMATED_HEIGHT_PX,
  POPOVER_OFFSET_PX,
  PROMPTHUB_GEMINI_ROOT_ID
} from "../contents/gemini-dom"

describe("gemini-dom module", () => {
  describe("getOrCreateGeminiRootContainer", () => {
    it("creates container if missing and reuses existing one", () => {
      document.body.innerHTML = ""
      const created = getOrCreateGeminiRootContainer()
      expect(created.id).toBe(PROMPTHUB_GEMINI_ROOT_ID)
      expect(document.getElementById(PROMPTHUB_GEMINI_ROOT_ID)).toBe(created)

      const reused = getOrCreateGeminiRootContainer()
      expect(reused).toBe(created)
    })
  })

  describe("findGeminiInput", () => {
    it("returns null for non-elements or when target is inside excludeContainer", () => {
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
    })

    it("matches textarea elements", () => {
      const textarea = document.createElement("textarea")
      document.body.appendChild(textarea)

      expect(findGeminiInput(textarea)).toBe(textarea)
    })
  })

  describe("computeGeminiPopoverPosition", () => {
    it("places popover above input when there is sufficient room", () => {
      const pos = computeGeminiPopoverPosition({
        top: 600,
        bottom: 660,
        left: 200,
        right: 700,
        width: 500,
        height: 60,
        x: 200,
        y: 600,
        toJSON: () => ({})
      })

      expect(pos.top).toBe(600 - POPOVER_ESTIMATED_HEIGHT_PX - POPOVER_OFFSET_PX)
      expect(pos.left).toBe(200)
    })

    it("flips below input when near the top of the viewport", () => {
      const pos = computeGeminiPopoverPosition({
        top: 80,
        bottom: 140,
        left: 10,
        right: 400,
        width: 390,
        height: 60,
        x: 10,
        y: 80,
        toJSON: () => ({})
      })

      expect(pos.top).toBe(140 + POPOVER_OFFSET_PX)
      expect(pos.left).toBe(12)
    })
  })

  describe("insertTextIntoGeminiInput", () => {
    it("inserts into contenteditable with existing p tag and dispatches InputEvent", () => {
      const editor = document.createElement("div")
      editor.setAttribute("contenteditable", "true")
      const p = document.createElement("p")
      editor.appendChild(p)
      document.body.appendChild(editor)

      let dispatchedEvent: Event | null = null
      editor.addEventListener("input", (e) => {
        dispatchedEvent = e
      })

      insertTextIntoGeminiInput(editor, "Custom prompt text")

      expect(p.textContent).toBe("Custom prompt text")
      expect(dispatchedEvent).not.toBeNull()
      expect((dispatchedEvent as InputEvent).data).toBe("Custom prompt text")
    })

    it("inserts into contenteditable without child p tag", () => {
      const editor = document.createElement("div")
      editor.setAttribute("contenteditable", "true")
      document.body.appendChild(editor)

      insertTextIntoGeminiInput(editor, "Direct prompt")
      expect(editor.textContent).toBe("Direct prompt")
    })

    it("inserts into textarea and dispatches input and change events", () => {
      const textarea = document.createElement("textarea")
      document.body.appendChild(textarea)

      let inputFired = false
      let changeFired = false
      textarea.addEventListener("input", () => {
        inputFired = true
      })
      textarea.addEventListener("change", () => {
        changeFired = true
      })

      insertTextIntoGeminiInput(textarea, "Textarea prompt")

      expect(textarea.value).toBe("Textarea prompt")
      expect(inputFired).toBe(true)
      expect(changeFired).toBe(true)
    })
  })

  describe("detectGeminiPageTheme", () => {
    it("detects dark mode from document body class, data-theme attribute, or prefers-color-scheme", () => {
      document.body.className = "dark-theme"
      expect(detectGeminiPageTheme()).toBe("dark")

      document.body.className = ""
      document.documentElement.setAttribute("data-theme", "dark")
      expect(detectGeminiPageTheme()).toBe("dark")

      document.documentElement.removeAttribute("data-theme")
      document.documentElement.className = "dark"
      expect(detectGeminiPageTheme()).toBe("dark")

      document.documentElement.className = ""
      expect(detectGeminiPageTheme()).toBe("light")
    })
  })
})
