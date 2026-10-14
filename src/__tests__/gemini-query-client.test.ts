import { QueryClient } from "@tanstack/react-query"
import { describe, expect, it } from "vitest"

import { createDefaultQueryClient } from "../contents/gemini-query-client"

describe("createDefaultQueryClient", () => {
  it("creates a QueryClient instance with correct default query options", () => {
    const client = createDefaultQueryClient()
    expect(client).toBeInstanceOf(QueryClient)

    const defaultOptions = client.getDefaultOptions()
    expect(defaultOptions.queries?.retry).toBe(false)
    expect(defaultOptions.queries?.refetchOnWindowFocus).toBe(false)
    expect(defaultOptions.queries?.gcTime).toBe(0)
  })
})
