import React from "react";
import { Modal, Button } from "react-bootstrap"
import ItemForm from "./ItemForm/ItemForm"
import Styles from "./NewItemModal.module.scss";

const NewItemModal = (props) => {
    const {toggleModal} = props;
    return (
        <div className={Styles.modalWrapper}>
            <Modal.Dialog>
                <Modal.Header>
                    <Modal.Title>New Item</Modal.Title>
                </Modal.Header>

                <Modal.Body>
                    <ItemForm toggleModal={toggleModal}/>
                </Modal.Body>

            </Modal.Dialog>
        </div>
    );
}

export default NewItemModal;