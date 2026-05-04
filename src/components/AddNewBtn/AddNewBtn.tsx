import Btn from "~src/components/ui/Btn/Btn"

import css from "./AddNewBtn.module.scss"

export default function AddNewBtn() {
  return (
    <Btn
      styleType={"primary"}
      onClick={() => {}}
      className={css.addNewBtn}>
      Create new prompt
    </Btn>
  )
}
