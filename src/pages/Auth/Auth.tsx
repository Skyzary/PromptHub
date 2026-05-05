import { MdOutlineAlternateEmail, MdOutlineLock } from "react-icons/md"

import Btn from "~src/components/ui/Btn/Btn"
import InputEl from "~src/components/ui/InputEl/InputEl"
import { userAuthSchema } from "~src/validation/userAuth"

import css from "./Auth.module.scss"

export default function Auth() {
  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ): Promise<void> {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const data = Object.fromEntries(formData.entries())
    try {
      const result = userAuthSchema.parse(data)
      console.log(result)
    } catch (error) {
      console.log(error.message)
    }
  }
  return (
    <div className={css.auth}>
      <h1 className={css.title}>Auth</h1>
      <form
        className={css.form}
        onSubmit={handleSubmit}>
        <div className={css.inputWrapper}>
          <label
            htmlFor="email"
            className={css.label}>
            Email
          </label>
          <InputEl
            type="email"
            name="email"
            id="email"
            className={css.input}
            required
            placeholder="Enter your email"
            icon={<MdOutlineAlternateEmail size={20} />}
          />
        </div>
        <div className={css.inputWrapper}>
          <label
            htmlFor="password"
            className={css.label}>
            Password
          </label>
          <InputEl
            type="password"
            name="password"
            id="password"
            required
            placeholder="Enter your password"
            className={css.input}
            icon={<MdOutlineLock size={20} />}
          />
        </div>
        <Btn
          styleType={"primary"}
          onClick={() => {}}
          type="submit">
          Login
        </Btn>
        <Btn
          styleType={"primary"}
          onClick={() => {}}
          type="submit"
          className={css.register}>
          Register
        </Btn>
      </form>
    </div>
  )
}
