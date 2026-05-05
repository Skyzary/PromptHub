import clsx from "clsx"
import React from "react"

import css from "./InputEl.module.scss"

interface InputElProps extends React.InputHTMLAttributes<HTMLInputElement> {
  className?: string
  icon?: React.ReactNode
}

export default function InputEl({ className, icon, ...rest }: InputElProps) {
  const inputClasses = clsx(className, css.Input, { [css.hasIcon]: !!icon })
  
  return (
    <div className={css.inputContainer}>
      {icon && <div className={css.iconWrapper}>{icon}</div>}
      <input
        className={inputClasses}
        {...rest}
      />
    </div>
  )
}
