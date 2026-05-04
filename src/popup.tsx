import AddNewBtn from "~src/components/AddNewBtn/AddNewBtn"
import Header from "~src/components/Header/Header"
import ListSection from "~src/components/ListSection/ListSection"
import SearchField from "~src/components/SearchField/SearchField"

import "./popup.scss"

import sayHello from "~src/hello_world"

export default function Popup() {
  return (
    <div className={"popup"}>
      <Header />
      <SearchField onSearch={(query) => console.log(query)} />
      <ListSection />
      <AddNewBtn onClick={() => sayHello()} />
    </div>
  )
}
