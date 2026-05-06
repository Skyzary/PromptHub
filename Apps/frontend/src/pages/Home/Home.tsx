import ListSection from "~src/components/ListSection/ListSection"
import SearchField from "~src/components/SearchField/SearchField"
import Btn from "~src/components/ui/Btn/Btn"

export default function Home() {
  return (
    <>
      <SearchField onSearch={(query) => console.log(query)} />
      <ListSection />
      <Btn
        styleType={"primary"}
        onClick={() => {}}
        type="button"
      >
        Create new prompt
      </Btn>
</>
  )
}
