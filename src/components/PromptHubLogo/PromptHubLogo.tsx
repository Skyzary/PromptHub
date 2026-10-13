import React from "react"

import css from "./PromptHubLogo.module.scss"

export interface PromptHubLogoProps {
  size?: number | string
  className?: string
  ariaHidden?: boolean
}

export default function PromptHubLogo({
  size,
  className,
  ariaHidden = true
}: PromptHubLogoProps) {
  const customStyle: React.CSSProperties = size
    ? {
        width: typeof size === "number" ? `${size}px` : size,
        height: typeof size === "number" ? `${size}px` : size
      }
    : {}

  return (
    <div
      className={`${css.logoWrapper} ${className ?? ""}`}
      style={customStyle}
      data-testid="prompthub-logo">
      <svg
        width="12"
        height="15"
        viewBox="0 0 12 15"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={css.logoIcon}
        aria-hidden={ariaHidden}>
        <path
          d="M4.9125 12.15L8.79375 7.5H5.79375L6.3375 3.24375L2.86875 8.25H5.475L4.9125 12.15ZM3 15L3.75 9.75H0L6.75 0H8.25L7.5 6H12L4.5 15H3Z"
          fill="white"
        />
      </svg>
    </div>
  )
}
