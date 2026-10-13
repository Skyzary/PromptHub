import React from "react"

export interface GeminiIconProps {
  size?: number | string
  className?: string
  color?: string
  strokeWidth?: number
  ariaHidden?: boolean
}

export const GEMINI_ICON_SIZES = {
  sparkle: 18,
  search: 16,
  refresh: 16,
  close: 16,
  enter: 12
} as const

export const SparkleIcon: React.FC<GeminiIconProps> = ({
  size = GEMINI_ICON_SIZES.sparkle,
  className,
  ariaHidden = true
}) => (
  <svg
    className={className}
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden={ariaHidden}>
    <path
      d="M12 2L14.4 9.6L22 12L14.4 14.4L12 22L9.6 14.4L2 12L9.6 9.6L12 2Z"
      fill="url(#gemini-sparkle-grad)"
    />
    <defs>
      <linearGradient
        id="gemini-sparkle-grad"
        x1="2"
        y1="2"
        x2="22"
        y2="22"
        gradientUnits="userSpaceOnUse">
        <stop stopColor="#4285f4" />
        <stop
          offset="0.5"
          stopColor="#9b72cb"
        />
        <stop
          offset="1"
          stopColor="#d96570"
        />
      </linearGradient>
    </defs>
  </svg>
)

export const SearchIcon: React.FC<GeminiIconProps> = ({
  size = GEMINI_ICON_SIZES.search,
  strokeWidth = 2,
  color = "currentColor",
  className,
  ariaHidden = true
}) => (
  <svg
    className={className}
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden={ariaHidden}>
    <circle
      cx="11"
      cy="11"
      r="8"
    />
    <line
      x1="21"
      y1="21"
      x2="16.65"
      y2="16.65"
    />
  </svg>
)

export const RefreshIcon: React.FC<GeminiIconProps> = ({
  size = GEMINI_ICON_SIZES.refresh,
  strokeWidth = 2,
  color = "currentColor",
  className,
  ariaHidden = true
}) => (
  <svg
    className={className}
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden={ariaHidden}>
    <path d="M21.5 2v6h-6" />
    <path d="M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-1.19" />
  </svg>
)

export const CloseIcon: React.FC<GeminiIconProps> = ({
  size = GEMINI_ICON_SIZES.close,
  strokeWidth = 2.2,
  color = "currentColor",
  className,
  ariaHidden = true
}) => (
  <svg
    className={className}
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden={ariaHidden}>
    <line
      x1="18"
      y1="6"
      x2="6"
      y2="18"
    />
    <line
      x1="6"
      y1="6"
      x2="18"
      y2="18"
    />
  </svg>
)

export const EnterIcon: React.FC<GeminiIconProps> = ({
  size = GEMINI_ICON_SIZES.enter,
  strokeWidth = 2.2,
  color = "currentColor",
  className,
  ariaHidden = true
}) => (
  <svg
    className={className}
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden={ariaHidden}>
    <polyline points="9 10 4 15 9 20" />
    <path d="M20 4v7a4 4 0 0 1-4 4H4" />
  </svg>
)
