#!/usr/bin/env node

/**
 * Diagnostic tool to check connectivity and health of the PromptHub backend
 * running in local Docker or on a remote server.
 */

const targetApiUrl =
  process.env.PLASMO_PUBLIC_API_URL ||
  process.argv[2] ||
  "http://localhost:4300/api"

console.log("\n==========================================")
console.log(" PromptHub Backend Connection Health Check")
console.log("==========================================")
console.log(`Target URL: ${targetApiUrl}`)

async function checkUrl(url, label) {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 4000)

    const startTime = Date.now()
    const response = await fetch(url, {
      method: "GET",
      signal: controller.signal
    })
    clearTimeout(timeout)
    const elapsed = Date.now() - startTime

    console.log(`\n[+] ${label}`)
    console.log(`    URL:    ${url}`)
    console.log(`    Status: ${response.status} ${response.statusText} (${elapsed}ms)`)

    const text = await response.text()
    let preview = text.trim()
    if (preview.length > 200) {
      preview = preview.slice(0, 200) + "..."
    }
    console.log(`    Body:   ${preview || "(empty)"}`)
    return { ok: response.status < 500, status: response.status }
  } catch (err) {
    console.log(`\n[-] ${label}`)
    console.log(`    URL:   ${url}`)
    console.log(`    Error: ${err.message || err}`)
    return { ok: false, error: err.message }
  }
}

async function run() {
  const base = targetApiUrl.replace(/\/+$/, "")
  const rootUrl = base.replace(/\/api$/, "")

  // 1. Check Swagger Docs or root
  await checkUrl(`${rootUrl}/api/docs`, "API Documentation (Swagger UI)")

  // 2. Check Auth Route availability
  await checkUrl(`${base}/auth`, "API Auth Route")

  // 3. Check Prompts Route availability
  const promptsCheck = await checkUrl(`${base}/prompts`, "API Prompts Endpoint")

  console.log("\n------------------------------------------")
  if (promptsCheck.ok) {
    console.log("SUCCESS: Backend is reachable and responding!")
    console.log("Your Chrome Extension can connect to this endpoint.")
  } else {
    console.log("NOTICE: Backend could not be reached.")
    console.log("If testing with local Docker, ensure it is running via:")
    console.log("  cd /Users/levkovskyivladimir/Dev/PromptHub_backend")
    console.log("  docker compose -f docker-compose.local.yml up -d")
  }
  console.log("------------------------------------------\n")
}

run()

