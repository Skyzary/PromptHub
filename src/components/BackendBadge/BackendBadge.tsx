import React from "react"

import { DEFAULT_API_BASE_URL } from "~src/utils/api-request"

import css from "./BackendBadge.module.scss"

interface BackendBadgeProps {
  className?: string
  apiUrl?: string
}

export default function BackendBadge({
  className,
  apiUrl = DEFAULT_API_BASE_URL
}: BackendBadgeProps) {
  return (
    <div
      className={`${css.badgeContainer} ${className ?? ""}`}
      title={`Connected API: ${apiUrl}`}
      data-testid="backend-badge">
      <span
        className={css.statusDot}
        aria-hidden="true"
      />
      <span className={css.label}>Backend:</span>
      <span className={css.url}>{apiUrl}</span>
    </div>
  )
}

