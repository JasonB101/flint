import React, { useState } from "react"
import Styles from "./EditItemModal.module.scss"
import categories from "../../../../../lib/ebayCategoryInfo"

const EditItemModal = ({ onSubmit, onClose, itemObject }) => {

  const [inputs, setInputs] = useState({
    itemId: itemObject['_id'],
    ebayId: itemObject['ebayId'],
    title: itemObject.title || "",
    partNo: itemObject.partNo || "",
    sku: itemObject.sku || "",
    brand: itemObject.brand || "",
    location: itemObject.location || "",
    datePurchased: convertDateFormat(itemObject.datePurchased) || "",
    categoryId: itemObject.categoryId || "",
    purchaseLocation: itemObject.purchaseLocation || "",
    purchasePrice: itemObject.purchasePrice || "",
    listedPrice: itemObject.listedPrice || "",
    shippingService: itemObject.shippingService || "",
    description: itemObject.description || "",
    conditionId: itemObject.conditionId || "",
    conditionDescription: itemObject.conditionDescription || "",
    acceptOfferHigh:
      itemObject.acceptOfferHigh === 0
        ? +(itemObject.listedPrice - 9.99).toFixed(2)
        : itemObject.acceptOfferHigh,
    declineOfferLow:
      itemObject.declineOfferLow === 0
        ? +(itemObject.listedPrice - 19.99).toFixed(2)
        : itemObject.declineOfferLow,
  })

  const handleChange = (e) => {
    let { name, value } = e.target
    let updateForm = {...inputs}
    if (name === "partNo") value = value.toUpperCase()
    if (name === "category") name = "categoryId"
    if (name === "listedPrice") {
      value = +value
      updateForm.acceptOfferHigh = +(value - 9.99).toFixed(2)
      updateForm.declineOfferLow = +(value - 19.99).toFixed(2)
    }
    if (name === "acceptOfferHigh" || name === "declineOfferLow" || name === "purchasePrice") value = +value

    setInputs({...updateForm, [name]: value})
  }
  const handleSubmit = (e) => {
    e.preventDefault()
    inputs.datePurchased = convertBackDateFormat(inputs.datePurchased)
    onSubmit(inputs)
    onClose()
  }

  const getLabelStyle = (inputKey) => ({
    color: inputs[inputKey] !== itemObject[inputKey] ? "#007bff" : "inherit",
  })

  const sortedCategories = [...categories].sort((a, b) => {
    return a.category.localeCompare(b.category)
  })
  const categoryOptions = sortedCategories.map((x) => {
    return (
      <option key={x.id} value={x.id}>
        {x.category}
      </option>
    )
  })

  return (
    <div className={Styles["editItemModalWrapper"]}>
      <div className={Styles.modalContent}>
        <h2>Edit Item</h2>
        <form onSubmit={handleSubmit}>
          <div className={Styles.formRow}>
            <div className={Styles.formGroup}>
              <label style={getLabelStyle("title")} htmlFor="title">
                TITLE
              </label>
              <input
                type="text"
                id="title"
                name="title"
                maxLength="80"
                value={inputs.title}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className={Styles.formRow}>
            <div className={Styles.formGroup}>
              <label style={getLabelStyle("partNo")} htmlFor="partNo">
                PART NO
              </label>
              <input
                type="text"
                id="partNo"
                name="partNo"
                value={inputs.partNo}
                onChange={handleChange}
              />
            </div>
            <div className={Styles.formGroup}>
              <label style={getLabelStyle("sku")} htmlFor="sku">
                SKU
              </label>
              <input
                type="text"
                id="sku"
                name="sku"
                value={inputs.sku}
                onChange={handleChange}
              />
            </div>
            <div className={Styles.formGroup}>
              <label style={getLabelStyle("location")} htmlFor="location">
               STOCK LOCATION
              </label>
              <input
                type="text"
                id="location"
                name="location"
                value={inputs.location}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className={Styles.formRow}>
            <div className={Styles.formGroup}>
              <label
                style={getLabelStyle("purchaseLocation")}
                htmlFor="purchaseLocation"
              >
                PURCHASE LOCATION
              </label>
              <input
                type="text"
                id="purchaseLocation"
                name="purchaseLocation"
                value={inputs.purchaseLocation}
                onChange={handleChange}
              />
            </div>
            <div className={Styles.formGroup}>
              <label
                style={{color: inputs.datePurchased !== convertDateFormat(itemObject.datePurchased) ? "#007bff" : "inherit"}}
                htmlFor="datePurchased"
              >
                DATE PURCHASED
              </label>
              <input
                type="date"
                id="datePurchased"
                name="datePurchased"
                value={inputs.datePurchased}
                onChange={handleChange}
              />
            </div>
            <div className={Styles.formGroup}>
              <label
                style={getLabelStyle("purchasePrice")}
                htmlFor="purchasePrice"
              >
                PURCHASE PRICE
              </label>
              <input
                type="number"
                id="purchasePrice"
                name="purchasePrice"
                value={inputs.purchasePrice}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className={Styles.formRow}>
            <div className={Styles.formGroup}>
              <label style={getLabelStyle("categoryId")} htmlFor="category">
                CATEGORY
              </label>
              <select
                type="text"
                id="category"
                name="category"
                value={
                  categories.some(
                    (category) => category.id == inputs.categoryId
                  )
                    ? inputs.categoryId
                    : ""
                }
                onChange={handleChange}
              >
                {[
                  <option key="1" value="" disabled>
                    Select a Category
                  </option>,
                  ...categoryOptions,
                ]}
              </select>
            </div>
            <div className={Styles.formGroup}>
              <label style={getLabelStyle("categoryId")} htmlFor="categoryId">
                CATEGORY ID
              </label>
              <input
                type="text"
                id="categoryId"
                name="categoryId"
                className={Styles.categoryId}
                value={inputs.categoryId}
                onChange={handleChange}
              />
            </div>
            <div className={Styles.formGroup}>
              <label style={getLabelStyle("conditionId")} htmlFor="conditionId">
                CONDITION
              </label>
              <select
                name="conditionId"
                id="conditionId"
                value={inputs.conditionId}
                onChange={handleChange}
              >
                <option key= "used" value="3000">Used</option>
                <option key = "for parts" value="7000">For Parts</option>
                <option key = "new" value="1000">New</option>
              </select>
            </div>
            <div className={Styles.formGroup}>
              <label
                style={getLabelStyle("conditionDescription")}
                htmlFor="conditionDescription"
              >
                DESCRIPTION
              </label>
              <input
                type="text"
                id="conditionDescription"
                name="conditionDescription"
                value={inputs.conditionDescription}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className={Styles.formRow}>
            <div className={Styles.formGroup}>
              <label style={getLabelStyle("listedPrice")} htmlFor="listedPrice">
                LISTED PRICE
              </label>
              <input
                type="number"
                id="listedPrice"
                name="listedPrice"
                value={inputs.listedPrice}
                onChange={handleChange}
              />
            </div>
            <div className={Styles.formGroup}>
              <label
                style={getLabelStyle("acceptOfferHigh")}
                htmlFor="acceptOfferHigh"
              >
                ACCEPT OFFER HIGH
              </label>
              <input
                type="number"
                id="acceptOfferHigh"
                name="acceptOfferHigh"
                value={inputs.acceptOfferHigh}
                onChange={handleChange}
              />
            </div>
            <div className={Styles.formGroup}>
              <label
                style={getLabelStyle("declineOfferLow")}
                htmlFor="declineOfferLow"
              >
                DECLINE OFFER LOW
              </label>
              <input
                type="number"
                id="declineOfferLow"
                name="declineOfferLow"
                value={inputs.declineOfferLow}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className={Styles.formRow}>
            <div className={Styles.formGroup}>
              <label
                style={getLabelStyle("shippingService")}
                htmlFor="shippingService"
              >
                SHIPPING SERVICE
              </label>
              <select
                type="text"
                id="shippingService"
                name="shippingService"
                value={inputs.shippingService}
                onChange={handleChange}
              >
                <option value="" disabled>
                  Select a service
                </option>
                <option value="USPSPriority">USPSPriority</option>
                <option value="USPSGroundAdvantage">USPSGroundAdvantage</option>
                <option value="UPSGround">UPSGround</option>
              </select>
            </div>
            <div className={Styles.formGroup}>
              <label style={getLabelStyle("brand")} htmlFor="brand">
                BRAND
              </label>
              <input
                type="text"
                id="brand"
                name="brand"
                value={inputs.brand}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className={Styles.formRow}>
            <div className={Styles.formGroup}>
              <label style={getLabelStyle("description")} htmlFor="description">
               ITEM DESCRIPTION
              </label>
              <textarea
                id="description"
                name="description"
                value={inputs.description}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className={Styles.buttonGroup}>
            <button type="button" onClick={onClose}>
              Cancel
            </button>
            <button type="submit">Save Changes</button>
          </div>
        </form>
      </div>
    </div>
  )
}

function convertDateFormat(dateString) {
  const [month, day, year] = dateString.split("/") // Split the input string
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2,"0")}` // Format as YYYY-MM-DD
}
function convertBackDateFormat(dateString) {
  const [year, month, day] = dateString.split("-") // Split the input string
  return `${parseInt(month)}/${parseInt(day)}/${year}` // Format as M/D/YYYY, removing leading zeros
}

export default EditItemModal
