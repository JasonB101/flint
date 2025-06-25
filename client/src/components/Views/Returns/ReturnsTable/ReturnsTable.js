import React from "react"
import Styles from "./ReturnsTable.module.scss"
import { Table } from "react-bootstrap"
import ItemOptions from "./ItemOptions/ItemOptions"

const ReturnsTable = (props) => {
  const { returnedItems, ebayListings } = props

  // Sort returned items by update date (newest first)
  returnedItems.sort((a, b) => {
    const aDate = new Date(a.updatedAt || a.dateSold || 0)
    const bDate = new Date(b.updatedAt || b.dateSold || 0)
    return bDate - aDate
  })

  const items = returnedItems.map((x) => populateRow(x))

  function populateRow(itemObject) {
    const {
      _id,
      title,
      partNo,
      sku,
      datePurchased,
      dateSold,
      purchasePrice,
      priceSold,
      buyer,
      status,
      listed,
      updatedAt,
      additionalCosts = [],
      automaticReturn,
    } = itemObject

    // Calculate return shipping cost
    const returnShippingCost = additionalCosts.find(
      cost => cost.title === "returnShippingCost"
    )?.amount || 0

    // Determine return type
    const returnType = automaticReturn ? "Automatic" : "Manual"
    
    // Determine current status with better descriptions
    let currentStatus = status
    if (listed && status === "active") {
      currentStatus = "Re-listed"
    } else if (status === "waste") {
      currentStatus = "Wasted"
    } else if (status === "completed") {
      currentStatus = "Completed"
    }

    // Format dates
    const formattedDatePurchased = datePurchased ? new Date(datePurchased).toLocaleDateString() : "N/A"
    const formattedDateSold = dateSold ? new Date(dateSold).toLocaleDateString() : "N/A"
    const formattedReturnDate = updatedAt ? new Date(updatedAt).toLocaleDateString() : "N/A"

    // Check if currently listed on eBay
    const isCurrentlyListed = ebayListings.some(listing => 
      listing.SKU === sku || listing.sku === sku
    )

    const valueToFixed = (value) => {
      if (typeof value === "number") {
        return value.toFixed(2)
      } else if (typeof value === "string" && !isNaN(value)) {
        return parseFloat(value).toFixed(2)
      } else {
        return "0.00"
      }
    }

    return (
      <tr key={_id} className={isCurrentlyListed ? Styles.reListedItem : ""}>
        <td className={Styles["titleId"]}>
          <span className={Styles["item-options"]}>
            <ItemOptions itemObject={itemObject} />
          </span>{" "}
          {isCurrentlyListed && (
            <span 
              className={Styles["activeIndicator"]}
              title="Currently active on eBay"
            >
              ✅
            </span>
          )}
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
        <td>{formattedDatePurchased}</td>
        <td>{formattedDateSold}</td>
        <td>{formattedReturnDate}</td>
        <td>${valueToFixed(purchasePrice)}</td>
        <td>${valueToFixed(priceSold)}</td>
        <td>${valueToFixed(returnShippingCost)}</td>
        <td>
          <span className={`${Styles.returnType} ${automaticReturn ? Styles.automatic : Styles.manual}`}>
            {returnType}
          </span>
        </td>
        <td>
          <span className={`${Styles.status} ${Styles[status]}`}>
            {currentStatus}
          </span>
        </td>
        <td>{buyer || "Unknown"}</td>
      </tr>
    )
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
            <th>Sold</th>
            <th>Return Date</th>
            <th>Cost</th>
            <th>Sale Price</th>
            <th>Return Cost</th>
            <th>Return Type</th>
            <th>Status</th>
            <th>Buyer</th>
          </tr>
        </thead>
        <tbody className={Styles.itemsList}>{items}</tbody>
      </Table>
    </div>
  )
}

export default ReturnsTable 