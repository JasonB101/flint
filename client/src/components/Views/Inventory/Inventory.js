import React, { useContext, useState, useEffect } from "react";
import Styles from "./Inventory.module.scss";
import InventoryTable from "./InventoryTable/InventoryTable"
import NewItemModal from "./NewItemModal/NewItemModal"
import Toolbar from "./Toolbar/Toolbar"
import { storeContext } from "../../../Store"

const Inventory = (props) => {
    const storeData = useContext(storeContext);
    const { items, submitNewItem } = storeData;
    const [itemsToShow, filterItems] = useState(items)
    const [showNewItemModal, toggleNewItemModal] = useState(false)
    const [inventorySearchTerm, changeSearchTerm] = useState("")

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
            <InventoryTable items={itemsToShow} />
            {showNewItemModal && <NewItemModal submitNewItem={submitNewItem} toggleModal={toggleNewItemModal} />}
        </div>
    );
}

export default Inventory;