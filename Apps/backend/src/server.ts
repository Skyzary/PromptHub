import dotenv from "dotenv/config"
import express from "express"
import mongoose from "mongoose"

import { dbConnect } from "./utils/dbConnect.ts"
import { logger } from "./utils/logger.ts"

const app = express()

app.use(express.json())
await dbConnect()

app.listen(3000, () => {
  logger.info("Server is running on port 3000")
})
