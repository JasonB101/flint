import React from "react";
import { Modal } from "react-bootstrap";
import Styles from "./LinkItemModal.module.scss";

const LinkItemModal = (props) => {
    const { inventoryId, linkItem, setInventoryId, newListings} = props;
    
    //inventoryId is {id: ###, sku: ###}

    function handleClick(inventoryId, listingInfo){
        linkItem(inventoryId.id, listingInfo)
    }

    var currencyFormatter = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
      });
    const sortedListings = newListings.sort((a, b) => a.SKU == inventoryId.sku ? -1 : b.SKU == inventoryId.sku ? 1 : 0)
    const listings = sortedListings.map(ebayObject => {
        const { BuyItNowPrice, SKU, ItemID, Title, PictureDetails: { GalleryURL } } = ebayObject
        return (<div onClick={() => handleClick(inventoryId, ebayObject)} key={ItemID} className={Styles.ebayItemWrapper}>
            <img src={GalleryURL} alt="Ebay Item" />
            <div className={Styles.detailsWrapper}>
                <p key={ItemID}>{Title}</p>
                <p>SKU: <span>{SKU || ""}</span></p>
                <p>Listed For: <span>{currencyFormatter.format(BuyItNowPrice)}</span></p>
            </div>
        </div>)
    })

    return (
        <div id="outsidePartentDiv" className={Styles.modalWrapper} onClick={(e) => {

            if (e.target.id === "outsidePartentDiv"){
                setInventoryId("");
            }
            }}>
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
