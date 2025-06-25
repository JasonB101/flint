import React, { useState } from "react"
import Styles from "./ReturnsTable.module.scss"
import { Table } from "react-bootstrap"
import ItemOptions from "./ItemOptions/ItemOptions"
import ItemReturnModal from "../../SoldItems/ItemReturn/ItemReturnModal"

const ReturnsTable = (props) => {
  const { returnedItems, ebayListings, unprocessedReturnIds, unprocessedReturnsDetails, returnInventoryItem, user } = props
  const [processItem, setProcessItem] = useState(null)

  // Helper function to format tracking status text
  const formatTrackingStatus = (status) => {
    if (!status) return "Not Shipped"
    
    // Handle specific statuses
    if (status.toUpperCase() === 'UNKNOWN') return "Not Shipped"
    
    // Remove underscores and format as title case
    return status
      .replace(/_/g, ' ')
      .toLowerCase()
      .replace(/\b\w/g, (char) => char.toUpperCase())
  }

  // Helper function to format return status text
  const formatReturnStatus = (status) => {
    if (!status) return "Unknown"
    
    // Handle special statuses
    if (status === "RESOLD") return "Resold"
    if (status === "WASTED") return "Wasted"
    if (status === "RELISTED") return "Relisted"
    if (status === "REFUNDED") return "Refunded"
    if (status === "RETURNED") return "Returned"
    if (status === "CLOSED") return "Closed"
    
    // Remove underscores and format as title case
    return status
      .replace(/_/g, ' ')
      .toLowerCase()
      .replace(/\b\w/g, (char) => char.toUpperCase())
  }

  // Helper function to format return type (remove underscores and special characters)
  const formatReturnType = (type) => {
    if (!type) return 'N/A'
    return type
      .replace(/_/g, ' ') // Replace underscores with spaces
      .replace(/[^a-zA-Z0-9\s]/g, '') // Remove special characters except letters, numbers, and spaces
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ')
  }

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
      profit,
      expectedProfit,
      shippingCost,
      ebayFees,
      listedPrice,
      returnDate,
    } = itemObject

    // Calculate return shipping cost
    const returnShippingCost = additionalCosts.find(
      cost => cost.title === "returnShippingCost"
    )?.amount || 0

    // Calculate total additional costs
    const totalAdditionalCosts = additionalCosts.reduce((sum, cost) => sum + (cost.amount || 0), 0)

    // Determine profit or expected profit based on status
    let profitOrExpected = 0
    
    if (status === "waste") {
      // Calculate loss for waste items (always negative)
      profitOrExpected = -(purchasePrice + totalAdditionalCosts)
    } else if (status === "completed") {
      // Item was sold again - use the stored profit (return costs already included)
      if (profit !== undefined) {
        profitOrExpected = profit
      } else {
        // Fallback calculation if profit is missing
        profitOrExpected = (priceSold || 0) - purchasePrice - totalAdditionalCosts - (ebayFees || 0) - (shippingCost || 0)
      }
    } else if (expectedProfit !== undefined) {
      // Item is re-listed - use expected profit (already includes additional costs)
      profitOrExpected = expectedProfit
    }

    // Use actual return type from data, or fall back to automatic/manual
    const returnType = itemObject.returnType || itemObject.returnReason || (automaticReturn ? "Automatic" : "Manual")
    
    // Check if currently listed (use the listed field from the item)
    const isCurrentlyListed = listed
    
    // Determine current status with better descriptions - prioritize local status for final outcomes
    let currentStatus = status
    let statusSource = "local"
    
    // Check for final status outcomes first (these override eBay status)
    if (status === "waste") {
      currentStatus = "WASTED" // Item was returned and marked as waste/loss
    } else if (status === "completed" && itemObject.sold === true && priceSold > 0 && !isCurrentlyListed) {
      // Check if item has been resold (ultimate success status)
      // Must be completed AND sold=true AND have a sale price AND not currently listed
      currentStatus = "RESOLD" // Item was returned, relisted, and sold again
    } else if (isCurrentlyListed && status === "active") {
      currentStatus = "RELISTED" // Item is currently back for sale
    } else if (itemObject.ebayReturnStatus) {
      // Enhanced status logic for eBay returns (only if no final local status)
      const ebayStatus = itemObject.ebayReturnStatus.toUpperCase()
      
      if (ebayStatus === 'CLOSED') {
        // Enhanced logic for closed returns with hierarchy: CLOSED → REFUNDED/RETURNED → RELISTED → RESOLD/WASTED
        // REFUNDED = Item was refunded (may or may not be returned)  
        // RETURNED = Item delivered back but no refund shown
        // CLOSED = Basic closed status (unclear outcome)
        
        if (itemObject.refundAmount && itemObject.refundAmount > 0) {
          // Return was closed with a refund
          if (itemObject.ebayTrackingStatus === 'DELIVERED') {
            currentStatus = "REFUNDED" // Item delivered back, buyer got refund
          } else {
            currentStatus = "REFUNDED" // Buyer got refund (may have kept item)
          }
        } else if (itemObject.ebayTrackingStatus === 'DELIVERED') {
          currentStatus = "RETURNED" // Item delivered back, no refund shown
        } else {
          currentStatus = "CLOSED" // Just closed, unclear outcome
        }
      } else {
        currentStatus = itemObject.ebayReturnStatus
      }
      statusSource = "ebay"
    } else if (status === "completed") {
      currentStatus = "Sold"
    }

    // Format dates
    const formattedDatePurchased = datePurchased ? new Date(datePurchased).toLocaleDateString() : "N/A"
    const formattedDateSold = dateSold ? new Date(dateSold).toLocaleDateString() : "N/A"
    
    // Smart return date logic - try multiple sources in order of accuracy:
    // 1. Dedicated returnDate field (most accurate for new returns)
    // 2. For legacy returns, use updatedAt if it's significantly different from dateSold
    // 3. Fall back to dateSold as last resort
    let returnDateToUse = itemObject.returnDate;
    
    if (!returnDateToUse && updatedAt && dateSold) {
      // Check if updatedAt is meaningfully different from dateSold (more than 1 day)
      const updatedDate = new Date(updatedAt);
      const soldDate = new Date(dateSold);
      const daysDifference = Math.abs((updatedDate - soldDate) / (1000 * 60 * 60 * 24));
      
      if (daysDifference > 1) {
        returnDateToUse = updatedAt; // Use updatedAt if it's significantly different
      } else {
        returnDateToUse = dateSold; // Fall back to dateSold if updatedAt is too close
      }
    } else if (!returnDateToUse) {
      returnDateToUse = updatedAt || dateSold;
    }
    
    const formattedReturnDate = returnDateToUse ? new Date(returnDateToUse).toLocaleDateString() : "N/A"

    // Check if this return is unprocessed
    const isUnprocessed = unprocessedReturnIds && unprocessedReturnIds.has(itemObject.ebayReturnId)

    const valueToFixed = (value) => {
      if (typeof value === "number") {
        return value.toFixed(2)
      } else if (typeof value === "string" && !isNaN(value)) {
        return parseFloat(value).toFixed(2)
      } else {
        return "0.00"
      }
    }

    // Create detailed tooltip for unprocessed returns
    const createUnprocessedTooltip = () => {
      if (!isUnprocessed || !unprocessedReturnsDetails) return "Return needs processing"
      
      const details = unprocessedReturnsDetails[itemObject.ebayReturnId]
      if (!details) return "Return needs processing"
      
      const missingItems = details.missingIndicators || []
      if (missingItems.length === 0) return "Return needs processing"
      
      // Convert technical field names to user-friendly descriptions
      const fieldDescriptions = {
        'inventoryItemId': 'inventory link',
        'returnDate': 'return date', 
        'returnShippingCost': 'return shipping cost',
        'lastReturnedOrder': 'order tracking',
        'returnCount': 'return count',
        'automaticReturn': 'return type flag',
        'additionalCosts': 'cost details'
      }
      
      const missingDescriptions = missingItems.map(item => 
        fieldDescriptions[item] || item
      ).join(', ')
      
      return `Return needs processing (missing: ${missingDescriptions})`
    }

    return (
      <tr key={_id} className={isCurrentlyListed ? Styles.reListedItem : ""}>
        <td className={Styles["titleId"]}>
          <span className={Styles["item-options"]}>
            <ItemOptions itemObject={itemObject} setProcessItem={setProcessItem} />
          </span>{" "}
          {isUnprocessed && (
            <span 
              className={Styles["unprocessedIndicator"]}
              title={createUnprocessedTooltip()}
            >
              ⚠️
            </span>
          )}
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
        <td>${valueToFixed(listedPrice)}</td>
        <td>${valueToFixed(returnShippingCost)}</td>
        <td className={itemObject.refundAmount > 0 ? Styles.refundAmount : Styles.noRefund}>
          {itemObject.refundAmount > 0 ? `$${valueToFixed(itemObject.refundAmount)}` : '-'}
        </td>
        <td className={
          status === "waste" || profitOrExpected < 0
            ? Styles.negativeProfit 
            : (status === "active" ? Styles.neutralProfit : Styles.positiveProfit)
        }>
          {profitOrExpected < 0 ? '-' : ''}${valueToFixed(Math.abs(profitOrExpected))}
        </td>
        <td>
          <span className={`${Styles.returnType} ${automaticReturn ? Styles.automatic : Styles.manual}`}>
            {formatReturnType(returnType)}
          </span>
        </td>
        <td>
          <span className={`${Styles.trackingStatus} ${(() => {
            const status = itemObject.ebayTrackingStatus?.toLowerCase()
            if (!status || status === 'unknown') return Styles.notshipped
            return Styles[status] || Styles.notshipped
          })()}`}>
            {formatTrackingStatus(itemObject.ebayTrackingStatus)}
          </span>
        </td>
        <td>
          <span 
            className={`${Styles.status} ${Styles[status]} ${statusSource === 'ebay' ? Styles.ebayStatus : ''} ${currentStatus === 'RESOLD' ? Styles.resold : ''} ${currentStatus === 'WASTED' ? Styles.wasted : ''} ${currentStatus === 'RELISTED' ? Styles.relisted : ''} ${currentStatus === 'REFUNDED' ? Styles.refunded : ''} ${currentStatus === 'RETURNED' ? Styles.returned : ''}`}
            title={(() => {
              if (currentStatus === 'RESOLD') {
                const refundInfo = itemObject.refundAmount > 0 ? ` - Original refund: $${valueToFixed(itemObject.refundAmount)}` : ''
                const deliveryInfo = itemObject.ebayTrackingStatus === 'DELIVERED' ? ' - Item was returned and successfully resold' : ' - Item was resold after return'
                return `Success! Item sold again after return${refundInfo}${deliveryInfo}`
              }
              if (currentStatus === 'WASTED') {
                const refundInfo = itemObject.refundAmount > 0 ? ` - Refunded $${valueToFixed(itemObject.refundAmount)}` : ''
                const deliveryInfo = itemObject.ebayTrackingStatus === 'DELIVERED' ? ' - Item returned and marked as waste' : ' - Item marked as waste after return'
                const lossAmount = Math.abs(profitOrExpected)
                return `Item marked as waste - Loss: $${valueToFixed(lossAmount)}${refundInfo}${deliveryInfo}`
              }
              if (currentStatus === 'RELISTED') {
                const refundInfo = itemObject.refundAmount > 0 ? ` - Refunded $${valueToFixed(itemObject.refundAmount)}` : ''
                const deliveryInfo = itemObject.ebayTrackingStatus === 'DELIVERED' ? ' - Item returned and relisted' : ' - Item relisted (may have been kept by buyer)'
                return `Item currently active on eBay${refundInfo}${deliveryInfo}`
              }
              if (currentStatus === 'REFUNDED' && itemObject.refundAmount > 0) {
                const deliveryInfo = itemObject.ebayTrackingStatus === 'DELIVERED' ? ' - Item delivered back' : ' - Item may have been kept by buyer'
                return `Refunded $${valueToFixed(itemObject.refundAmount)}${itemObject.refundDate ? ` on ${itemObject.refundDate}` : ''}${deliveryInfo}`
              }
              if (currentStatus === 'RETURNED') {
                return 'Item delivered back to seller - no refund shown'
              }
              if (currentStatus === 'CLOSED') {
                return 'Return closed - outcome unclear'
              }
              return null
            })()}
          >
            {formatReturnStatus(currentStatus)}
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
            <th>Listed Price</th>
            <th>Return Cost</th>
            <th>Refund</th>
            <th>Profit</th>
            <th>Return Type</th>
            <th>Tracking</th>
            <th>Status</th>
            <th>Buyer</th>
          </tr>
        </thead>
        <tbody className={Styles.itemsList}>{items}</tbody>
      </Table>
      
      {processItem && (
        <ItemReturnModal
          onClose={() => setProcessItem(null)}
          onSubmit={(updates) => {
            returnInventoryItem(updates)
            setProcessItem(null)
          }}
          itemObject={processItem}
          ebayListings={ebayListings}
          user={user}
        />
      )}
    </div>
  )
}

export default ReturnsTable 