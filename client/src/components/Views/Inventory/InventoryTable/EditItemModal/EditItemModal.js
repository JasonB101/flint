import React, { useState } from "react"
import Styles from "./EditItemModal.module.scss"

const EditItemModal = ({onSubmit, onClose}) => {
  const [inputs, setInputs] = useState({
    title: "",
    partNo: "",
    sku: "",
    brand: "",
    location: "",
    datePurchased: "",
    categoryId: "",
    purchaseLocation: "",
    purchasePrice: "",
    listedPrice: "",
    shippingService: "",
    description: "",
    conditionId: "",
    conditionDescription: "",
    acceptOfferHigh: "",
    declineOfferLow: "",
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setInputs((prev) => ({ ...prev, [name]: value }))
  }
  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(inputs);
    onClose();
  }

  return <div className={Styles["editItemModalWrapper"]}>
     <div className={Styles.modalContent}>
        <h2>Edit Item</h2>
        <form onSubmit={handleSubmit}>
          {Object.keys(inputs).map((key) => (
            <div key={key} className={Styles.formGroup}>
              <label htmlFor={key}>{key.replace(/([A-Z])/g, ' $1').toUpperCase()}</label>
              <input
                type="text"
                id={key}
                name={key}
                value={inputs[key]}
                onChange={handleChange}
              />
            </div>
          ))}
          <div className={Styles.buttonGroup}>
            <button type="button" onClick={onClose}>Cancel</button>
            <button type="submit">Save Changes</button>
          </div>
        </form>
      </div>
  </div>
}

export default EditItemModal
