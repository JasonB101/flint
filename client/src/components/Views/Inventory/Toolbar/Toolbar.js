import React, { useState, useEffect } from "react";
import { Button } from "react-bootstrap"
import Styles from "./Toolbar.module.scss";

const Toolbar = (props) => {
    const [searchKeyword, changeSearchKeyword] = useState("")
    const { toggleModal, items, filterItems } = props;

    useEffect(() => {
        if (searchKeyword === "") {
            filterItems(items)
        } else {
            filterItems(items.filter(x => {
                const { item, partNo, sku } = x;
                const conditionsArray = [item, partNo, sku];
                return conditionsArray.some(j => j.toLowerCase().includes(searchKeyword.toLowerCase()));
            }))
        }
    }, [searchKeyword]);

    return (
        <div className={Styles.wrapper}>
            <input onChange={(e) => changeSearchKeyword(e.target.value)}
                type="text"
                value={searchKeyword}
                placeholder="Search Inventory" />
            <div className="spacer"></div>
            <Button onClick={() => toggleModal(true)}> Insert New Item</Button>
        </div>
    );
}

export default Toolbar;