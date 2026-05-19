export interface User {
  id: string
  email: string
  password: string
}
export type secureUserRest = Omit<User, "password">
