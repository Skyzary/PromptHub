import clsx from "clsx"
import React from "react"

import css from "./Btn.module.scss"

interface BtnProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode
  styleType: "primary" | "secondary"
  onClick: () => void
}

/**
 * A button component that can be styled as primary or secondary.
 * @param param0
 * @param param0.children
 * @param param0.styleType
 * @param param0.className
 * @constructor
 */
export default function Btn({
  children,
  styleType,
  className,
  ...rest
}: BtnProps) {
  const btnClass = clsx(
    styleType === "primary" ? css.primary : css.secondary,
    className
  )
  return (
    <button
      className={btnClass}
      {...rest}>
      {children}
    </button>
  )
}
