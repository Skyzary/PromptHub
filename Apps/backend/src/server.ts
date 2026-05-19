import "dotenv/config"
import express from "express"
import swaggerUi from "swagger-ui-express"
import YAML from "yamljs"

import authRoutes from "./routes/auth.ts"
import { dbConnect } from "./utils/dbConnect.ts"
import { logger } from "./utils/logger.ts"

const swaggerDocument = YAML.load("./swagger.yml")

const app = express()
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument))
const port = process.env.PORT || 3000

app.use(express.json())
app.use("/api/auth", authRoutes)

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error(err)
  res.status(500).json({ message: "Internal server error" })
})

await dbConnect()

app.listen(port, () => {
  logger.info(`Server is running on port ${port}`)
  logger.info("API documentation is available at /api-docs")
})
