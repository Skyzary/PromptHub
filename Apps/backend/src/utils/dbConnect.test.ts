import mongoose from "mongoose"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { dbConnect } from "./dbConnect.ts"
import { logger } from "./logger.ts"

vi.mock("mongoose", () => ({
  default: {
    connect: vi.fn()
  }
}))

vi.mock("./logger", () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    fatal: vi.fn()
  }
}))

describe("dbConnect", () => {
  const originalEnv = process.env

  beforeEach(() => {
    vi.resetModules()
    process.env = { ...originalEnv }
    vi.clearAllMocks()
  })

  afterEach(() => {
    process.env = originalEnv
  })

  it("should connect to MongoDB when CONNECTION_STRING is provided", async () => {
    process.env.CONNECTION_STRING = "mongodb://localhost:27017/test"
    vi.mocked(mongoose.connect).mockResolvedValueOnce({} as never)

    await dbConnect()

    expect(mongoose.connect).toHaveBeenCalledWith(
      "mongodb://localhost:27017/test"
    )
    expect(logger.info).toHaveBeenCalledWith("Connected to MongoDB")
  })

  it("should log fatal error when CONNECTION_STRING is missing", async () => {
    delete process.env.CONNECTION_STRING

    await dbConnect()

    expect(logger.fatal).toHaveBeenCalledWith(
      "CONNECTION_STRING is not defined in the environment variables"
    )
  })

  it("should log error and exit when connection fails", async () => {
    process.env.CONNECTION_STRING = "mongodb://localhost:27017/test"
    const error = new Error("Connection failed")
    vi.mocked(mongoose.connect).mockRejectedValueOnce(error)

    const exitSpy = vi.spyOn(process, "exit").mockImplementation(() => {
      throw new Error("process.exit")
    })

    try {
      await dbConnect()
    } catch (
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      _
    ) {
      // Catch the thrown error from process.exit mock
    }

    expect(logger.error).toHaveBeenCalledWith(
      expect.objectContaining({ msg: "Connection failed" }),
      "Failed to connect to MongoDB"
    )
    expect(exitSpy).toHaveBeenCalledWith(1)
  })
})
