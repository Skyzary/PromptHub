import jwt from "jsonwebtoken"

const secret = process.env.ACCESS_TOKEN_SECRET
const expiresIn = process.env.ACCESS_EXPIRES

export default function generateToken(user: { id: string }) {
  if (!secret || !expiresIn) {
    throw new Error("Missing JWT configuration")
  }

  const payload = { id: user.id }
  return jwt.sign(
    payload,
    secret, {
    expiresIn: expiresIn as jwt.SignOptions["expiresIn"]
  })
}
