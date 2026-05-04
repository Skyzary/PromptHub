import AddNewBtn from "~src/components/AddNewBtn/AddNewBtn"
import Header from "~src/components/Header/Header"
import ListSection from "~src/components/ListSection/ListSection"
import SearchField from "~src/components/SearchField/SearchField"

import "./popup.scss"

export default function Popup() {
  return (
    <div className={"popup"}>
      <Header />
      <SearchField onSearch={(query) => console.log(query)} />
      <ListSection />
      <AddNewBtn />
    </div>
  )
}
