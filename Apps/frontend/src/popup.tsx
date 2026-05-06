import "./globals.scss.css"
import "./popup.scss"

import Header from "~src/components/Header/Header"
import Auth from "~src/pages/Auth/Auth"

export default function Popup() {
  return (
    <div className={"popup"}>
      <Header />
      <Auth />
    </div>
  )
}
