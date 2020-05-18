import React, { useState } from "react";
import { Modal, Form, Button, Col } from "react-bootstrap";
import DatePicker from "react-datepicker";

import "react-datepicker/dist/react-datepicker.css";

const ItemForm = (props) => {
  const { toggleModal, setAndToggleForm, nextSku } = props;
  const [purchaseDate, changePurchaseDate] = useState(new Date())
  const [inputForm, setInput] = useState({
    partNo: "",
    sku: nextSku,
    location: "",
    datePurchased: "",
    purchasePrice: "",
    purchaseLocation: ""
  })

  const handleChange = (e) => {
    setInput({
      ...inputForm,
      [e.target.name]: isNaN(+e.target.value) ? e.target.value : +e.target.value
    })
  }

  function moveToNext() {
    let form = {...inputForm};
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
        <Form.Group as={Col} controlId="formGridLocation">
          <Form.Label>Location</Form.Label>
          <Form.Control value={inputForm.location} name="location" onChange={handleChange} placeholder="Section A, Shelf 1" />
        </Form.Group>
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

      <Modal.Footer>
        <Button onClick={() => toggleModal(false)} variant="secondary">Close</Button>
        <Button type="submit" variant="primary">{"Next\t>"}</Button>
      </Modal.Footer>
    </Form>

  );
}

export default ItemForm;