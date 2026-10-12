import type { IPrompt } from "./prompt.types"

export interface IUser {
  email: string
  password: string
  registeredAt: Date
  prompts?: Array<IPrompt>
}

export interface CreateUserBody {
  email: string
  password: string
}

export interface UpdateEmailBody {
  newEmail: string
}

export interface UpdatePasswordBody {
  newPassword: string
}

export interface UserParams {
  email: string
}

export interface Payload {
  email: string
  iss?: string
  sub?: string
  aud?: string | string[]
  exp?: number
  nbf?: number
  iat?: number
  jti?: string
}

export interface ApiMessageResponse {
  message: string
}

export interface ApiErrorResponse {
  error?: string
  message?: string
}

export interface AuthLoginResponse {
  accessToken: string
  refreshToken: string
}

export interface AuthRefreshResponse {
  accessToken: string
}
