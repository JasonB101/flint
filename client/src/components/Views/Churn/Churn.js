import React, {useState} from "react"
import ChurnSettings from "./ChurnSettings"
import ChurnItems from "./ChurnItems"
import Styles from "./Churn.module.scss"

const Churn = ({ churnSettings, saveChurnSettings, items }) => {
  const [churnDaysToShow, setChurnDaysToShow] = useState(churnSettings?.churnDaysToShow || 3)
  
  const windowOfDays = new Date()
  windowOfDays.setDate(windowOfDays.getDate() - churnDaysToShow - 1)

  const filteredItems = items.filter((item) => {
    const itemDate = new Date(item.dateReListed)
    return item.listingAgent === "churn" && itemDate >= windowOfDays
  })

  return (
    <div className={Styles["churnWrapper"]}>
      <ChurnItems items={filteredItems} />
      <ChurnSettings
        churnSettings={churnSettings}
        saveChurnSettings={saveChurnSettings}
      />
    </div>
  )
}

export default Churn
