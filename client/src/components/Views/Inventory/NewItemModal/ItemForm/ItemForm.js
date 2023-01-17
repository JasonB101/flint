import React, { useState } from "react";
import { Modal, Form, Button, Col } from "react-bootstrap";
import DatePicker from "react-datepicker";
import getEbayCategoryId from "../../../../../lib/getEbayCategoryId"

import "react-datepicker/dist/react-datepicker.css";

const ItemForm = (props) => {
  const { toggleModal, setAndToggleForm, nextSku } = props;
  const tempDate = localStorage.getItem("tempDate") || false
  const [purchaseDate, changePurchaseDate] = useState(tempDate ? new Date(tempDate) : new Date())
  const [inputForm, setInput] = useState({
    partNo: "",
    sku: nextSku,
    datePurchased:  "",
    purchasePrice: "",
    purchaseLocation: localStorage.getItem("tempLocation") || "",
    categoryId: 33596
  })

  const handleChange = (e) => {
    setInput({
      ...inputForm,
      [e.target.name]: e.target.value.toUpperCase()
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
    document.execCommand('copy');
    let form = { ...inputForm };
    form.datePurchased = purchaseDate.toLocaleDateString();
    setTempData(form)
    setAndToggleForm(form)
  }

  function setTempData(form) {
    if (tempDate !== form.datePurchased || localStorage.getItem("tempLocation") !== form.purchaseLocation) {
      localStorage.setItem("tempDate", form.datePurchased);
      localStorage.setItem("tempLocation", form.purchaseLocation)
    }
  }

  return (
    <Form onSubmit={moveToNext}>
      <Form.Row>
        <Form.Group as={Col} controlId="formGridPartNo">
          <Form.Label>Part No</Form.Label>
          <Form.Control value={inputForm.partNo} name="partNo" onChange={handleChange} placeholder="" autoFocus/>
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
            <option>Engine Coolant Components</option>
            <option>Computer Chip (Other)</option>
            <option>Cup Holders</option>
            <option>Head Light</option>
            <option>Headrests</option>
            <option>Tail Light</option>
            <option>Climate Control</option>
            <option>Intake Manifolds</option>
            <option>Interior Part (Other)</option>
            <option>Exterior Mirror</option>
            <option>Fuel Injection Parts Other</option>
            <option>Interior Mirror</option>
            <option>Dash Parts</option>
            <option>Radio</option>
            <option>Switches</option>
            <option>Exterior Moulding</option>
            <option>Fuse Box</option>
            <option>Wiper Motor/Transmissions Linkage</option>
            <option>Window Motor</option>
            <option>Steering & Suspension Parts</option>
            <option>Sun Visors</option>
            <option>Power Steering Pump</option>
            <option>Audio Amplifier</option>
            <option>Valve Cover</option>
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