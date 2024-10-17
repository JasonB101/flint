import React, { useState, useRef, useEffect } from "react"
import Styles from "./ItemOptions.module.scss"

const ItemOptions = ({setEditItem, itemObject}) => {
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
      case "view":
        //logic
        console.log("View clicked")
        window.open(`https://www.ebay.com/itm/${itemObject.ebayId}`, '_blank')
        break
      case "copy":
        //logic
        console.log("Copy clicked")
        break
      case "edit":
        setEditItem(itemObject)
        console.log("Revise clicked")
        break
      case "waste":
        // Logic for removing
        console.log("waste clicked")
        break
      case "relist":
        // Logic for relisting
        console.log("Relist clicked")
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
          <p onClick={() => handleAction("edit")}>Edit</p>
          <p onClick={() => handleAction("view")}>View</p>
          <p onClick={() => handleAction("copy")}>Copy</p>
          <p onClick={() => handleAction("relist")}>Relist</p>
          <p onClick={() => handleAction("waste")}>Waste</p>
        </div>
      )}
    </div>
  )
}

export default ItemOptions
