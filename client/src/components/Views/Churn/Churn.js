import React from "react"
import ChurnSettings from "./ChurnSettings"
import Styles from "./Churn.module.scss"


const Churn = ({ churnSettings, saveChurnSettings }) => {
  return (<div className={Styles['churnWrapper']}>
  <ChurnSettings churnSettings={churnSettings} saveChurnSettings={saveChurnSettings} />
  </div>)
}

export default Churn