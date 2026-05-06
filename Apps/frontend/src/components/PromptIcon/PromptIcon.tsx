import { types } from "~src/components/ui/iconRender/iconStore"

interface PromptIconProps {
  type: string
}
export default function PromptIcon({ type }: PromptIconProps) {
  const iconRender = types[type] || types.other

  return iconRender()
}
