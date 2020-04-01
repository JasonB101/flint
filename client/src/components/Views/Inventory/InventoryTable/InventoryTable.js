import React from "react";
import { Button } from "react-bootstrap";
import Styles from "./InventoryTable.module.scss";
import { Table } from "react-bootstrap";
import getDays from "../../../../lib/getDays"

const InventoryTable = (props) => {
    
    const currencyFormatter = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
      });
    const { openLinkModal  } = props;
    const items = props.items.map(x => populateRow(x));
    

    
    

    function populateRow(itemObject) {
        const { listed, item, partNo, sku, location, datePurchased, listedPrice, purchasePrice, _id, expectedProfit } = itemObject;
        return (
            <tr key={_id}>
                <td style={{ textAlign: "left" }}>{item}</td>
                <td>{partNo}</td>
                <td>{sku}</td>
                <td>{location}</td>
                <td>{getDays(datePurchased)}</td>
                <td>{currencyFormatter.format(purchasePrice)}</td>
                <td className={Styles.buttonWrapper} >{listed ? currencyFormatter.format(listedPrice) : <Button onClick={() => openLinkModal(_id)}
                >Link Item</Button>}</td>
                <td>{currencyFormatter.format(expectedProfit)}</td>
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