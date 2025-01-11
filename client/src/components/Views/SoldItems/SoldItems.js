import React, { useEffect, useState } from "react";
import Styles from "./SoldItems.module.scss";
import SoldTable from "./SoldTable/SoldTable";
import Toolbar from "./Toolbar/Toolbar"

const SoldItems = (props) => {
    const { updateItem, items } = props
    const [soldItemsSearchTerm, changeSearchTerm] = useState("");
    const [soldItems] = useState(items.filter(x => x.sold === true));
    const [itemsToShow, filterItems] = useState(soldItems);

    useEffect(() => {
        console.log("useEffect")
        if (soldItemsSearchTerm === "") {
            filterItems(soldItems)
        } else {
            filterItems(soldItems.filter(x => {
                const { title, partNo, sku, buyer } = x;
                const username = buyer ? buyer : "Unknown";
                const conditionsArray = [title, partNo, sku, username];
                return conditionsArray.some(j => j ? j.toLowerCase().includes(soldItemsSearchTerm.toLowerCase()) : false);
            }))
        }
    }, [soldItemsSearchTerm, soldItems])


    return (
        <div className={Styles.wrapper}>
            <Toolbar changeSearchTerm={changeSearchTerm}
                searchTerm={soldItemsSearchTerm} items={soldItems} />
            <SoldTable updateItem={updateItem} soldItems={itemsToShow} />
        </div>
    );
}

export default SoldItems;