import React, { useState, useEffect } from "react";
import Styles from "./Inventory.module.scss";
import InventoryTable from "./InventoryTable/InventoryTable"
import NewItemModal from "./NewItemModal/NewItemModal";
import LinkItemModal from "./InventoryTable/LinkItemModal/LinkItemModal";
import Toolbar from "./Toolbar/Toolbar"

const Inventory = (props) => {
    
    const { items, submitNewItem, newListings, linkItem } = props;
    const inventoryList = items.filter(x => x.status === "active");
    const [itemsToShow, filterItems] = useState(inventoryList);
    const [showNewItemModal, toggleNewItemModal] = useState(false);

    // After this inventoryId is cleared, the link Modal will close.
    const [inventoryId, setInventoryId] = useState("");

    const [inventorySearchTerm, changeSearchTerm] = useState("");

    function openLinkModal(id) {
        setInventoryId(id);
    }

    useEffect(() => {
        if (inventorySearchTerm === "") {
            filterItems(inventoryList)
        } else {
            filterItems(inventoryList.filter(x => {
                const { item, partNo, sku } = x;
                const conditionsArray = [item, partNo, sku];
                return conditionsArray.some(j => j.toLowerCase().includes(inventorySearchTerm.toLowerCase()));
            }))
        }


    }, [inventorySearchTerm, inventoryList]);
    return (
        <div className={Styles.wrapper}>
            <Toolbar changeSearchTerm={changeSearchTerm}
                searchTerm={inventorySearchTerm}
                toggleModal={toggleNewItemModal} />
            <InventoryTable openLinkModal={openLinkModal} inventoryList={itemsToShow} />
            {inventoryId && <LinkItemModal inventoryId={inventoryId}
                linkItem={linkItem}
                newListings={newListings}
                setInventoryId={setInventoryId} />}
            {showNewItemModal && <NewItemModal submitNewItem={submitNewItem} toggleModal={toggleNewItemModal} />}
        </div>
    );
}


export default Inventory;