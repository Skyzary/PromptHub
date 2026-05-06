import PromptCard from "../PromptCard/PromptCard"
import css from "./ListSection.module.scss"

export default function ListSection() {
  return (
    <section className={css.listSection}>
      <h2 className={css.listHeading}>Recent & Favorites</h2>
      <ul className={css.listContainer}>
        <PromptCard
          name={"hello"}
          description={"hello"}
          type={"daily"}
        />
        <PromptCard
          name={"hello"}
          description={"hello"}
          type={"education"}
        />
        <PromptCard
          name={"hello"}
          description={"hello"}
          type={"development"}
        />
        <PromptCard
          name={"hello"}
          description={"hello"}
          type={"entertainment"}
        />
        <PromptCard
          name={"hello"}
          description={"hello"}
          type={"unknown"}
        />
      </ul>
    </section>
  )
}
