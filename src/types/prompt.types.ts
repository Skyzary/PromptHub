export interface CreatePromptBody {
  email: string
  title: string
  body: string
  tags: Array<string>
  updatedAt?: Date
  createdAt?: Date
}

export interface UpdatePromptTitle {
  email: string
  promptId: string
  title: string
}

export interface UpdatePromptBody {
  email: string
  promptId: string
  body: string
}

export interface UpdatePromptTags {
  email: string
  promptId: string
  tags: Array<string>
}

export interface DeletePrompt {
  email: string
  promptId: string
}

export interface IPrompt {
  _id?: string
  title: string
  body: string
  createdAt?: Date
  updatedAt?: Date
  tags: Array<string>
}

export type CreatePromptRequest = Omit<
  CreatePromptBody,
  "email" | "updatedAt" | "createdAt"
>
export type UpdatePromptTitleRequest = Omit<UpdatePromptTitle, "email">
export type UpdatePromptBodyRequest = Omit<UpdatePromptBody, "email">
export type UpdatePromptTagsRequest = Omit<UpdatePromptTags, "email">
export type DeletePromptRequest = Omit<DeletePrompt, "email">
