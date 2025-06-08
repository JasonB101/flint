import React from "react";
import { Modal} from "react-bootstrap"
import ExpenseForm from "./ExpenseForm/ExpenseForm"
import Styles from "./NewExpenseModal.module.scss";

const NewItemModal = (props) => {
    const {toggleModal, submitNewExpense} = props;
    return (
        <div className={Styles.modalWrapper}>
            <Modal.Dialog>
                <Modal.Header>
                    <Modal.Title>Add New Expense</Modal.Title>
                </Modal.Header>

                <Modal.Body>
                    <ExpenseForm {...{toggleModal, submitNewExpense}}/>
                </Modal.Body>

            </Modal.Dialog>
        </div>
    );
}

export default NewItemModal;