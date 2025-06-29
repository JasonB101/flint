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
    if (status === "ESCALATED") return "Escalated"
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

  // Sort returned items by return date (newest first)
  returnedItems.sort((a, b) => {
    // Simplified and more reliable return date extraction
    const getReturnDate = (item) => {
      // Priority 1: Use dedicated returnDate field if available
      if (item.returnDate) {
        return new Date(item.returnDate);
      }
      
      // Priority 2: Use updatedAt if significantly different from dateSold
      if (item.updatedAt && item.dateSold) {
        const updatedDate = new Date(item.updatedAt);
        const soldDate = new Date(item.dateSold);
        const daysDifference = Math.abs((updatedDate - soldDate) / (1000 * 60 * 60 * 24));
        
        if (daysDifference > 1) {
          return updatedDate;
        }
      }
      
      // Priority 3: Fall back to updatedAt or dateSold
      if (item.updatedAt) {
        return new Date(item.updatedAt);
      }
      
      if (item.dateSold) {
        return new Date(item.dateSold);
      }
      
      // Default: return very old date for items without dates
      return new Date(0);
    };
    
    const aDate = getReturnDate(a);
    const bDate = getReturnDate(b);
    
    return bDate - aDate; // Newest first
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
    } = itemObject

    // Calculate return shipping cost
    const returnShippingCost = additionalCosts.find(
      cost => cost.title === "returnShippingCost"
    )?.amount || 0

    // Calculate total additional costs
    const totalAdditionalCosts = additionalCosts.reduce((sum, cost) => sum + (cost.amount || 0), 0)

    // PROFIT CALCULATION LOGIC:
    // - Original Profit = selling price - item cost - fees - shipping
    // - Refunded Item Loss = item cost + original fees + return shipping (actual out-of-pocket loss)
    // - Waste Item Loss = item cost + all additional costs
    // - Resold Item Profit = new sale profit (includes return costs already)
    
    // Determine profit or expected profit based on status
    let profitOrExpected = 0
    
    if (status === "waste") {
      // Calculate loss for waste items (always negative)
      profitOrExpected = -(purchasePrice + totalAdditionalCosts)
    } else if (itemObject.refundAmount && itemObject.refundAmount > 0) {
      // Item was refunded - calculate actual out-of-pocket loss
      // Loss = item cost + original fees + return shipping cost (not the entire refund amount)
      profitOrExpected = -(purchasePrice + (ebayFees || 0) + returnShippingCost)
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
    
    // STATUS DETERMINATION LOGIC - Flow from most obvious to least obvious
    let currentStatus = "UNKNOWN"
    let statusSource = "logic"
    
    // 1. HIGHEST PRIORITY: Escalated returns - most critical status
    if (status === "escalated" || 
        itemObject.ebayReturnStatus?.toUpperCase() === 'ESCALATED' ||
        itemObject.returnStatus?.toUpperCase() === 'ESCALATED') {
      currentStatus = "ESCALATED"
      
    // 2. WASTE STATUS: Items explicitly marked as waste
    } else if (status === "waste") {
      currentStatus = "WASTED"
      
    // 3. CURRENTLY ACTIVE: Items currently listed for sale  
    } else if (isCurrentlyListed && status === "active") {
      currentStatus = "RELISTED"
      
    // 4. STILL IN PROGRESS: Returns not shipped back yet
    } else if (!itemObject.ebayTrackingStatus || 
               itemObject.ebayTrackingStatus === 'UNKNOWN' || 
               itemObject.ebayTrackingStatus.toLowerCase() === 'not shipped' ||
               itemObject.ebayTrackingStatus.toLowerCase().includes('not shipped')) {
      if (itemObject.refundAmount && itemObject.refundAmount > 0) {
        currentStatus = "REFUNDED" // Buyer got refund, item not returned
      } else {
        currentStatus = "OPEN" // Return still pending
      }
      
    // 5. RETURNED BUT NOT PROCESSED: Item delivered back but not handled yet
    } else if (itemObject.ebayTrackingStatus === 'DELIVERED' && 
               status !== "completed" && 
               status !== "waste" && 
               !isCurrentlyListed) {
      if (itemObject.refundAmount && itemObject.refundAmount > 0) {
        currentStatus = "REFUNDED" // Delivered back + refunded
      } else {
        currentStatus = "RETURNED" // Delivered back, no refund
      }
      
    // 6. SUCCESSFULLY RESOLD: Very strict criteria
    } else if (status === "completed" && 
               profitOrExpected > 15 && // Must be significantly profitable
               dateSold && 
               itemObject.returnDate &&
               new Date(dateSold) > new Date(itemObject.returnDate) && // Sale after return
               itemObject.ebayTrackingStatus === 'DELIVERED') { // Must have been returned first
      currentStatus = "RESOLD"
      
    // 7. LOSSES: Items with refunds/negative outcomes
    } else if (itemObject.refundAmount && itemObject.refundAmount > 0) {
      currentStatus = "REFUNDED"
      
    } else if (profitOrExpected < 0) {
      currentStatus = "REFUNDED" // Treated as a loss
      
    // 8. FALLBACK: Use eBay status if available
    } else if (itemObject.ebayReturnStatus) {
      const ebayStatus = itemObject.ebayReturnStatus.toUpperCase()
      currentStatus = ebayStatus === 'CLOSED' ? "CLOSED" : ebayStatus
      statusSource = "ebay"
      
    // 9. DEFAULT: Unknown status
    } else {
      currentStatus = "UNKNOWN"
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
    
    // Check if this return needs attention (refunded but not properly processed)
    const needsAttention = itemObject.refundAmount && itemObject.refundAmount > 0 && 
                          currentStatus === 'REFUNDED' && 
                          status !== 'waste' && 
                          status !== 'completed'

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
      <tr key={_id}>
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
          {needsAttention && (
            <span 
              className={Styles["attentionIndicator"]}
              title={`Refunded item needs processing - $${valueToFixed(itemObject.refundAmount)} refunded. Consider marking as waste or relisting.`}
            >
              💰
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
          <span 
            className={`${Styles.returnType} ${automaticReturn ? Styles.automatic : Styles.manual}`}
            title={itemObject.buyerComments ? `Buyer Comments: ${itemObject.buyerComments}` : 'No buyer comments'}
            style={{ cursor: itemObject.buyerComments ? 'help' : 'default' }}
          >
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
            className={`${Styles.status} ${Styles[status]} ${statusSource === 'ebay' ? Styles.ebayStatus : ''} ${currentStatus === 'ESCALATED' ? Styles.escalated : ''} ${currentStatus === 'RESOLD' ? Styles.resold : ''} ${currentStatus === 'WASTED' ? Styles.wasted : ''} ${currentStatus === 'RELISTED' ? Styles.relisted : ''} ${currentStatus === 'REFUNDED' ? Styles.refunded : ''} ${currentStatus === 'RETURNED' ? Styles.returned : ''}`}
            title={(() => {
              if (currentStatus === 'ESCALATED') {
                const refundInfo = itemObject.refundAmount > 0 ? ` - Refunded $${valueToFixed(itemObject.refundAmount)}` : ''
                return `Return has been escalated to eBay customer service for resolution${refundInfo}`
              }
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