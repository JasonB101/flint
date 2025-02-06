import React, { useState } from "react"
import Styles from "./CompatibilityModal.module.scss"

const CompatibilityModal = ({ compatibilityList, closeCompatibilityModal }) => {
  const [items, setItems] = useState(compatibilityList)
  let firstItem = items[0] || {}
  const { Year = "", Make = "", Model = "" } = firstItem
  const [newItem, setNewItem] = useState({
    Year,
    Make,
    Model,
    Trim: "",
    Engine: "",
  })

  const sortedItems = items.sort((a, b) => {
    const makeComparison = a.Make.localeCompare(b.Make)
    if (makeComparison !== 0) return makeComparison

    const modelComparison = a.Model.localeCompare(b.Model)
    if (modelComparison !== 0) return modelComparison

    const trimComparison = a.Trim.localeCompare(b.Trim)
    if (trimComparison !== 0) return trimComparison

    const engineComparison = a.Engine.localeCompare(b.Engine)
    if (engineComparison !== 0) return engineComparison

    return parseInt(a.Year, 10) - parseInt(b.Year, 10)
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setNewItem((prev) => ({ ...prev, [name]: value }))
  }

  const handleAddItem = (e) => {
    e.preventDefault()
    setItems((prev) => [...prev, newItem])
    setNewItem({ Year, Make, Model, Trim: "", Engine: "" })
  }
  const handleRemoveItem = (index, e) => {
    e.preventDefault()
    const updatedItems = items.filter((item, i) => i !== index)
    setItems(updatedItems)
  }

  return (
    <div className={Styles.compatibilityModalWrapper}>
      <div className={Styles.modalContent}>
        <form onSubmit={handleAddItem} className={Styles.newItemForm}>
          <div className={Styles.row1}>
            <input
              type="text"
              name="Year"
              placeholder="Year"
              value={newItem.Year}
              onChange={handleChange}
            />
            <input
              type="text"
              name="Make"
              placeholder="Make"
              value={newItem.Make}
              onChange={handleChange}
            />
            <input
              type="text"
              name="Model"
              placeholder="Model"
              value={newItem.Model}
              onChange={handleChange}
            />
          </div>
          <div className={Styles.row2}>
            <input
              type="text"
              name="Trim"
              placeholder="Trim"
              value={newItem.Trim}
              onChange={handleChange}
            />
            <input
              type="text"
              name="Engine"
              placeholder="Engine"
              value={newItem.Engine}
              onChange={handleChange}
            />
          </div>
          <button onClick={handleAddItem}>Add Vehicle</button>
        </form>
        <button
          className={Styles.closeBtn}
          onClick={(e) => {
            e.preventDefault()
            closeCompatibilityModal()
          }}
        >
          X
        </button>
        {items.length === 0 ? (
          <p className={Styles.noItems}>No compatible items found</p>
        ) : (
          <ul className={Styles.compatibilityList}>
            {sortedItems.map((item, index) => (
              <li key={index} className={Styles.compatibilityItem}>
                <div className={Styles.itemDetails}>
                  <p>
                    <strong>
                      {item.Year} {item.Make} {item.Model}
                    </strong>
                  </p>
                  <p>{item.Trim}</p>
                  <p>{item.Engine}</p>
                </div>
                <button
                  className={Styles.removeBtn}
                  onClick={(e) => handleRemoveItem(index, e)}
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

export default CompatibilityModal
