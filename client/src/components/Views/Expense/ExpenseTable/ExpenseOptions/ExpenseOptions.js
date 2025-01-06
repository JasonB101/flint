import React, { useState, useRef, useEffect } from "react"
import Styles from "./ExpenseOptions.module.scss"

const ExpenseOptions = ({deleteExpense, expenseId}) => {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [action, setAction] = useState(null) // To track which action is selected
  const modalRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        setIsModalOpen(false) // Close modal when clicking outside
      }
    }

    if (isModalOpen) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isModalOpen])
  const handleEllipsisClick = () => {
    setIsModalOpen(!isModalOpen) // Toggle modal on click
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setAction(null) // Reset the action when closing
  }

  const handleAction = (actionType) => {
    setAction(actionType)
    // Logic based on action type
    switch (actionType) {
      case "delete":
        deleteExpense(expenseId)
        console.log("Delete clicked")
        break
      default:
        break
    }
    handleCloseModal() // Close the modal after handling the action
  }

  return (
    <div className={Styles["expenseOptionsWrapper"]}>
      <i onClick={handleEllipsisClick} className="material-icons">
        more_vert
      </i>
      {isModalOpen && (
        <div ref={modalRef} className={Styles["optionsModal"]}>
          <p onClick={() => handleAction("delete")}>Delete</p>
        </div>
      )}
    </div>
  )
}

export default ExpenseOptions
