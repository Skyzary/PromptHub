import { userAuthSchema } from "@prompthub/shared"
import bcrypt from "bcrypt"
import { Router } from "express"

import User from "../models/userModel.ts"
import generateToken from "../utils/tokens.ts"

const router = Router()
router.post("/api/auth/register", async (req, res): Promise<void> => {
  try {
    const { email, password } = req.body
    const result = userAuthSchema.parse({ email, password })
    if (result instanceof Error) {
      res.status(400).json({ message: result.message })
      return
    }
    if (await User.findOne({ email })) {
      res.status(400).json({ message: "User already exists" })
      return
    }
    const hashedPassword = await bcrypt.hash(password, 10)
    const user = new User({ email, password: hashedPassword })
    await user.save()
    const token = generateToken({ id: (user._id as any).toString() })
    const userObj = user.toObject()
    const { password: _, ...secureUser } = userObj

    res
      .status(201)
      .json({ message: "User created successfully", token, user: secureUser })
  } catch (error) {
    res.status(500).json({ message: "Internal server error", cause: error })
  }
})

export default router
