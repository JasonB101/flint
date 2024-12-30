import React, { useEffect, useState } from "react";
import Styles from "./SoldTable.module.scss";
import { Table } from "react-bootstrap";
import $ from "jquery";
import getDaysBetween from "../../../../lib/getDaysBetween";

const SoldTable = (props) => {
    const { soldItems, updateItem } = props;
    const [editItem, changeEdit] = useState({
        entryItem: "", //shippingCost needs to be the same name thats in the inventory Item MODEL
        value: "",
        id: ""
    })
    soldItems.sort((a, b) => {
        const { dateSold: aDate } = a
        const { dateSold: bDate } = b
        const aTime = Number(new Date(String(aDate)).getTime())
        const bTime = Number(new Date(String(bDate)).getTime())
        return bTime - aTime
    })
    const items = soldItems.map(x => populateRow(x));

    useEffect(() => {
        applySortingToDOM()
    }, [items])

    function changeEntry(e) {
        const { value } = e.target
        changeEdit({ ...editItem, value: value })
    }
    function editEntry(id, type) {
        changeEdit({
            entryItem: type,
            value: "",
            id: id
        })
    }
    function saveEntry(itemDetails) {
        //call store to updateEntry pass
        let updates = {
            ...itemDetails,
            [editItem.entryItem]: editItem.value
        }
        const { priceSold, purchasePrice, shippingCost, ebayFees } = updates
        updates.profit = priceSold - purchasePrice - shippingCost - ebayFees

        const itemToSave = {
            id: editItem.id,
            updates
        }
        updateItem(itemToSave)
    }

    function populateRow(itemObject) {
        const { title, partNo, sku, datePurchased,
            dateSold, purchasePrice, priceSold, shippingCost,
            ebayFees, profit, _id, buyer } = itemObject;
        const username = buyer ? buyer: "Unknown";
        return (
            <tr key={_id}>
                <td style={{ textAlign: "left" }}>{title}</td>
                <td>{partNo}</td>
                <td>{sku}</td>
                <td>{datePurchased}</td>
                <td>{dateSold}</td>
                <td>{getDaysBetween(datePurchased, dateSold)}</td>
                <td>${valueToFixed(purchasePrice)}</td>
                <td>${valueToFixed(priceSold)}</td>
                <td className={Styles['tdEdit']}>
                    {(editItem.id === _id && editItem.entryItem === "shippingCost") ?
                        <input type="text" value={editItem.value} onChange={changeEntry} autoFocus /> :
                        <span className={Styles['data']}>${valueToFixed(shippingCost)}</span>}

                    <i onClick={(e) => editEntry(_id, "shippingCost")} className={`${Styles['edit']} material-icons`}>edit_note</i>
                    <i onClick={(e) => saveEntry({ purchasePrice, priceSold, shippingCost, ebayFees })} className={`${Styles['save']} material-icons`}
                        style={(editItem.id === _id && editItem.entryItem === "shippingCost") ? { visibility: "visible" } : { visibility: "hidden" }}>save</i>
                </td>
                <td>${valueToFixed(ebayFees)}</td>
                <td>${valueToFixed(profit)}</td>
                <td>{`${Math.floor(+profit / (+purchasePrice + ebayFees + shippingCost) * 100)}%`}</td>
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
                var valA = getCellValue(a, index), valB = getCellValue(b, index)
                if (String(valA).includes("/")) {
                    valA = dateToTime(valA);
                    valB = dateToTime(valB);
                } else {
                    valA = valA.replace(/\$|%|,/g, "")
                    valB = valB.replace(/\$|%|,/g, "")
                }
                //Strips commas and dollar sign off of numbers.

                function dateToTime(value) {
                    return Number(new Date(String(value)).getTime())
                }
                return $.isNumeric(valA) && $.isNumeric(valB) ? valA - valB : valA.toString().localeCompare(valB.toString())
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
                        <th>Days Held</th>
                        <th>Purchase Price</th>
                        <th>Price Sold</th>
                        <th>Shipping Cost</th>
                        <th>Fees</th>
                        <th>Profit</th>
                        <th>ROI</th>
                        <th>Buyer</th>
                    </tr>
                </thead>
                <tbody className={Styles.itemsList}>
                    {items}
                </tbody>
            </Table>
        </div>
    );
}

export default SoldTable;