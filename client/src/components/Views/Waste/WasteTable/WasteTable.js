import React, { useEffect } from "react"
import Styles from "./WasteTable.module.scss"
import { Table } from "react-bootstrap"
import $ from "jquery"
import ItemOptions from "./ItemOptions/ItemOptions"

const WasteTable = (props) => {
  const { wasteItems, deleteWasteItem } = props

  // Sort waste items by date wasted (newest first)
  const sortedWasteItems = [...wasteItems].sort((a, b) => {
    const aDate = a.dateWasted ? new Date(a.dateWasted) : new Date(0)
    const bDate = b.dateWasted ? new Date(b.dateWasted) : new Date(0)
    return bDate - aDate
  })

  // Helper function for formatting values
  function valueToFixed(value) {
    return Number(value || 0).toFixed(2)
  }

  const items = sortedWasteItems.map((x) => populateRow(x))

  useEffect(() => {
    applySortingToDOM()
  }, [items])





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

    // Create tooltip content for additional costs breakdown
    const getAdditionalCostsTooltip = () => {
      if (!Array.isArray(additionalCosts) || additionalCosts.length === 0) {
        return totalAdditionalCosts > 0 ? `Total: $${valueToFixed(totalAdditionalCosts)}` : 'No additional costs'
      }
      
      const breakdown = additionalCosts.map(cost => {
        const date = cost.date ? new Date(cost.date).toLocaleDateString() : ''
        const title = cost.title || 'Additional Cost'
        const amount = `$${valueToFixed(cost.amount || 0)}`
        return date ? `${title}: ${amount} (${date})` : `${title}: ${amount}`
      }).join('\n')
      
      return `${breakdown}\n\nTotal: $${valueToFixed(totalAdditionalCosts)}`
    }

    return (
      <tr key={_id} className={Styles.wasteRow}>
        <td className={Styles["titleId"]}>
          <span className={Styles["item-options"]}>
            <ItemOptions itemObject={itemObject} deleteWasteItem={deleteWasteItem} />
          </span>{" "}
          <span className={Styles["wasteIndicator"]} title="Waste Item">
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
        <td>
          <span 
            className={Styles["data"]}
            title={getAdditionalCostsTooltip()}
            style={{ cursor: 'help' }}
          >
            ${valueToFixed(totalAdditionalCosts)}
          </span>
        </td>
        <td className={Styles.lossAmount}>-${valueToFixed(totalLoss)}</td>
        <td className={Styles.wasteReason}>{wasteReason}</td>
        <td>{buyer || "N/A"}</td>
        <td>{lastReturnedOrder || "N/A"}</td>
      </tr>
    )
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