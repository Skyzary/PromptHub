import mongoose from "mongoose"

import { logger } from "./logger.ts"

export const dbConnect = async () => {
  const url = process.env.CONNECTION_STRING
  console.log("DEBUG_URI_START[" + url + "]DEBUG_URI_END")

  if (url) {
    try {
      await mongoose.connect(url)
      logger.info("Connected to MongoDB")
    } catch (error: unknown) {
      const err = error as { message: string; code?: string | number; name: string }
      logger.error(
        {
          msg: err.message,
          code: err.code,
          name: err.name
        },
        "Failed to connect to MongoDB"
      )

      process.exit(1)
    }
  } else {
    logger.fatal(
      "CONNECTION_STRING is not defined in the environment variables"
    )
  }
}
