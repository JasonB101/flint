import React, { useState, useRef, useEffect } from "react"
import Styles from "./ItemOptions.module.scss"

const ItemOptions = ({setReturnItem, itemObject}) => {
  const [isModalOpen, setIsModalOpen] = useState(false)
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
  }

  const handleAction = (actionType) => {
    switch (actionType) {
      
      case "return":
        setReturnItem(itemObject)
        break
     
      case "otherOptions":
        // Logic for removing
        break
      default:
        break
    }
    handleCloseModal() // Close the modal after handling the action
  }

  return (
    <div className={Styles["itemOptionsWrapper"]}>
      <i onClick={handleEllipsisClick} className="material-icons">
        more_vert
      </i>
      {isModalOpen && (
        <div ref={modalRef} className={Styles["optionsModal"]}>
          <p onClick={() => handleAction("return")}>Return</p>
        </div>
      )}
    </div>
  )
}

export default ItemOptions
