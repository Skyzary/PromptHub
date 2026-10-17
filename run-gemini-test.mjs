import { chromium } from "playwright";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pathToExtension = path.resolve(__dirname, "build/chrome-mv3-prod");

async function run() {
  console.log("Launching browser with extension from:", pathToExtension);
  const context = await chromium.launchPersistentContext("", {
    headless: false,
    args: [
      `--disable-extensions-except=${pathToExtension}`,
      `--load-extension=${pathToExtension}`,
      "--disable-blink-features=AutomationControlled",
    ],
  });

  const mockPrompts = [
    {
      _id: "p-review-101",
      title: "Review Code",
      body: "Hello {{name}}, please check {{service}} status!",
      tags: ["code", "review"],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  // Seed extension database cache in chrome.storage.local
  console.log("Seeding extension database (chrome.storage.local) with mock prompts...");
  let [background] = context.serviceWorkers();
  if (!background) {
    background = await context.waitForEvent("serviceworker", { timeout: 10000 }).catch(() => null);
  }

  if (background) {
    await background.evaluate(async (prompts) => {
      await chrome.storage.local.set({
        templagem_access_token: "mock-auth-jwt-token",
        templagem_refresh_token: "mock-refresh-token",
        templagem_prompts_cache: prompts,
      });
      console.log("Storage seeded via background worker");
    }, mockPrompts);
  } else {
    console.log("Warning: Background worker not found, trying extension page");
  }

  const page = await context.newPage();

  console.log("Navigating to Gemini...");
  await page.goto("https://gemini.google.com/app", { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.waitForTimeout(3000);

  // Dismiss Google consent dialog if present
  try {
    await page.evaluate(() => {
      const overlay = document.querySelector(".cdk-overlay-container");
      if (overlay) {
        const acceptBtn = Array.from(overlay.querySelectorAll("button")).find((b) =>
          /accept all|i agree|agree|принять все|согласен|ok|got it/i.test(b.textContent || "")
        );
        if (acceptBtn) {
          acceptBtn.click();
        } else {
          overlay.remove();
        }
      }
    });
    await page.waitForTimeout(1000);
  } catch (e) {
    console.log("Consent dismissal:", e.message);
  }

  // Frame 1: Initial Gemini page state
  await page.screenshot({ path: "step-1-initial-gemini.png" });
  console.log("Screenshot step-1-initial-gemini.png taken");

  // Wait for Gemini input area
  console.log("Focusing Gemini input editor...");
  const editor = page.locator(".ql-editor, rich-textarea, div[contenteditable='true']").first();
  await editor.waitFor({ state: "visible", timeout: 30000 });
  await editor.click();
  await page.waitForTimeout(1500);

  // Frame 2: TemplaGem popover should be open showing mock prompts from DB
  await page.screenshot({ path: "step-2-templagem-overlay-open.png" });
  console.log("Screenshot step-2-templagem-overlay-open.png taken");

  // Select the prompt: either press Enter or click the prompt in TemplaGem
  console.log("Selecting prompt 'Review Code' from TemplaGem...");
  // Try pressing Enter to select active item in TemplaGem list
  await page.keyboard.press("Enter");
  await page.waitForTimeout(1500);

  // Frame 3: Prompt inserted into editor, variables highlighted, popover closed
  await page.screenshot({ path: "step-3-template-inserted.png" });
  console.log("Screenshot step-3-template-inserted.png taken");

  const afterSelection = await page.evaluate(() => {
    const editor = document.querySelector(".ql-editor") || document.querySelector("div[contenteditable='true']");
    const spans = editor?.querySelectorAll(".ph-template-variable") || [];
    return {
      text: editor?.textContent,
      html: editor?.innerHTML,
      spanCount: spans.length,
      firstSpanActive: spans[0]?.classList.contains("ph-template-variable-active"),
      popoverVisible: Boolean(document.querySelector("#templagem-gemini-root [role='dialog']")),
    };
  });
  console.log("State after prompt selection:", afterSelection);

  // Frame 4: Typing "Alice" into the active first variable {{name}}
  console.log("Typing 'Alice' into active variable...");
  await page.keyboard.type("Alice");
  await page.waitForTimeout(800);

  await page.screenshot({ path: "step-4-after-typing-alice.png" });
  console.log("Screenshot step-4-after-typing-alice.png taken");

  const afterAlice = await page.evaluate(() => {
    const editor = document.querySelector(".ql-editor") || document.querySelector("div[contenteditable='true']");
    return { text: editor?.textContent };
  });
  console.log("Editor text after typing Alice:", afterAlice);

  // Frame 5: Pressing Tab to navigate to next variable {{service}}
  console.log("Pressing Tab to jump to next variable {{service}}...");
  await page.keyboard.press("Tab");
  await page.waitForTimeout(800);

  await page.screenshot({ path: "step-5-after-tab-jump.png" });
  console.log("Screenshot step-5-after-tab-jump.png taken");

  // Frame 6: Typing "Auth" into the second variable {{service}}
  console.log("Typing 'Auth' into second variable...");
  await page.keyboard.type("Auth");
  await page.waitForTimeout(800);

  await page.screenshot({ path: "step-6-after-typing-auth.png" });
  console.log("Screenshot step-6-after-typing-auth.png taken");

  const afterAuth = await page.evaluate(() => {
    const editor = document.querySelector(".ql-editor") || document.querySelector("div[contenteditable='true']");
    return { text: editor?.textContent };
  });
  console.log("Editor text after typing Auth:", afterAuth);

  // Frame 7: Pressing Enter to submit prompt with cleaned brackets
  console.log("Pressing Enter to submit prompt to Gemini...");
  await page.keyboard.press("Enter");
  await page.waitForTimeout(1500);

  await page.screenshot({ path: "step-7-after-enter-submit.png" });
  console.log("Screenshot step-7-after-enter-submit.png taken");

  const afterSubmit = await page.evaluate(() => {
    const editor = document.querySelector(".ql-editor") || document.querySelector("div[contenteditable='true']");
    return { text: editor?.textContent };
  });
  console.log("Editor text after submit:", afterSubmit);

  await context.close();
}

run().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
