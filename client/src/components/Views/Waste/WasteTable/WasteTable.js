import React, { useEffect, useState } from "react"
import Styles from "./WasteTable.module.scss"
import { Table } from "react-bootstrap"
import $ from "jquery"
import ItemOptions from "./ItemOptions/ItemOptions"

const WasteTable = (props) => {
  const { wasteItems, updateItem, user, deleteWasteItem } = props
  
  const [editItem, changeEdit] = useState({
    entryItem: "",
    value: "",
    id: "",
  })

  // Sort waste items by date wasted (newest first)
  const sortedWasteItems = [...wasteItems].sort((a, b) => {
    const aDate = a.dateWasted ? new Date(a.dateWasted) : new Date(0)
    const bDate = b.dateWasted ? new Date(b.dateWasted) : new Date(0)
    return bDate - aDate
  })

  const items = sortedWasteItems.map((x) => populateRow(x))

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
      id: id,
    })
  }

  function saveEntry(itemDetails) {
    let updates = {
      ...itemDetails,
      [editItem.entryItem]: parseFloat(editItem.value) || 0,
    }
    
    // For additional costs, we need to handle it as an array
    if (editItem.entryItem === 'additionalCosts') {
      const newCostAmount = parseFloat(editItem.value) || 0
      updates.additionalCosts = [
        { title: 'manualAdjustment', amount: newCostAmount, date: new Date() }
      ]
    }
    
    // Recalculate profit for waste items (should be negative)
    const { purchasePrice } = updates
    const totalAdditionalCosts = Array.isArray(updates.additionalCosts) 
      ? updates.additionalCosts.reduce((sum, cost) => sum + (cost.amount || 0), 0)
      : (updates.additionalCosts || 0)
    
    updates.profit = -(purchasePrice + totalAdditionalCosts)

    const itemToSave = {
      id: editItem.id,
      updates,
    }
    updateItem(itemToSave)
  }

  function populateRow(itemObject) {
    const {
      title,
      partNo,
      sku,
      datePurchased,
      dateWasted,
      purchasePrice,
      profit,
      _id,
      buyer,
      additionalCosts,
      returnDate,
      lastReturnedOrder,
    } = itemObject

    const wasteReason = getWasteReason(itemObject)
    const totalLoss = Math.abs(profit || purchasePrice || 0)
    
    // Calculate total additional costs from array
    const totalAdditionalCosts = Array.isArray(additionalCosts) 
      ? additionalCosts.reduce((sum, cost) => sum + (cost.amount || 0), 0)
      : (additionalCosts || 0)

    return (
      <tr key={_id} className={Styles.wasteRow}>
        <td className={Styles["titleId"]}>
          <span className={Styles["item-options"]}>
            <ItemOptions itemObject={itemObject} deleteWasteItem={deleteWasteItem} />
          </span>{" "}
          <span className={Styles["wasteIndicator"]} title="Waste Item">
            🗑️
          </span>
          <span 
            className={Styles["titleText"]}
            ref={(el) => {
              if (el && el.scrollWidth > el.clientWidth) {
                el.setAttribute('title', title);
              } else if (el) {
                el.removeAttribute('title');
              }
            }}
          >
            {title}
          </span>
        </td>
        <td>{partNo}</td>
        <td>{sku}</td>
        <td>{datePurchased}</td>
        <td>{dateWasted || "Not Set"}</td>
        <td>${valueToFixed(purchasePrice)}</td>
        <td className={Styles["tdEdit"]}>
          {editItem.id === _id && editItem.entryItem === "additionalCosts" ? (
            <input
              type="text"
              value={editItem.value}
              onChange={changeEntry}
              autoFocus
            />
          ) : (
            <span className={Styles["data"]}>
              ${valueToFixed(totalAdditionalCosts)}
            </span>
          )}
          <i
            onClick={(e) => editEntry(_id, "additionalCosts")}
            className={`${Styles["edit"]} material-icons`}
          >
            edit_note
          </i>
          <i
            onClick={(e) =>
              saveEntry({ purchasePrice, additionalCosts: totalAdditionalCosts })
            }
            className={`${Styles["save"]} material-icons`}
            style={
              editItem.id === _id && editItem.entryItem === "additionalCosts"
                ? { visibility: "visible" }
                : { visibility: "hidden" }
            }
          >
            save
          </i>
        </td>
        <td className={Styles.lossAmount}>-${valueToFixed(totalLoss)}</td>
        <td className={Styles.wasteReason}>{wasteReason}</td>
        <td>{buyer || "N/A"}</td>
        <td>{lastReturnedOrder || "N/A"}</td>
      </tr>
    )

    function valueToFixed(value) {
      return Number(value || 0).toFixed(2)
    }
  }

  function getWasteReason(itemObject) {
    // Determine why item was marked as waste
    if (itemObject.returnDate || itemObject.lastReturnedOrder) {
      return "Return/Refund"
    }
    if (itemObject.ebayCancelReason) {
      return `Cancelled: ${itemObject.ebayCancelReason}`
    }
    if (itemObject.automaticReturn) {
      return "Auto Return"
    }
    return "Manual Waste"
  }

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
        if (String(valA).includes("/")) {
          valA = dateToTime(valA)
          valB = dateToTime(valB)
        } else {
          valA = valA.replace(/\$|%|,/g, "")
          valB = valB.replace(/\$|%|,/g, "")
        }
        //Strips commas and dollar sign off of numbers.

        function dateToTime(value) {
          return Number(new Date(String(value)).getTime())
        }
        return $.isNumeric(valA) && $.isNumeric(valB)
          ? valA - valB
          : valA.toString().localeCompare(valB.toString())
      }
    }
    function getCellValue(row, index) {
      return $(row).children("td").eq(index).text()
    }
  }

  return (
    <div className={Styles.wrapper}>
      <Table striped bordered responsive hover>
        <thead>
          <tr>
            <th>Title</th>
            <th>Part No</th>
            <th>SKU</th>
            <th>Purchased</th>
            <th>Wasted</th>
            <th>Cost</th>
            <th>Additional Costs</th>
            <th>Total Loss</th>
            <th>Reason</th>
            <th>Buyer</th>
            <th>Order ID</th>
          </tr>
        </thead>
        <tbody className={Styles.itemsList}>{items}</tbody>
      </Table>
    </div>
  )
}

export default WasteTable 