import React, { useState } from "react";
import { Modal, Form, Button, Col } from "react-bootstrap";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const ExpenseForm = (props) => {
    const { toggleModal, submitNewExpense } = props;
    const [purchaseDate, changePurchaseDate] = useState(new Date())
    const [inputForm, setInput] = useState({
        title: "",
        date: purchaseDate,
        amount: 0
    })

    const handleChange = (e) => {
        setInput({
            ...inputForm,
            [e.target.name]: e.target.value
        })
    }

    function saveChanges(e) {
        let form = inputForm;
        form.date = purchaseDate.toLocaleDateString();
        submitNewExpense(form)
        toggleModal(false)
    }

    return (
        <Form onSubmit={saveChanges}>
            <Form.Row>
                <Form.Group as={Col} controlId="formGridExpenseTitle">
                    <Form.Label>Expense Title</Form.Label>
                    <Form.Control value={inputForm.title} name="title" onChange={(e) => handleChange(e)} required placeholder="" autoFocus/>
                </Form.Group>
            </Form.Row>

            <Form.Row>
                <Form.Group as={Col} controlId="formGridExpenseAmount">
                    <Form.Label>Expense Amount</Form.Label>
                    <Form.Control value={inputForm.amount} name="amount" onChange={handleChange} required placeholder="$0.00" />
                </Form.Group>

                <Form.Group as={Col} controlId="formGridDatePurchased">
                    <Form.Label>Date of Expense</Form.Label>
                    <DatePicker selected={purchaseDate} onChange={(date) => changePurchaseDate(date)} />
                </Form.Group>
            </Form.Row>


            <Modal.Footer>
                <Button onClick={() => toggleModal(false)} variant="secondary">Close</Button>
                <Button type="submit" variant="primary">Save changes</Button>
            </Modal.Footer>
        </Form>

    );
}

export default ExpenseForm;