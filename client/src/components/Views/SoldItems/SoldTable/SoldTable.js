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
        const { title, partNo, sku, datePurchased,
            dateSold, purchasePrice, priceSold, shippingCost,
            ebayFees, profit, _id, buyer } = itemObject;
        const username = buyer ? buyer.username : "Unknown";
        return (
            <tr key={_id}>
                <td style={{ textAlign: "left" }}>{title}</td>
                <td>{partNo}</td>
                <td>{sku}</td>
                <td>{datePurchased}</td>
                <td>{dateSold}</td>
                <td>${valueToFixed(purchasePrice)}</td>
                <td>${valueToFixed(priceSold)}</td>
                <td>${valueToFixed(shippingCost)}</td>
                <td>${valueToFixed(ebayFees)}</td>
                <td>${valueToFixed(profit)}</td>
                <td>{`${Math.floor(+profit / +purchasePrice * 100)}%`}</td>
                <td>{username}</td>
            </tr>
        )

        function valueToFixed(value) {
            return Number(value).toFixed(2);
        }
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
                const specialChars = ["$", ","]
                var valA = getCellValue(a, index), valB = getCellValue(b, index)
                //Strips commas and dollar sign off of numbers.
                if (specialChars.some(x => String(valA).includes(x))) {
                    valA = stripSpecial(valA);
                    valB = stripSpecial(valB);
                }
                if (String(valA).includes("/")) {
                    valA = dateToTime(valA);
                    valB = dateToTime(valB);
                }

                function stripSpecial(value) {
                    while (specialChars.some(x => value.includes(x))) {
                        specialChars.forEach(j => value = value.replace(j, ""))
                    }

                    return +value;
                }
                function dateToTime(value) {
                    return new Date(value).getTime()
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
                        <th>Title</th>
                        <th>Part No</th>
                        <th>SKU</th>
                        <th>Date Purchased</th>
                        <th>Date Sold</th>
                        <th>Purchase Price</th>
                        <th>Price Sold</th>
                        <th>Shipping Cost</th>
                        <th>Fees</th>
                        <th>Profit</th>
                        <th>ROI</th>
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