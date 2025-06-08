import React, { useState, useEffect } from "react";
import { Modal, Form, Button, Col } from "react-bootstrap";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const ExpenseForm = (props) => {
    const { toggleModal, submitNewExpense } = props;
    const [purchaseDate, changePurchaseDate] = useState(new Date())
    
    // Get saved category from localStorage or default to 'Other'
    const savedCategory = localStorage.getItem('lastExpenseCategory') || 'Other';
    
    const [inputForm, setInput] = useState({
        title: "",
        date: purchaseDate,
        amount: 0,
        category: savedCategory
    })

    const categories = [
        'Travel', 'Food', 'Shipping', 'Equipment', 'Software', 
        'Legal', 'Environmental', 'Core', 'Waste', 'Taxes', 'Other'
    ];

    // Auto-fill description based on category selection
    useEffect(() => {
        if (inputForm.category === 'Environmental' && inputForm.title === "") {
            setInput(prev => ({ ...prev, title: "Enviro Charge" }));
        } else if (inputForm.category === 'Taxes' && inputForm.title === "") {
            setInput(prev => ({ ...prev, title: "Sales Tax" }));
        }
    }, [inputForm.category]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        
        // Save category to localStorage when changed
        if (name === 'category') {
            localStorage.setItem('lastExpenseCategory', value);
        }
        
        setInput({
            ...inputForm,
            [name]: value
        })
    }

    function saveChanges(e) {
        e.preventDefault();
        let form = inputForm;
        form.date = purchaseDate.toLocaleDateString();
        submitNewExpense(form)
        toggleModal(false)
    }

    return (
        <Form onSubmit={saveChanges}>
            <Form.Row>
                <Form.Group as={Col} controlId="formGridExpenseCategory">
                    <Form.Label>Category</Form.Label>
                    <Form.Control 
                        as="select"
                        value={inputForm.category} 
                        name="category" 
                        onChange={handleChange} 
                        required
                    >
                        {categories.map(category => (
                            <option key={category} value={category}>
                                {category}
                            </option>
                        ))}
                    </Form.Control>
                </Form.Group>
            </Form.Row>

            <Form.Row>
                <Form.Group as={Col} controlId="formGridExpenseTitle">
                    <Form.Label>Expense Description</Form.Label>
                    <Form.Control 
                        value={inputForm.title} 
                        name="title" 
                        onChange={(e) => handleChange(e)} 
                        required 
                        placeholder="e.g., Office supplies, Travel, Meals..." 
                        autoFocus
                    />
                </Form.Group>
            </Form.Row>

            <Form.Row>
                <Form.Group as={Col} controlId="formGridExpenseAmount">
                    <Form.Label>Amount</Form.Label>
                    <Form.Control 
                        type="number" 
                        step="0.01" 
                        min="0"
                        value={inputForm.amount} 
                        name="amount" 
                        onChange={handleChange} 
                        required 
                        placeholder="0.00" 
                    />
                </Form.Group>

                <Form.Group as={Col} controlId="formGridDatePurchased">
                    <Form.Label>Expense Date</Form.Label>
                    <DatePicker 
                        selected={purchaseDate} 
                        onChange={(date) => changePurchaseDate(date)}
                        dateFormat="MM/dd/yyyy"
                        placeholderText="Select date..."
                    />
                </Form.Group>
            </Form.Row>

            <Modal.Footer>
                <Button onClick={() => toggleModal(false)} variant="secondary">Cancel</Button>
                <Button type="submit" variant="primary">Add Expense</Button>
            </Modal.Footer>
        </Form>
    );
}

export default ExpenseForm;