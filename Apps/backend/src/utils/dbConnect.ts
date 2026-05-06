import mongoose from "mongoose";
import dotenv from "dotenv/config";
import {logger} from "./logger.ts";
export const dbConnect = async () => {
  const url = process.env.CONNECTION_STRING;
  console.log("DEBUG_URI_START[" + url + "]DEBUG_URI_END");

  if (url) {
    try {
      await mongoose.connect(url);
      logger.info("Connected to MongoDB");
    } catch (error: any) {
      logger.error({
        msg: error.message,
        code: error.code,
        name: error.name
      }, "Failed to connect to MongoDB");

      process.exit(1);
    }
  }
  else {
    logger.fatal("CONNECTION_STRING is not defined in the environment variables");
  }
};