import React, { useState, useEffect } from "react";
import Styles from "./Expense.module.scss";
import ExpenseTable from "./ExpenseTable/ExpenseTable"
import Toolbar from "./ToolBar/Toolbar";
import NewExpenseModal from "./NewExpenseModal/NewExpenseModal"

const Expense = (props) => {
    const {submitNewExpense, deleteExpense} = props;
    const [searchTerm, changeSearchTerm] = useState("");
    const [modalOpen, toggleModal] = useState(false);
    const [expenses, changeExpenses] = useState(props.expenses);
    const [itemsToShow, filterItems] = useState([]);

    useEffect(() => {
        if (searchTerm === "") {
            filterItems(expenses)
        } else {
            filterItems(expenses.filter(x => {
                const { title, amount, date, category } = x;
                const conditionsArray = [title, amount, date, category];
                return conditionsArray.some(j => String(j).toLowerCase().includes(searchTerm.toLowerCase()));
            }))
        }
    }, [searchTerm, expenses]);


    return (
        <div className={Styles.wrapper}>
            <div className={Styles.pageHeader}>
                <h1>Expense Management</h1>
                <p>Track and manage your business expenses</p>
            </div>
            <Toolbar {...{ searchTerm, changeSearchTerm, toggleModal }} />
            <ExpenseTable expenses={itemsToShow} deleteExpense={deleteExpense}/>
            {modalOpen && <NewExpenseModal {...{toggleModal, submitNewExpense}} />}
        </div>
    );
}

export default Expense;