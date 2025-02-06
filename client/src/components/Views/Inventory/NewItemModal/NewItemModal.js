import React, { useState } from "react"
import { Modal } from "react-bootstrap"
import ItemForm from "./ItemForm/ItemForm"
import Styles from "./NewItemModal.module.scss"
import ListingForm from "./ListingForm/ListingForm"

const NewItemModal = (props) => {
  const {
    toggleModal,
    submitNewItem,
    nextSku,
    items,
    averageShippingCost,
    getActiveListings,
    getCompatibility,
    ebayFeePercent,
  } = props
  const [newItemForm, setNewItemForm] = useState({})
  const [showItemForm, toggleForm] = useState(true)

  function setAndToggleForm(form) {
    setNewItemForm(form)
    toggleForm(false)
  }

  return (
    <div className={Styles.modalWrapper}>
      <Modal.Dialog>
        <Modal.Header>
          <Modal.Title>New Item</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <div className={Styles.formWrapper}>
            {showItemForm && (
              <ItemForm
                items={items}
                nextSku={nextSku}
                setAndToggleForm={setAndToggleForm}
                toggleModal={toggleModal}
              />
            )}
            {!showItemForm && (
              <ListingForm
                items={items}
                itemForm={newItemForm}
                toggleModal={toggleModal}
                submitNewItem={submitNewItem}
                averageShippingCost={averageShippingCost}
                ebayFeePercent={ebayFeePercent}
                getActiveListings={getActiveListings}
                getCompatibility={getCompatibility}
              />
            )}
          </div>
        </Modal.Body>
      </Modal.Dialog>
    </div>
  )
}

export default NewItemModal
