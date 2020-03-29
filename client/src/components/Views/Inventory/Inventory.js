import React, { useContext, useState } from "react";
import Styles from "./Inventory.module.scss";
import InventoryTable from "./InventoryTable/InventoryTable"
import NewItemModal from "./NewItemModal/NewItemModal"
import Toolbar from "./Toolbar/Toolbar"
import { storeContext } from "../../../Store"

const Inventory = (props) => {
    const storeData = useContext(storeContext);
    const { items } = storeData;
    const [itemsToShow, filterItems] = useState(items)
    const [showNewItemModal, toggleNewItemModal] = useState(false)
    return (
        <div className={Styles.wrapper}>
            <Toolbar items={items} filterItems={filterItems} toggleModal={toggleNewItemModal}/>
            <InventoryTable items={itemsToShow} />
            {showNewItemModal && <NewItemModal toggleModal={toggleNewItemModal} />}
        </div>
    );
}

export default Inventory;