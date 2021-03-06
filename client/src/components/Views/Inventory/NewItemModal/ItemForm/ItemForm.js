import React, { useState } from "react";
import { Modal, Form, Button, Col } from "react-bootstrap";
import DatePicker from "react-datepicker";
import getEbayCategoryId from "../../../../../lib/getEbayCategoryId"

import "react-datepicker/dist/react-datepicker.css";

const ItemForm = (props) => {
  const { toggleModal, setAndToggleForm, nextSku } = props;
  const [purchaseDate, changePurchaseDate] = useState(new Date())
  const [inputForm, setInput] = useState({
    partNo: "",
    sku: nextSku,
    datePurchased: "",
    purchasePrice: "",
    purchaseLocation: "",
    categoryId: 33596
  })

  const handleChange = (e) => {
    setInput({
      ...inputForm,
      [e.target.name]: e.target.value
    })
  }

  const handleCategorySelect = (e) => {
    setInput({
      ...inputForm,
      categoryId: getEbayCategoryId(e.target.value)
    });
  }
  

  function moveToNext(e) {
    e.preventDefault();
    const partNumberElement = document.querySelector("input[name='partNo']");
    partNumberElement.select();
    console.log(partNumberElement)
    document.execCommand('copy');
    let form = { ...inputForm };
    form.datePurchased = purchaseDate.toLocaleDateString();
    setAndToggleForm(form)
  }

  return (
    <Form onSubmit={moveToNext}>
      <Form.Row>
        <Form.Group as={Col} controlId="formGridPartNo">
          <Form.Label>Part No</Form.Label>
          <Form.Control value={inputForm.partNo} name="partNo" onChange={handleChange} placeholder="" />
        </Form.Group>

        <Form.Group as={Col} controlId="formGridSku">
          <Form.Label>SKU</Form.Label>
          <Form.Control value={inputForm.sku} name="sku" onChange={handleChange} placeholder="Stock number" />
        </Form.Group>
      </Form.Row>

      <Form.Row>
        <Form.Group as={Col} controlId="formGridPurchaseLocation">
          <Form.Label>Purchase Location</Form.Label>
          <Form.Control value={inputForm.purchaseLocation} name="purchaseLocation" required onChange={handleChange} placeholder="" />
        </Form.Group>
      </Form.Row>

      <Form.Row>
        <Form.Group as={Col} controlId="formGridDatePurchased">
          <Form.Label>Date Purchased</Form.Label>
          <DatePicker selected={purchaseDate} onChange={(date) => changePurchaseDate(date)} />
        </Form.Group>

        <Form.Group as={Col} controlId="formGridPurchasePrice">
          <Form.Label>Purchase Price</Form.Label>
          <Form.Control value={inputForm.purchasePrice} name="purchasePrice" onChange={handleChange} required placeholder="$0.00" />
        </Form.Group>
      </Form.Row>
      
      <Form.Row>
        <Form.Group md={8} as={Col} controlId="formGridConditionId">
          <Form.Control as="select" name="conditionId" onChange={handleCategorySelect}>
            <option>Engine Computer ECU</option>
            <option>Computer Chip (Other)</option>
            <option>Head Light</option>
            <option>Tail Light</option>
            <option>Climate Control</option>
            <option>Interior Part (Other)</option>
            <option>Exterior Mirror</option>
            <option>Interior Mirror</option>
            <option>Dash Parts</option>
            <option>Switches</option>
            <option>Exterior Moulding</option>
          </Form.Control>
        </Form.Group>
        <Form.Group md={4} as={Col} controlId="formGridCategoryId">
          <Form.Control required value={inputForm.categoryId} name="categoryId" onChange={handleChange} placeholder="Category ID" />
        </Form.Group>
      </Form.Row>

      <Modal.Footer>
        <Button onClick={() => toggleModal(false)} variant="secondary">Close</Button>
        <Button type="submit" variant="primary">{"Next\t>"}</Button>
      </Modal.Footer>
    </Form>

  );
}

export default ItemForm;