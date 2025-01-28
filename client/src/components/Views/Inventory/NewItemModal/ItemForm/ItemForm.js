import React, { useState } from "react"
import { Modal, Form, Button, Col } from "react-bootstrap"
import DatePicker from "react-datepicker"
import categories from "../../../../../lib/ebayCategoryInfo"
import Styles from "./ItemForm.module.scss"

import "react-datepicker/dist/react-datepicker.css"

const ItemForm = (props) => {
  const { items, toggleModal, setAndToggleForm, nextSku } = props
  const existingPartNumbers = items.map((item) => item.partNo.trim())
  const sourcingLocations = [
    "OGDEN TAP",
    "OGDEN PAP",
    "SLC TAP",
    "SLC PNP",
    "SLC PNS",
    "OREM PAP",
    "SPRINGVILLE PNS",
    "EBAY",
  ]
  const tempDate = localStorage.getItem("tempDate") || false
  const tempCategory = +localStorage.getItem("tempCategoryId") || false
  const [purchaseDate, changePurchaseDate] = useState(
    tempDate ? new Date(tempDate) : new Date()
  )

  const sortedCategories = [...categories].sort((a, b) => {
    if (a.id === tempCategory) {
      return -1
    } else if (b.id === tempCategory) {
      return 1
    } else {
      return a.category.localeCompare(b.category)
    }
  })

  const [inputForm, setInput] = useState({
    partNo: "",
    sku: nextSku,
    datePurchased: "",
    purchasePrice: localStorage.getItem("tempPurchasePrice") || "",
    purchaseLocation: localStorage.getItem("tempLocation") || "",
    categoryId: sortedCategories[0].id,
    additionalCosts: [],
    suggestedPartNums: [],
    suggestedLocations: [],
  })

  const categoryOptions = sortedCategories.map((x) => {
    return (
      <option key={x.id} value={x.id}>
        {x.category}
      </option>
    )
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    let suggestedPartNums = []
    let suggestedLocations = []
    if (name === "partNo" && value != "") {
      suggestedPartNums = [
        ...new Set(
          existingPartNumbers.filter(
            (partNo) =>
              partNo.length > 0 &&
              partNo.toLowerCase().startsWith(value.toLowerCase())
          )
        ),
      ]
    }
    if (name === "purchaseLocation") {
      suggestedLocations = [
        ...new Set(
          sourcingLocations.filter((location) =>
            value === ""
              ? location
              : location.toLowerCase().startsWith(value.toLowerCase())
          )
        ),
      ]
    }
    setInput({
      ...inputForm,
      suggestedPartNums,
      suggestedLocations,
      [name]: value.toUpperCase().trimStart(),
    })
  }

  const handleCategorySelect = (e) => {
    setInput({
      ...inputForm,
      categoryId: e.target.value,
    })
  }

  const handleSuggestedPartNoClick = (suggestion) => {
    // Set the input value to the clicked suggestion
    setInput((prevForm) => {
      return { ...prevForm, partNo: suggestion, suggestedPartNums: [] }
    })
  }
  const handleSuggestedLocationClick = (suggestion) => {
    // Set the input value to the clicked suggestion
    setInput((prevForm) => {
      return {
        ...prevForm,
        purchaseLocation: suggestion,
        suggestedLocations: [],
      }
    })
  }

  function moveToNext(e) {
    e.preventDefault()
    const partNumberElement = document.querySelector("input[name='partNo']")
    partNumberElement.select()
    document.execCommand("copy")
    let form = { ...inputForm }
    form.datePurchased = purchaseDate.toLocaleDateString()
    setTempData(form)
    setAndToggleForm(form)
  }

  function setTempData(form) {
    localStorage.setItem("tempDate", form.datePurchased)
    localStorage.setItem("tempLocation", form.purchaseLocation)
    localStorage.setItem("tempCategoryId", form.categoryId)
    localStorage.setItem("tempPurchasePrice", form.purchasePrice)
  }

  return (
    <Form onSubmit={moveToNext}>
      <Form.Row>
        <Form.Group as={Col} controlId="formGridPartNo">
          <Form.Label>Part No</Form.Label>
          <Form.Control
            value={inputForm.partNo}
            name="partNo"
            onChange={handleChange}
            onBlur={() =>
              setInput((prevForm) => ({ ...prevForm, suggestedPartNums: [] }))
            }
            autoComplete="off" // Ensure browser autocomplete is turned off
            placeholder=""
            autoFocus
          />
          {inputForm.suggestedPartNums.length > 0 && (
            <ul className={Styles["suggestions-list"]}>
              {inputForm.suggestedPartNums.map((suggestion, index) => (
                <li
                  key={index}
                  onMouseDown={() => handleSuggestedPartNoClick(suggestion)}
                >
                  {suggestion}
                </li>
              ))}
            </ul>
          )}
        </Form.Group>

        <Form.Group as={Col} controlId="formGridSku">
          <Form.Label>SKU</Form.Label>
          <Form.Control
            value={inputForm.sku}
            name="sku"
            onChange={handleChange}
            placeholder="Stock number"
          />
        </Form.Group>
      </Form.Row>

      <Form.Row>
        <Form.Group as={Col} controlId="formGridPurchaseLocation">
          <Form.Label>Purchase Location</Form.Label>
          <Form.Control
            value={inputForm.purchaseLocation}
            name="purchaseLocation"
            required
            onChange={handleChange}
            onBlur={() =>
              setInput((prevForm) => ({ ...prevForm, suggestedLocations: [] }))
            }
            autoComplete="off" // Ensure browser autocomplete is turned off
            placeholder=""
          />
          {inputForm.suggestedLocations.length > 0 && (
            <ul className={Styles["suggestions-list"]}>
              {inputForm.suggestedLocations.map((suggestion, index) => (
                <li
                  key={index}
                  onMouseDown={() => handleSuggestedLocationClick(suggestion)}
                >
                  {suggestion}
                </li>
              ))}
            </ul>
          )}
        </Form.Group>
      </Form.Row>

      <Form.Row>
        <Form.Group as={Col} controlId="formGridDatePurchased">
          <Form.Label>Date Purchased</Form.Label>
          <DatePicker
            selected={purchaseDate}
            onChange={(date) => changePurchaseDate(date)}
          />
        </Form.Group>

        <Form.Group as={Col} controlId="formGridPurchasePrice">
          <Form.Label>Purchase Price</Form.Label>
          <Form.Control
            value={inputForm.purchasePrice}
            name="purchasePrice"
            onChange={handleChange}
            required
            placeholder="$0.00"
          />
        </Form.Group>
      </Form.Row>

      <Form.Label>Category</Form.Label>
      <Form.Row>
        <Form.Group md={8} as={Col} controlId="formGridConditionId">
          <Form.Control
            as="select"
            name="conditionId"
            onChange={handleCategorySelect}
            value={
              categories.some((category) => category.id == inputForm.categoryId)
                ? inputForm.categoryId
                : ""
            }
          >
            {[
              <option value="" disabled>
                Select a Category
              </option>,
              ...categoryOptions,
            ]}
          </Form.Control>
        </Form.Group>

        <Form.Group md={4} as={Col} controlId="formGridCategoryId">
          <Form.Control
            required
            value={inputForm.categoryId}
            name="categoryId"
            onChange={handleChange}
            placeholder="Category ID"
          />
        </Form.Group>
      </Form.Row>

      <Modal.Footer>
        <Button onClick={() => toggleModal(false)} variant="secondary">
          Close
        </Button>
        <Button type="submit" variant="primary">
          {"Next\t>"}
        </Button>
      </Modal.Footer>
    </Form>
  )
}

export default ItemForm
