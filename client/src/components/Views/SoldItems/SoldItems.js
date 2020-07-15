import React, { useEffect, useState } from "react";
import Styles from "./SoldItems.module.scss";
import SoldTable from "./SoldTable/SoldTable";
import Toolbar from "./Toolbar/Toolbar"

const SoldItems = (props) => {
    
    const [soldItemsSearchTerm, changeSearchTerm] = useState("");
    const soldItems = props.items.filter(x => x.sold === true);
    const [itemsToShow, filterItems] = useState(soldItems);

    useEffect(() => {
        if (soldItemsSearchTerm === "") {
            filterItems(soldItems)
        } else {
            filterItems(soldItems.filter(x => {
                const { title = "n/a", partNo = "n/a", sku = "n/a", buyer: {username} = "Unknown" } = x;
                const conditionsArray = [title, partNo, sku, username];
                conditionsArray.forEach((x, i) => x ? null : console.log(i))
                return conditionsArray.some(j => j.toLowerCase().includes(soldItemsSearchTerm.toLowerCase()));
            }))
        }
    }, [soldItemsSearchTerm, soldItems])
    

    return (
        <div className={Styles.wrapper}>
            <Toolbar changeSearchTerm={changeSearchTerm}
                searchTerm={soldItemsSearchTerm} />
            <SoldTable soldItems={itemsToShow} />
        </div>
    );
}

export default SoldItems;