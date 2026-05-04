import Btn from "~src/components/ui/Btn/Btn"

import css from "./AddNewBtn.module.scss"

interface AddNewBtnProps {
  onClick?: () => void
}

export default function AddNewBtn({ onClick }: AddNewBtnProps) {
  return (
    <Btn
      styleType={"primary"}
      onClick={onClick}
      className={css.addNewBtn}>
      Create new prompt
    </Btn>
  )
}
