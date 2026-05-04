import React from "react"
import css from "./Btn.module.scss"

interface BtnProps {
  content: React.ReactNode;
  type: 'primary' | 'secondary';
  onClick: () => void;

}
export default function Btn({content, type, onClick}: BtnProps) {
  const btnClass = type ? css.primary : css.secondary;
  return (
    <button className={btnClass} onClick={onClick}>{content}</button>


  )

}