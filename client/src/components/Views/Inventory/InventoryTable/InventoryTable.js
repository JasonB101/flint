import React, { useState, useEffect, useContext } from "react"
import { Button } from "react-bootstrap"
import Styles from "./InventoryTable.module.scss"
import { Table } from "react-bootstrap"
import getDaysSince from "../../../../lib/getDaysSince"
import $ from "jquery"
import ItemOptions from "./ItemOptions/ItemOptions"
import EditItemModal from "./EditItemModal/EditItemModal"
// import { storeContext } from "../../../../Store"

const InventoryTable = (props) => {
  // const storeData = useContext(storeContext);
  // const { updateUnlisted } = storeData
  const { inventoryList: inventoryItems, ebayListings, editInventoryItem } = props
  const currencyFormatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  })
  // const duplicateEbayListingIds = checkForDuplicateListings(inventoryItems);
  const [unlistedItems] = useState(
    ebayListings.length > 0
      ? checkForUnlistedItems(inventoryItems, ebayListings)
      : []
  )
  const [editItem, setEditItem] = useState(null) //when editItem is triggered, this becomes the itemObject, which also opens the modal. When cleared, the modal is gone

  inventoryItems.sort((a, b) => {
    const { sku: aSku } = a
    const { sku: bSku } = b
    return +bSku - +aSku
  })
  const items = inventoryItems.map((x) => populateRow(x))
  const { openLinkModal } = props

  useEffect(() => {
    applySortingToDOM()
    // updateUnlisted(unlistedItems)  THIS ONLY GETS USED IF ITEMS SOLD IN THE PAST AND HAVE NO WAY OF UPDATING THEMSELVES
  }, [inventoryItems, unlistedItems])

  function applySortingToDOM() {
    //borrowed from stackoverflow added some sugar
    $("th").click(function () {
      var table = $(this).parents("table").eq(0)
      var rows = table
        .find("tr:gt(0)")
        .toArray()
        .sort(comparer($(this).index()))
      this.asc = !this.asc
      if (!this.asc) {
        rows = rows.reverse()
      }
      for (var i = 0; i < rows.length; i++) {
        table.append(rows[i])
      }
    })
    function comparer(index) {
      return function (a, b) {
        var valA = getCellValue(a, index),
          valB = getCellValue(b, index)
        //Strips commas and dollar sign off of numbers.
        valA = valA.replace(/\$|%|,/g, "")
        valB = valB.replace(/\$|%|,/g, "")

        return $.isNumeric(valA) && $.isNumeric(valB)
          ? valA - valB
          : valA.toString().localeCompare(valB)
      }
    }
    function getCellValue(row, index) {
      return $(row).children("td").eq(index).text()
    }
  }

  function populateRow(itemObject) {
    const {
      listed,
      title,
      partNo,
      sku,
      location,
      datePurchased,
      listedPrice,
      purchasePrice,
      watchers,
      _id,
      expectedProfit,
      ebayId,
    } = itemObject

    return (
      <tr
        key={_id}
        style={
          unlistedItems.length > 0
            ? unlistedItems.indexOf(ebayId) !== -1
              ? { backgroundColor: "#e3f385" }
              : {}
            : {}
        }
      >
        <td className={Styles["titleTd"]}>
          <span className={Styles["item-options"]}>
            <ItemOptions setEditItem={setEditItem} itemObject={itemObject} />
          </span>{" "}
          {title}
        </td>
        <td>{partNo || "n/a"}</td>
        <td>{sku || "n/a"}</td>
        <td>{location || "n/a"}</td>
        <td>{getDaysSince(datePurchased)}</td>
        <td>{watchers}</td>
        <td>{currencyFormatter.format(purchasePrice)}</td>
        <td className={Styles.buttonWrapper}>
          {listed ? (
            currencyFormatter.format(listedPrice)
          ) : (
            <Button onClick={() => openLinkModal(_id, sku)}>Link Item</Button>
          )}
        </td>
        <td>{currencyFormatter.format(expectedProfit)}</td>
      </tr>
    )
  }
  function checkForDuplicateListings(listings) {
    const duplicateListings = listings.reduce((saved, item, index) => {
      const lastIndex = index === listings.length - 1
      // console.log(item)
      saved[item.ebayId] = saved[item.ebayId] ? saved[item.ebayId] + 1 : 1
      // console.log(saved)
      if (lastIndex) {
        const duplicates = []
        for (let id in saved) {
          if (saved[id] > 1) duplicates.push(id)
        }
        return duplicates
      }
      return saved
    }, {})

    return duplicateListings
  }

  function checkForUnlistedItems(inventoryListings, ebayListings) {
    const unlistedIds = []
    inventoryListings.forEach((inventoryItem) => {
      const { ebayId, sku } = inventoryItem
      const ebayItem = ebayListings.find((ebayItem) => {
        const { ItemID, SKU } = ebayItem
        // console.log(ebayItem);
        return SKU == sku
      })
      if (!ebayItem) unlistedIds.push(ebayId)
    })
    return unlistedIds
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
            <th>Watchers</th>
            <th>Purchase Price</th>
            <th>Listed Price</th>
            <th>Expected Profit</th>
          </tr>
        </thead>
        <tbody className={Styles.itemsList}>{items}</tbody>
      </Table>
      {editItem && <EditItemModal onClose={()=> setEditItem(null)} onSubmit={(itemObject)=>{editInventoryItem(itemObject)}} itemObject={editItem}/>}
    </div>
  )
}

export default InventoryTable
