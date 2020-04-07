import React from "react";
import { Modal} from "react-bootstrap"
import ItemForm from "./ItemForm/ItemForm"
import Styles from "./NewItemModal.module.scss";

const NewItemModal = (props) => {
    const {toggleModal, submitNewItem} = props;
    return (
        <div className={Styles.modalWrapper}>
            <Modal.Dialog>
                <Modal.Header>
                    <Modal.Title>New Item</Modal.Title>
                </Modal.Header>

                <Modal.Body>
                    <ItemForm submitNewItem={submitNewItem} toggleModal={toggleModal}/>
                </Modal.Body>

            </Modal.Dialog>
        </div>
    );
}

export default NewItemModal;