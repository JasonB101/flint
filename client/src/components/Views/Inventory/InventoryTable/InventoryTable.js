import React, { useState, useEffect, useContext } from "react";
import { Button } from "react-bootstrap";
import Styles from "./InventoryTable.module.scss";
import { Table } from "react-bootstrap";
import getDaysSince from "../../../../lib/getDaysSince"
import $ from "jquery"
// import { storeContext } from "../../../../Store"



const InventoryTable = (props) => {
    // const storeData = useContext(storeContext);
    // const { updateUnlisted } = storeData
    const { inventoryList: inventoryItems, ebayListings } = props;
    const currencyFormatter = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
    });
    // const duplicateEbayListingIds = checkForDuplicateListings(inventoryItems);
    const [unlistedItems] = useState(ebayListings.length > 0 ? checkForUnlistedItems(inventoryItems, ebayListings) : [])

    
    inventoryItems.sort((a, b) => {
        const {sku: aSku} = a
        const {sku: bSku} = b
        return +bSku - +aSku
    })
    const items = inventoryItems.map(x => populateRow(x));
    const { openLinkModal } = props;

    useEffect(() => {
        applySortingToDOM()
        // updateUnlisted(unlistedItems)  THIS ONLY GETS USED IF ITEMS SOLD IN THE PAST AND HAVE NO WAY OF UPDATING THEMSELVES
    }, [inventoryItems, unlistedItems])

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
                valA = valA.replace(/\$|%|,/g, "")
                valB = valB.replace(/\$|%|,/g, "")

                return $.isNumeric(valA) && $.isNumeric(valB) ? valA - valB : valA.toString().localeCompare(valB)
            }
        }
        function getCellValue(row, index) { return $(row).children('td').eq(index).text() }
    }

    function populateRow(itemObject) {
        const { listed, title, partNo, sku, location, datePurchased, listedPrice, purchasePrice, _id, expectedProfit, ebayId } = itemObject;

        return (

            <tr key={_id} style={unlistedItems.length > 0 ? unlistedItems.indexOf(ebayId) !== -1 ? { backgroundColor: "#ffa8a3" } : {} : {}}>
                <td style={{ textAlign: "left" }}>{title}</td>
                <td>{partNo || "n/a"}</td>
                <td>{sku || "n/a"}</td>
                <td>{location || "n/a"}</td>
                <td>{getDaysSince(datePurchased)}</td>
                <td>{currencyFormatter.format(purchasePrice)}</td>
                <td className={Styles.buttonWrapper} >{listed ? currencyFormatter.format(listedPrice) : <Button onClick={() => openLinkModal(_id, sku)}
                >Link Item</Button>}</td>
                <td>{currencyFormatter.format(expectedProfit)}</td>
                <td>{`${Math.floor(+expectedProfit / (+purchasePrice + 0.1) * 100)}%`}</td>
            </tr>
        )
    }
    function checkForDuplicateListings(listings) {
        const duplicateListings = listings.reduce((saved, item, index) => {
            const lastIndex = index === listings.length - 1;
            // console.log(item)
            saved[item.ebayId] = saved[item.ebayId] ? saved[item.ebayId] + 1 : 1;
            // console.log(saved)
            if (lastIndex) {
                const duplicates = [];
                for (let id in saved) {
                    if (saved[id] > 1) duplicates.push(id);
                }
                return duplicates;
            }
            return saved
        }, {})

        return duplicateListings;
    }

    function checkForUnlistedItems(inventoryListings, ebayListings) {
        const unlistedIds = [];
        inventoryListings.forEach(inventoryItem => {
            const { ebayId } = inventoryItem;
            const ebayItem = ebayListings.find(ebayItem => {
                const { ItemID } = ebayItem;
                // console.log(ebayItem);
                return ItemID == ebayId;
            })
            if (!ebayItem) unlistedIds.push(ebayId);
        })
        return unlistedIds;
    }

    return (
        <div className={Styles.wrapper}>
            <Table striped bordered responsive hover>
                <thead>
                    <tr>
                        <th>Title</th>
                        <th>Part No</th>
                        <th>SKU</th>
                        <th>Location</th>
                        <th>Days in Inventory</th>
                        <th>Purchase Price</th>
                        <th>Listed Price</th>
                        <th>Expected Profit</th>
                        <th>ROI</th>
                    </tr>
                </thead>
                <tbody className={Styles.itemsList}>
                    {items}
                </tbody>
            </Table>
        </div>
    );
}



export default InventoryTable;