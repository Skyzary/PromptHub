import React from "react"

import css from "./TemplaGemLogo.module.scss"

export interface TemplaGemLogoProps {
  size?: number | string
  className?: string
  ariaHidden?: boolean
}

export default function TemplaGemLogo({
  size,
  className,
  ariaHidden = true
}: TemplaGemLogoProps) {
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
      data-testid="templagem-logo">
      <svg
        width="34"
        height="34"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={css.logoIcon}
        aria-hidden={ariaHidden}>
        {/* Minimalist Gemini 4-Point Star in Google Brand Blue with crisp White prompt chevron */}
        <path
          d="M12 2C12 7.5 7.5 12 2 12C7.5 12 12 16.5 12 22C12 16.5 16.5 12 22 12C16.5 12 12 7.5 12 2Z"
          fill="#1a73e8"
        />
        <path
          d="M11 7.5L15.5 12L11 16.5"
          stroke="white"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  )
}
