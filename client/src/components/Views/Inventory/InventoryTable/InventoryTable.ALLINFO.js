import React, { useEffect } from "react";
import Styles from "./InventoryTable.module.scss";
import { Table } from "react-bootstrap";
import $ from "jquery";

const InventoryTable = (props) => {
    const items = props.items.map(x => populateRow(x));

    useEffect(() => {
    }, [])

    function populateRow(itemObject) {
        const { item, partNo, sku, listed, datePurchased,
            dateSold, listedPrice, purchasePrice, priceSold, shippingCost,
            ebayFees, payPalFees, profit, id } = itemObject;
        return (
            <tr key={id}>
                <td style={{ textAlign: "left" }}>{item}</td>
                <td>{partNo}</td>
                <td>{sku}</td>
                <td>{listed}</td>
                <td>{datePurchased}</td>
                <td>{dateSold}</td>
                <td>${purchasePrice}</td>
                <td>${listedPrice}</td>
                <td>${priceSold}</td>
                <td>${shippingCost}</td>
                <td>${ebayFees}</td>
                <td>${payPalFees}</td>
                <td>${profit}</td>
            </tr>
        )
    }
    return (
        <div className={Styles.wrapper}>
            <Table striped bordered responsive hover>
                <thead>
                    <tr>
                        <th>Item</th>
                        <th>Part No</th>
                        <th>SKU</th>
                        <th>Listed</th>
                        <th>Date Purchased</th>
                        <th>Date Sold</th>
                        <th>Purchase Price</th>
                        <th>Listed Price</th>
                        <th>Price Sold</th>
                        <th>Shipping Cost</th>
                        <th>eBay Fees</th>
                        <th>PayPal Fees</th>
                        <th>Profit</th>
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