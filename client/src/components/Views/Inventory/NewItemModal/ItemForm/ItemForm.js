import React, { useState } from "react";
import Styles from "./ItemForm.module.scss";
import { Modal, Form, Button, Col } from "react-bootstrap";
import DatePicker from "react-datepicker";

import "react-datepicker/dist/react-datepicker.css";

const ItemForm = (props) => {
  const {toggleModal} = props;
  const [purchaseDate, changePurchaseDate] = useState(new Date())
  function saveChanges() {
        toggleModal(false)
  }
  return (
      <Form onSubmit={saveChanges}>
        <Form.Row>
          <Form.Group as={Col} controlId="formGridItemName">
            <Form.Label>Item Name</Form.Label>
            <Form.Control required placeholder="" />
          </Form.Group>

          <Form.Group as={Col} controlId="formGridPartNo">
            <Form.Label>Part No</Form.Label>
            <Form.Control required placeholder="" />
          </Form.Group>
        </Form.Row>

        <Form.Row>
          <Form.Group as={Col} controlId="formGridSku">
            <Form.Label>SKU</Form.Label>
            <Form.Control required placeholder="Stock number" />
          </Form.Group>

          <Form.Group as={Col} controlId="formGridLocation">
            <Form.Label>Location</Form.Label>
            <Form.Control required placeholder="Section A, Shelf 1" />
          </Form.Group>
        </Form.Row>

        <Form.Row>
          <Form.Group as={Col} controlId="formGridDatePurchased">
            <Form.Label>Date Purchased</Form.Label>
            <DatePicker selected={purchaseDate} onChange={(date) => changePurchaseDate(date)} />
          </Form.Group>

          <Form.Group as={Col} controlId="formGridPurchasePrice">
            <Form.Label>Purchase Price</Form.Label>
            <Form.Control required placeholder="$0.00" />
          </Form.Group>
        </Form.Row>
        

        <Modal.Footer>
          <Button onClick={() => toggleModal(false)} variant="secondary">Close</Button>
          <Button type="submit" variant="primary">Save changes</Button>
        </Modal.Footer>
      </Form>
   
  );
}

export default ItemForm;