import {
  DEFAULT_MOCK_PROMPTS,
  expect,
  makeJwt,
  seedStorage,
  test
} from "./fixtures"

test.describe("Gemini Page Content Script Integration (E2E)", () => {
  test("mounts Shadow DOM root, opens overlay on editor focus, and displays prompts", async ({
    context,
    geminiPage
  }) => {
    // Seed authenticated state and prompts
    await seedStorage(context, {
      token: makeJwt(3600),
      prompts: DEFAULT_MOCK_PROMPTS
    })

    // Focus the Gemini input editor
    const editor = geminiPage
      .locator(".ql-editor, rich-textarea, div[contenteditable='true']")
      .first()
    await expect(editor).toBeVisible()

    // Focus the input to trigger PromptHub overlay
    await editor.click()

    // Locate PromptHub root inside the page
    const rootContainer = geminiPage.locator("#prompthub-gemini-root")
    await expect(rootContainer).toBeAttached({ timeout: 10000 })

    // Verify shadow root contains overlay dialog (Playwright automatically pierces shadow roots)
    const overlayDialog = geminiPage.getByRole("dialog", {
      name: "PromptHub Gemini Prompts"
    })
    await expect(overlayDialog).toBeVisible({ timeout: 10000 })

    // Check that prompt items are displayed inside shadow DOM
    await expect(geminiPage.getByText("Code Review Assistant")).toBeVisible()
  })

  test("inserts prompt template, highlights variables, and supports Tab navigation", async ({
    context,
    geminiPage
  }) => {
    await seedStorage(context, {
      token: makeJwt(3600),
      prompts: DEFAULT_MOCK_PROMPTS
    })

    const editor = geminiPage.locator(".ql-editor").first()
    await expect(editor).toBeVisible()
    await editor.click()

    // Wait for overlay to appear
    const overlayDialog = geminiPage.getByRole("dialog", {
      name: "PromptHub Gemini Prompts"
    })
    await expect(overlayDialog).toBeVisible({ timeout: 10000 })

    // Wait for prompt items to be loaded and click first prompt
    const promptItem = geminiPage.getByText("Code Review Assistant")
    await expect(promptItem).toBeVisible({ timeout: 10000 })
    await promptItem.click()

    // Overlay closes
    await expect(overlayDialog).not.toBeVisible()

    // Verify template text inserted and variables highlighted
    await geminiPage.waitForFunction(() => {
      const el = document.querySelector(".ql-editor")
      const vars = el?.querySelectorAll(".ph-template-variable")
      return vars && vars.length >= 2
    })

    const editorState = await geminiPage.evaluate(() => {
      const el = document.querySelector(".ql-editor")
      const vars = Array.from(
        el?.querySelectorAll(".ph-template-variable") || []
      )
      return {
        text: el?.textContent || "",
        varCount: vars.length,
        firstActive: vars[0]?.classList.contains("ph-template-variable-active")
      }
    })

    expect(editorState.varCount).toBe(2)
    expect(editorState.firstActive).toBe(true)

    // Type into first variable
    await geminiPage.keyboard.type("TypeScript")

    // Press Tab to jump to the second variable
    await geminiPage.keyboard.press("Tab")

    const secondVarActive = await geminiPage.evaluate(() => {
      const vars = document.querySelectorAll(".ph-template-variable")
      return vars[1]?.classList.contains("ph-template-variable-active")
    })
    expect(secondVarActive).toBe(true)

    // Type into second variable
    await geminiPage.keyboard.type("Security")

    // Press Enter to clean up brackets before prompt submission
    await geminiPage.keyboard.press("Enter")

    const finalEditorText = await geminiPage.evaluate(() => {
      return document.querySelector(".ql-editor")?.textContent || ""
    })
    expect(finalEditorText).toContain("TypeScript")
    expect(finalEditorText).toContain("Security")
    expect(finalEditorText).not.toContain("{{")
    expect(finalEditorText).not.toContain("}}")
  })
})
