import React from "react";
import Styles from "./InventoryTable.module.scss";
import { Table } from "react-bootstrap";
import getDays from "../../../../lib/getDays"

const InventoryTable = (props) => {
    const items = props.items.map(x => populateRow(x));

    function populateRow(itemObject) {
        const { item, partNo, sku, location, datePurchased, listedPrice, purchasePrice, _id, expectedProfit } = itemObject;
        return (
            <tr key={_id}>
                <td style={{ textAlign: "left" }}>{item}</td>
                <td>{partNo}</td>
                <td>{sku}</td>
                <td>{location}</td>
                <td>{getDays(datePurchased)}</td>
                <td>${purchasePrice}</td>
                <td>${listedPrice}</td>
                <td>${expectedProfit}</td>
            </tr>
        )
    }
    return (
        <div className={Styles.wrapper}>
            <Table striped bordered hover>
                <thead>
                    <tr>
                        <th>Item</th>
                        <th>Part No</th>
                        <th>SKU</th>
                        <th>Location</th>
                        <th>Days in Inventory</th>
                        <th>Purchase Price</th>
                        <th>Listed Price</th>
                        <th>Expected Profit</th>
                    </tr>
                </thead>
                <tbody className={Styles.itesmList}>
                    {items}
                </tbody>
            </Table>
        </div>
    );
}

export default InventoryTable;