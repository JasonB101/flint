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
                const { title, amount, date } = x;
                const conditionsArray = [title, amount, date];
                return conditionsArray.some(j => String(j).toLowerCase().includes(searchTerm.toLowerCase()));
            }))
        }
    }, [searchTerm, expenses]);


    return (
        <div className={Styles.wrapper}>
            <Toolbar {...{ searchTerm, changeSearchTerm, toggleModal }} />
            <ExpenseTable expenses={itemsToShow} deleteExpense={deleteExpense}/>
            {modalOpen && <NewExpenseModal {...{toggleModal, submitNewExpense}} />}
        </div>
    );
}

export default Expense;