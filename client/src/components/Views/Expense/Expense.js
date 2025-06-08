import React, { useState, useEffect } from "react";
import Styles from "./Expense.module.scss";
import ExpenseTable from "./ExpenseTable/ExpenseTable"
import Toolbar from "./ToolBar/Toolbar";
import NewExpenseModal from "./NewExpenseModal/NewExpenseModal"

const Expense = (props) => {
    const {submitNewExpense, deleteExpense, updateExpense} = props;
    const [searchTerm, changeSearchTerm] = useState("");
    const [modalOpen, toggleModal] = useState(false);
    const [editModalOpen, toggleEditModal] = useState(false);
    const [editingExpense, setEditingExpense] = useState(null);
    const [expenses, changeExpenses] = useState(props.expenses);
    const [itemsToShow, filterItems] = useState([]);

    // Sync local expenses state with props.expenses when it changes
    useEffect(() => {
        changeExpenses(props.expenses);
    }, [props.expenses]);

    useEffect(() => {
        // First sort expenses by date (newest first)
        const sortedExpenses = [...expenses].sort((a, b) => {
            const dateA = new Date(a.date);
            const dateB = new Date(b.date);
            return dateB - dateA; // Newest first
        });

        if (searchTerm === "") {
            filterItems(sortedExpenses)
        } else {
            filterItems(sortedExpenses.filter(x => {
                const { title, amount, date, category } = x;
                const conditionsArray = [title, amount, date, category];
                return conditionsArray.some(j => String(j).toLowerCase().includes(searchTerm.toLowerCase()));
            }))
        }
    }, [searchTerm, expenses]);

    const handleEditExpense = (expense) => {
        setEditingExpense(expense);
        toggleEditModal(true);
    };

    const handleUpdateExpense = (updatedExpense) => {
        if (updateExpense) {
            updateExpense(updatedExpense);
        }
        toggleEditModal(false);
        setEditingExpense(null);
    };

    return (
        <div className={Styles.wrapper}>
            <div className={Styles.pageHeader}>
                <h1>Expense Management</h1>
                <p>Track and manage your business expenses</p>
            </div>
            <Toolbar {...{ searchTerm, changeSearchTerm, toggleModal }} />
            <ExpenseTable 
                expenses={itemsToShow} 
                deleteExpense={deleteExpense}
                onEditExpense={handleEditExpense}
            />
            {modalOpen && <NewExpenseModal {...{toggleModal, submitNewExpense}} />}
            {editModalOpen && editingExpense && (
                <NewExpenseModal 
                    toggleModal={toggleEditModal}
                    submitNewExpense={handleUpdateExpense}
                    editingExpense={editingExpense}
                    isEditing={true}
                />
            )}
        </div>
    );
}

export default Expense;