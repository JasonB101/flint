import React, { useState } from "react"
import Styles from "./TripReport.module.scss"
import TripReportModal from "./TripReportModal"

const TripReport = ({ items, expenses }) => {
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <>
      <div className={Styles.tripReportButton}>
        <button 
          className={Styles.openModalButton}
          onClick={() => setIsModalOpen(true)}
        >
          📊 View Trip Report
        </button>
      </div>
      
      <TripReportModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        items={items}
        expenses={expenses}
      />
    </>
  )
}

export default TripReport
