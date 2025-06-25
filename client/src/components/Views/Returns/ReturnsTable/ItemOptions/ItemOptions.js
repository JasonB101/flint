import React, { useState, useRef, useEffect } from "react"
import Styles from "./ItemOptions.module.scss"

const ItemOptions = ({ itemObject }) => {
  const [showOptions, setShowOptions] = useState(false)
  const optionsRef = useRef(null)

  const { _id, sku, title, status, listed } = itemObject

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (optionsRef.current && !optionsRef.current.contains(event.target)) {
        setShowOptions(false)
      }
    }

    if (showOptions) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [showOptions])

  const handleViewDetails = () => {
    console.log("View details for item:", _id)
    setShowOptions(false)
    // You can implement a detail modal here
  }

  const handleViewOnEbay = () => {
    if (listed) {
      // If we have eBay ID, we could open the eBay listing
      console.log("View on eBay for SKU:", sku)
    }
    setShowOptions(false)
  }

  const handleCopyInfo = () => {
    const itemInfo = `SKU: ${sku}\nTitle: ${title}\nStatus: ${status}`
    navigator.clipboard.writeText(itemInfo)
    setShowOptions(false)
  }

  return (
    <div className={Styles.itemOptionsWrapper} ref={optionsRef}>
      <i
        className="material-icons"
        onClick={() => setShowOptions(!showOptions)}
      >
        more_vert
      </i>
      {showOptions && (
        <div className={Styles.optionsModal}>
          <p onClick={handleViewDetails}>
            View Details
          </p>
          {listed && (
            <p onClick={handleViewOnEbay}>
              View on eBay
            </p>
          )}
          <p onClick={handleCopyInfo}>
            Copy Info
          </p>
        </div>
      )}
    </div>
  )
}

export default ItemOptions 