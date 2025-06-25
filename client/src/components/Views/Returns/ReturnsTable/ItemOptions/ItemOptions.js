import React, { useState, useRef, useEffect } from "react"
import Styles from "./ItemOptions.module.scss"
import ReturnDetailsModal from "../../ReturnDetailsModal/ReturnDetailsModal"

const ItemOptions = ({ itemObject, setProcessItem }) => {
  const [showOptions, setShowOptions] = useState(false)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const optionsRef = useRef(null)

  const { _id, sku, title, status, listed, ebayReturnId } = itemObject

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
    setShowOptions(false)
    setShowDetailsModal(true)
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

  const handleProcess = () => {
    setShowOptions(false)
    if (setProcessItem) {
      setProcessItem(itemObject)
    }
  }

  return (
    <>
      <div className={Styles.itemOptionsWrapper} ref={optionsRef}>
        <i
          className="material-icons"
          onClick={() => setShowOptions(!showOptions)}
        >
          more_vert
        </i>
        {showOptions && (
          <div className={Styles.optionsModal}>
            <p onClick={handleProcess}>
              <i className="material-icons">settings_applications</i>
              Process
            </p>
            <p onClick={handleViewDetails}>
              <i className="material-icons">info</i>
              View Details
              {ebayReturnId && <span className={Styles.ebayBadge}>eBay</span>}
            </p>
            {listed && (
              <p onClick={handleViewOnEbay}>
                <i className="material-icons">launch</i>
                View on eBay
              </p>
            )}
            <p onClick={handleCopyInfo}>
              <i className="material-icons">content_copy</i>
              Copy Info
            </p>
          </div>
        )}
      </div>

      <ReturnDetailsModal
        show={showDetailsModal}
        onHide={() => setShowDetailsModal(false)}
        itemId={_id}
      />
    </>
  )
}

export default ItemOptions 