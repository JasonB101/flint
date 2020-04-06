import React, { useEffect } from "react";
import { Button } from "react-bootstrap";
import Styles from "./InventoryTable.module.scss";
import { Table } from "react-bootstrap";
import getDays from "../../../../lib/getDays"
import $ from "jquery"

const InventoryTable = (props) => {
    const inventoryItems = props.items;
    const currencyFormatter = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
    });
    const { openLinkModal } = props;
    const items = inventoryItems.map(x => populateRow(x));

    useEffect(() => {
        applySortingToDOM()
    }, [inventoryItems])

    function applySortingToDOM() {
         //borrowed from stackoverflow added some sugar
         $('th').click(function () {
            var table = $(this).parents('table').eq(0)
            var rows = table.find('tr:gt(0)').toArray().sort(comparer($(this).index()))
            this.asc = !this.asc
            if (!this.asc) { rows = rows.reverse() }
            for (var i = 0; i < rows.length; i++) { table.append(rows[i]) }
        })
        function comparer(index) {
            return function (a, b) {
                var valA = getCellValue(a, index), valB = getCellValue(b, index)
                //Strips commas and dollar sign off of numbers.
                if (valA.includes("$")) {
                    valA = stripSpecial(valA);
                    valB = stripSpecial(valB);
                }
                function stripSpecial(value) {
                    value = value.replace("$", "")
                    while (value.includes(",")) {
                        value = value.replace(",", "")
                    }

                    console.log(value)
                    return +value;
                }
                return $.isNumeric(valA) && $.isNumeric(valB) ? valA - valB : valA.toString().localeCompare(valB)
            }
        }
        function getCellValue(row, index) { return $(row).children('td').eq(index).text() }
    }

    function populateRow(itemObject) {
        const { listed, item, partNo, sku, location, datePurchased, listedPrice, purchasePrice, _id, expectedProfit } = itemObject;
        return (
            
            <tr key={_id}>
                <td style={{ textAlign: "left" }}>{item}</td>
                <td>{partNo || "n/a"}</td>
                <td>{sku || "n/a"}</td>
                <td>{location || "n/a"}</td>
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