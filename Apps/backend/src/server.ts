import express from "express";
import mongoose from "mongoose";
import { logger } from "./utils/logger.ts";
import dotenv from "dotenv/config";
import { dbConnect } from "./utils/dbConnect.ts"
const app = express();

app.use(express.json());
await dbConnect();

app.listen(3000, () => {
    logger.info('Server is running on port 3000');
});
