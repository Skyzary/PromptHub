import { useEffect, useState } from "react"

import AddNewBtn from "~src/components/AddNewBtn/AddNewBtn"
import AuthForm from "~src/components/AuthForm/AuthForm"
import CreatePromptModal from "~src/components/CreatePromptModal/CreatePromptModal"
import Header from "~src/components/Header/Header"
import ListSection from "~src/components/ListSection/ListSection"
import SearchField from "~src/components/SearchField/SearchField"
import {
  getAccessToken,
  getRefreshToken,
  subscribeAuthChange
} from "~src/utils/auth"

import "./popup.scss"

export default function Popup() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() =>
    Boolean(getAccessToken() || getRefreshToken())
  )
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  useEffect(() => {
    return subscribeAuthChange((authenticated) => {
      setIsAuthenticated(authenticated)
    })
  }, [])

  return (
    <div className={"popup"}>
      <Header />
      {isAuthenticated ? (
        <>
          <SearchField onSearch={(query) => console.log(query)} />
          <ListSection />
          <AddNewBtn onClick={() => setIsCreateModalOpen(true)} />
          <CreatePromptModal
            isOpen={isCreateModalOpen}
            onClose={() => setIsCreateModalOpen(false)}
          />
        </>
      ) : (
        <AuthForm onAuthSuccess={() => setIsAuthenticated(true)} />
      )}
    </div>
  )
}
