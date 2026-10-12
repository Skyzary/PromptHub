import type {
  ApiMessageResponse,
  UpdateEmailBody,
  UpdatePasswordBody
} from "./types"
import { apiRequest, DEFAULT_API_BASE_URL } from "./utils/api-request"
import { invalidateRefreshToken } from "./utils/auth"
import {
  updateEmailSchema,
  updatePasswordSchema
} from "./validation/user-validation"

export class UserApi {
  private readonly baseUrl: string

  constructor(baseUrl: string = DEFAULT_API_BASE_URL) {
    this.baseUrl = baseUrl
  }

  async deleteUser(accessToken?: string): Promise<ApiMessageResponse> {
    const response = await apiRequest<ApiMessageResponse>(
      `${this.baseUrl}/users`,
      {
        method: "DELETE"
      },
      accessToken
    )
    await invalidateRefreshToken(this.baseUrl)
    return response
  }

  async updateEmail(
    data: UpdateEmailBody,
    accessToken?: string
  ): Promise<ApiMessageResponse> {
    const validated = updateEmailSchema.parse(data)
    return apiRequest<ApiMessageResponse>(
      `${this.baseUrl}/users/email`,
      {
        method: "PUT",
        body: JSON.stringify(validated)
      },
      accessToken
    )
  }

  async updatePassword(
    data: UpdatePasswordBody,
    accessToken?: string
  ): Promise<ApiMessageResponse> {
    const validated = updatePasswordSchema.parse(data)
    return apiRequest<ApiMessageResponse>(
      `${this.baseUrl}/users/password`,
      {
        method: "PATCH",
        body: JSON.stringify(validated)
      },
      accessToken
    )
  }
}

export const userApi = new UserApi()

export const deleteUser = (accessToken?: string): Promise<ApiMessageResponse> =>
  userApi.deleteUser(accessToken)

export const updateEmail = (
  data: UpdateEmailBody,
  accessToken?: string
): Promise<ApiMessageResponse> => userApi.updateEmail(data, accessToken)

export const updatePassword = (
  data: UpdatePasswordBody,
  accessToken?: string
): Promise<ApiMessageResponse> => userApi.updatePassword(data, accessToken)
