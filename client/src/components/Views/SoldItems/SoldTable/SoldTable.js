import React, { useEffect } from "react";
import Styles from "./SoldTable.module.scss";
import { Table } from "react-bootstrap";
import $ from "jquery";

const SoldTable = (props) => {
    const { soldItems } = props;
    const items = soldItems.map(x => populateRow(x));

    useEffect(() => {
        applySortingToDOM()
    }, [items])

    function populateRow(itemObject) {
        const { item, partNo, sku, datePurchased,
            dateSold, purchasePrice, priceSold, shippingCost,
            ebayFees, payPalFees, profit, _id, buyer } = itemObject;
        const username = buyer.username;
        return (
            <tr key={_id}>
                <td style={{ textAlign: "left" }}>{item}</td>
                <td>{partNo}</td>
                <td>{sku}</td>
                <td>{datePurchased}</td>
                <td>{dateSold}</td>
                <td>${purchasePrice}</td>
                <td>${priceSold}</td>
                <td>${shippingCost}</td>
                <td>${ebayFees}</td>
                <td>${payPalFees}</td>
                <td>${profit}</td>
                <td>{username}</td>
            </tr>
        )
    }

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
    return (
        <div className={Styles.wrapper}>

            <Table striped bordered responsive hover>
                <thead>
                    <tr>
                        <th>Item</th>
                        <th>Part No</th>
                        <th>SKU</th>
                        <th>Date Purchased</th>
                        <th>Date Sold</th>
                        <th>Purchase Price</th>
                        <th>Price Sold</th>
                        <th>Shipping Cost</th>
                        <th>eBay Fees</th>
                        <th>PayPal Fees</th>
                        <th>Profit</th>
                        <th>Buyer</th>
                    </tr>
                </thead>
                <tbody className={Styles.itesmList}>
                    {items}
                </tbody>
            </Table>
        </div>
    );
}

export default SoldTable;