import React from "react";
import { Modal } from "react-bootstrap";
import Styles from "./LinkItemModal.module.scss";

const LinkItemModal = (props) => {
    const { inventoryId, linkItem, toggleModal, newListings } = props;
    
    var currencyFormatter = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
      });

    const listings = newListings.map(x => {
        const { BuyItNowPrice, ItemID, Title, PictureDetails: { GalleryURL } } = x
        return (<div key={ItemID} className={Styles.ebayItemWrapper}>
            <img src={GalleryURL} alt="Ebay Item" />
            <div className={Styles.detailsWrapper}>
                <p key={ItemID}>{Title}</p>
                <p>Listed For: <span>{currencyFormatter.format(BuyItNowPrice)}</span></p>
            </div>
        </div>)
    })
    return (
        <div className={Styles.modalWrapper}>
            <Modal.Dialog>
                <Modal.Header>
                    <Modal.Title>Link with...</Modal.Title>
                </Modal.Header>

                <Modal.Body>
                    <div className={Styles.ebayListingsWrapper}>
                        {listings}
                    </div>
                </Modal.Body>

            </Modal.Dialog>
        </div>
    );
}

export default LinkItemModal;
