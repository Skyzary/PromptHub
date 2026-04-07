import Header from "~src/components/Header/Header"
import SearchField from "~src/components/SearchField/SearchField"
import ListSection from "~src/components/ListSection/ListSection"

export default function Popup(){
  return(
    <div className={'popup'}>
      <Header/>
      <SearchField onSearch={(query) => console.log(query)}/>
      <ListSection/>
    </div>

  )
}