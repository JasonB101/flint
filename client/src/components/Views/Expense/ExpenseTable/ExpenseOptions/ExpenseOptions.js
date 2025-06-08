import React, { useState, useRef, useEffect } from "react"
import { createPortal } from "react-dom"
import Styles from "./ExpenseOptions.module.scss"

const ExpenseOptions = ({deleteExpense, expenseId, onEdit, expense}) => {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [action, setAction] = useState(null) // To track which action is selected
  const [modalPosition, setModalPosition] = useState({ top: 0, left: 0 })
  const modalRef = useRef(null)
  const buttonRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        setIsModalOpen(false) // Close modal when clicking outside
      }
    }

    if (isModalOpen) {
      document.addEventListener("mousedown", handleClickOutside)
      
      // Calculate position when modal opens
      if (buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect()
        setModalPosition({
          top: rect.top + window.scrollY,
          left: rect.right + window.scrollX + 8
        })
      }
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
      case "edit":
        if (onEdit && expense) {
          onEdit(expense)
        }
        break
      case "delete":
        deleteExpense(expenseId)
        break
      default:
        break
    }
    handleCloseModal() // Close the modal after handling the action
  }

  // Render dropdown as portal to avoid z-index issues
  const renderDropdown = () => {
    if (!isModalOpen) return null;
    
    return createPortal(
      <div 
        ref={modalRef} 
        className={Styles["optionsModal"]}
        style={{
          position: 'fixed',
          top: modalPosition.top,
          left: modalPosition.left,
          zIndex: 999999
        }}
      >
        <p 
          className={Styles["editOption"]} 
          onClick={() => handleAction("edit")}
        >
          Edit
        </p>
        <p 
          className={Styles["deleteOption"]} 
          onClick={() => handleAction("delete")}
        >
          Delete
        </p>
      </div>,
      document.body
    );
  };

  return (
    <div className={Styles["expenseOptionsWrapper"]}>
      <i ref={buttonRef} onClick={handleEllipsisClick} className="material-icons">
        more_vert
      </i>
      {renderDropdown()}
    </div>
  )
}

export default ExpenseOptions
