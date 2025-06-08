import React, { useState, useEffect } from "react";
import { Modal, Form, Button, Col } from "react-bootstrap";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const ExpenseForm = (props) => {
    const { toggleModal, submitNewExpense, editingExpense, isEditing } = props;
    
    // Initialize date based on editing mode
    const initialDate = isEditing && editingExpense?.date 
        ? new Date(editingExpense.date) 
        : new Date();
    
    const [purchaseDate, changePurchaseDate] = useState(initialDate);
    
    // Get saved category from localStorage or use editing expense category or default to 'Other'
    const savedCategory = isEditing && editingExpense?.category 
        ? editingExpense.category 
        : localStorage.getItem('lastExpenseCategory') || 'Other';
    
    const [inputForm, setInput] = useState({
        title: isEditing && editingExpense?.title ? editingExpense.title : "",
        date: initialDate,
        amount: isEditing && editingExpense?.amount ? editingExpense.amount : 0,
        category: savedCategory
    });

    const categories = [
        'Clothing', 'Core', 'Environmental', 'Equipment', 'Food', 'Legal', 
        'Shipping', 'Software', 'Taxes', 'Travel', 'Waste', 'Other'
    ];

    // Auto-fill description based on category selection (only for new expenses)
    useEffect(() => {
        if (!isEditing) {
            if (inputForm.category === 'Environmental') {
                setInput(prev => ({ ...prev, title: "Enviro Charge" }));
            } else if (inputForm.category === 'Taxes') {
                setInput(prev => ({ ...prev, title: "Sales Tax" }));
            } else if (inputForm.category === 'Travel') {
                setInput(prev => ({ ...prev, title: "Gas" }));
            }
        }
    }, [inputForm.category, isEditing]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        
        // Save category to localStorage when changed (only for new expenses)
        if (name === 'category' && !isEditing) {
            localStorage.setItem('lastExpenseCategory', value);
        }
        
        setInput({
            ...inputForm,
            [name]: value
        })
    }

    function saveChanges(e) {
        e.preventDefault();
        let form = { ...inputForm };
        form.date = purchaseDate.toLocaleDateString();
        
        // If editing, include the expense ID for the update operation
        if (isEditing && editingExpense?._id) {
            form._id = editingExpense._id;
        }
        
        // submitNewExpense will either add new expense or update existing one
        // depending on how it was passed from the parent component
        submitNewExpense(form);
        toggleModal(false);
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
                <Button type="submit" variant="primary">
                    {isEditing ? 'Update Expense' : 'Add Expense'}
                </Button>
            </Modal.Footer>
        </Form>
    );
}

export default ExpenseForm;