import React, { useContext, useState, useEffect } from "react";
import Styles from "./Inventory.module.scss";
import InventoryTable from "./InventoryTable/InventoryTable"
import NewItemModal from "./NewItemModal/NewItemModal";
import LinkItemModal from "./InventoryTable/LinkItemModal/LinkItemModal";
import Toolbar from "./Toolbar/Toolbar"
import { storeContext } from "../../../Store"

const Inventory = (props) => {
    const storeData = useContext(storeContext);
    const { items, submitNewItem, newListings, linkItem } = storeData;
    const [itemsToShow, filterItems] = useState(items);
    const [showNewItemModal, toggleNewItemModal] = useState(false);

    // After this inventoryId is cleared, the link Modal will close.
    const [inventoryId, setInventoryId] = useState("");

    const [inventorySearchTerm, changeSearchTerm] = useState("");

    function openLinkModal(id) {
        setInventoryId(id);
    }

    useEffect(() => {
        if (inventorySearchTerm === "") {
            filterItems(items)
        } else {
            filterItems(items.filter(x => {
                const { item, partNo, sku } = x;
                const conditionsArray = [item, partNo, sku];
                return conditionsArray.some(j => j.toLowerCase().includes(inventorySearchTerm.toLowerCase()));
            }))
        }


    }, [inventorySearchTerm, items]);
    return (
        <div className={Styles.wrapper}>
            <Toolbar changeSearchTerm={changeSearchTerm}
                searchTerm={inventorySearchTerm}
                toggleModal={toggleNewItemModal} />
            <InventoryTable openLinkModal={openLinkModal} items={itemsToShow} />
            {inventoryId && <LinkItemModal inventoryId={inventoryId}
                linkItem={linkItem}
                newListings={newListings}
                setInventoryId={setInventoryId} />}
            {showNewItemModal && <NewItemModal submitNewItem={submitNewItem} toggleModal={toggleNewItemModal} />}
        </div>
    );
}


export default Inventory;