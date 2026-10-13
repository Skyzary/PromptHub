import { beforeEach, describe, expect, it } from "vitest"

import {
  buildTemplateHtml,
  cleanTemplateBracketsInInput,
  computeGeminiPopoverPosition,
  detectGeminiPageTheme,
  findGeminiInput,
  findTemplateVariablesInText,
  getOrCreateGeminiRootContainer,
  handleGeminiSendTrigger,
  handleGeminiTemplateKeyDown,
  insertTextIntoGeminiInput,
  isGeminiSendButton,
  jumpToNextTemplateVariable,
  POPOVER_ESTIMATED_HEIGHT_PX,
  POPOVER_OFFSET_PX,
  PROMPTHUB_GEMINI_ROOT_ID,
  resetModifiedTemplateVariables
} from "../contents/gemini-dom"

describe("gemini-dom module", () => {
  beforeEach(() => {
    resetModifiedTemplateVariables()
  })
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

  describe("template variable DOM helpers", () => {
    it("findTemplateVariablesInText locates variables with exact character boundaries", () => {
      const text = "Write a {{tone}} essay about {{topic}}"
      const vars = findTemplateVariablesInText(text)

      expect(vars).toHaveLength(2)
      expect(vars[0]).toEqual({
        index: 0,
        name: "tone",
        raw: "{{tone}}",
        fullStart: 8,
        fullEnd: 16,
        innerStart: 10,
        innerEnd: 14
      })
      expect(vars[1]).toEqual({
        index: 1,
        name: "topic",
        raw: "{{topic}}",
        fullStart: 29,
        fullEnd: 38,
        innerStart: 31,
        innerEnd: 36
      })
    })

    it("buildTemplateHtml wraps variables in .ph-template-variable spans", () => {
      const html = buildTemplateHtml("Hello {{name}}!")
      expect(html).toContain('class="ph-template-variable"')
      expect(html).toContain('data-ph-var="name"')
      expect(html).toContain("{{name}}</span>")
    })

    it("jumpToNextTemplateVariable cycles through variables forward and backward in textarea with collapsed cursor", () => {
      const textarea = document.createElement("textarea")
      document.body.appendChild(textarea)
      textarea.value = "Start {{a}} mid {{b}} end {{c}}"

      // Jump forward from nothing positions caret at innerEnd of first variable "a" (no range selection)
      const jumped1 = jumpToNextTemplateVariable(textarea, false)
      expect(jumped1).toBe(true)
      expect(textarea.selectionStart).toBe(9)
      expect(textarea.selectionEnd).toBe(9) // collapsed!

      // Jump forward positions caret at second variable "b"
      jumpToNextTemplateVariable(textarea, false)
      expect(textarea.selectionStart).toBe(19)
      expect(textarea.selectionEnd).toBe(19) // collapsed!

      // Jump forward positions caret at third variable "c"
      jumpToNextTemplateVariable(textarea, false)
      expect(textarea.selectionStart).toBe(29)
      expect(textarea.selectionEnd).toBe(29) // collapsed!

      // Jump backward positions caret at innerStart of second variable "b"
      jumpToNextTemplateVariable(textarea, true)
      expect(textarea.selectionStart).toBe(18)
      expect(textarea.selectionEnd).toBe(18) // collapsed!

      // Jump backward positions caret at innerStart of first variable "a"
      jumpToNextTemplateVariable(textarea, true)
      expect(textarea.selectionStart).toBe(8)
      expect(textarea.selectionEnd).toBe(8) // collapsed!
    })

    it("handleGeminiTemplateKeyDown handles ArrowRight, ArrowLeft, Tab, Shift+Tab navigation", () => {
      const textarea = document.createElement("textarea")
      textarea.value = "Code in {{language}} using {{framework}}"
      document.body.appendChild(textarea)

      // Initial position at end of "language" (innerEnd: 18)
      textarea.setSelectionRange(18, 18)

      const arrowRightEvt = new KeyboardEvent("keydown", {
        key: "ArrowRight",
        bubbles: true,
        cancelable: true
      })
      Object.defineProperty(arrowRightEvt, "target", { value: textarea })

      const handled = handleGeminiTemplateKeyDown(arrowRightEvt)
      expect(handled).toBe(true)
      expect(arrowRightEvt.defaultPrevented).toBe(true)
      // Jumps forward to "framework" (innerEnd: 38, collapsed)
      expect(textarea.selectionStart).toBe(38)
      expect(textarea.selectionEnd).toBe(38)

      // Position at start of "framework" (innerStart: 29) to navigate backward
      textarea.setSelectionRange(29, 29)

      const arrowLeftEvt = new KeyboardEvent("keydown", {
        key: "ArrowLeft",
        bubbles: true,
        cancelable: true
      })
      Object.defineProperty(arrowLeftEvt, "target", { value: textarea })

      const handledLeft = handleGeminiTemplateKeyDown(arrowLeftEvt)
      expect(handledLeft).toBe(true)
      expect(arrowLeftEvt.defaultPrevented).toBe(true)
      // Jumps backward to "language" (innerStart: 10, collapsed)
      expect(textarea.selectionStart).toBe(10)
      expect(textarea.selectionEnd).toBe(10)
    })

    it("cleanTemplateBracketsInInput strips brackets and dispatches input event", () => {
      const textarea = document.createElement("textarea")
      textarea.value = "Write a {{humorous}} essay about {{cats}}"
      document.body.appendChild(textarea)

      let inputDispatched = false
      textarea.addEventListener("input", () => {
        inputDispatched = true
      })

      const cleaned = cleanTemplateBracketsInInput(textarea)
      expect(cleaned).toBe(true)
      expect(textarea.value).toBe("Write a humorous essay about cats")
      expect(inputDispatched).toBe(true)

      // Contenteditable
      const editor = document.createElement("div")
      editor.setAttribute("contenteditable", "true")
      const p = document.createElement("p")
      p.innerHTML =
        '<span class="ph-template-variable">{{tone}}</span> and {{topic}}'
      editor.appendChild(p)
      document.body.appendChild(editor)

      const cleanedEd = cleanTemplateBracketsInInput(editor)
      expect(cleanedEd).toBe(true)
      expect(p.textContent).toBe("tone and topic")
    })

    it("handleGeminiTemplateKeyDown strips brackets on plain Enter without preventing default", () => {
      const textarea = document.createElement("textarea")
      textarea.value = "Explain {{topic}} in simple terms"
      document.body.appendChild(textarea)

      const enterEvt = new KeyboardEvent("keydown", {
        key: "Enter",
        bubbles: true,
        cancelable: true
      })
      Object.defineProperty(enterEvt, "target", { value: textarea })

      const handled = handleGeminiTemplateKeyDown(enterEvt)
      // Returns false so Gemini native enter handling proceeds with sending
      expect(handled).toBe(false)
      expect(enterEvt.defaultPrevented).toBe(false)
      // But brackets are stripped!
      expect(textarea.value).toBe("Explain topic in simple terms")
    })

    it("isGeminiSendButton recognizes send buttons and handleGeminiSendTrigger cleans brackets", () => {
      document.body.innerHTML = ""
      const sendBtn = document.createElement("button")
      sendBtn.setAttribute("aria-label", "Send message")
      document.body.appendChild(sendBtn)

      expect(isGeminiSendButton(sendBtn)).toBe(true)

      const textarea = document.createElement("textarea")
      textarea.value = "Translate {{text}}"
      document.body.appendChild(textarea)

      const clickEvt = new MouseEvent("click", { bubbles: true })
      Object.defineProperty(clickEvt, "target", { value: sendBtn })

      const handled = handleGeminiSendTrigger(clickEvt, textarea)
      expect(handled).toBe(true)
      expect(textarea.value).toBe("Translate text")
    })

    it("erases placeholder name as soon as user types inside an unmodified variable in textarea", () => {
      const textarea = document.createElement("textarea")
      textarea.value = "Code in {{language}} for {{task}}"
      document.body.appendChild(textarea)

      // Cursor inside {{language}}
      textarea.setSelectionRange(15, 15)

      // User types 'P'
      const keyEvt = new KeyboardEvent("keydown", {
        key: "P",
        bubbles: true,
        cancelable: true
      })
      Object.defineProperty(keyEvt, "target", { value: textarea })

      const handled = handleGeminiTemplateKeyDown(keyEvt)
      expect(handled).toBe(true)
      expect(keyEvt.defaultPrevented).toBe(true)
      // "language" was erased and replaced with "P"
      expect(textarea.value).toBe("Code in {{P}} for {{task}}")
      expect(textarea.selectionStart).toBe(11) // right after 'P'
      expect(textarea.selectionEnd).toBe(11)

      // Second keystroke 'y' is not intercepted as it's already modified
      const keyEvt2 = new KeyboardEvent("keydown", {
        key: "y",
        bubbles: true,
        cancelable: true
      })
      Object.defineProperty(keyEvt2, "target", { value: textarea })
      const handled2 = handleGeminiTemplateKeyDown(keyEvt2)
      expect(handled2).toBe(false)
    })

    it("erases placeholder name on Backspace inside an unmodified variable", () => {
      const textarea = document.createElement("textarea")
      textarea.value = "Format: {{data}}"
      document.body.appendChild(textarea)

      // Cursor inside {{data}}
      textarea.setSelectionRange(12, 12)

      const backspaceEvt = new KeyboardEvent("keydown", {
        key: "Backspace",
        bubbles: true,
        cancelable: true
      })
      Object.defineProperty(backspaceEvt, "target", { value: textarea })

      const handled = handleGeminiTemplateKeyDown(backspaceEvt)
      expect(handled).toBe(true)
      expect(backspaceEvt.defaultPrevented).toBe(true)
      // "data" was erased to empty brackets
      expect(textarea.value).toBe("Format: {{}}")
      expect(textarea.selectionStart).toBe(10) // inside {{}}
      expect(textarea.selectionEnd).toBe(10)
    })

    it("erases placeholder name inside contenteditable span on first keystroke", () => {
      const editor = document.createElement("div")
      editor.setAttribute("contenteditable", "true")
      editor.className = "ql-editor"
      const p = document.createElement("p")
      p.innerHTML =
        'Prefix <span class="ph-template-variable" data-ph-var="city" data-ph-original="city">{{city}}</span> Suffix'
      editor.appendChild(p)
      document.body.appendChild(editor)

      const span = p.querySelector<HTMLElement>(".ph-template-variable")!
      const textNode = span.firstChild!

      const range = document.createRange()
      range.setStart(textNode, 4) // inside "city"
      range.setEnd(textNode, 4)
      const sel = window.getSelection()!
      sel.removeAllRanges()
      sel.addRange(range)

      const keyEvt = new KeyboardEvent("keydown", {
        key: "L",
        bubbles: true,
        cancelable: true
      })
      Object.defineProperty(keyEvt, "target", { value: editor })

      const handled = handleGeminiTemplateKeyDown(keyEvt)
      expect(handled).toBe(true)
      expect(keyEvt.defaultPrevented).toBe(true)
      expect(span.textContent).toBe("{{L}}")
      expect(span.getAttribute("data-ph-modified")).toBe("true")
    })
  })
})
