import React, { useEffect, useState, useContext } from "react"
import Styles from "./ItemReturnModal.module.scss"
import updateAdditionalCosts from "./updateAdditionalCost"
import figureExpectedProfit from "../../../../lib/figureExpectedProfit"
import itemReListed from "./itemReListed"
import itemIsWaste from "./itemIsWaste"
import { Modal, Button, Form, Row, Col } from "react-bootstrap"
import { storeContext } from "../../../../Store"

// Function to format return reasons into human-readable text
const formatReturnReason = (reason) => {
  if (!reason) return "N/A"
  
  const reasonMap = {
    'ORDERED_WRONG_ITEM': 'Ordered Wrong Item',
    'DEFECTIVE_ITEM': 'Defective Item',
    'DOESNT_MATCH_DESCRIPTION': "Doesn't Match Description",
    'ITEM_NOT_RECEIVED': 'Item Not Received',
    'DAMAGED_IN_SHIPPING': 'Damaged in Shipping',
    'CHANGED_MIND': 'Changed Mind',
    'ITEM_NOT_AS_DESCRIBED': 'Item Not as Described',
    'BUYER_REMORSE': 'Buyer Remorse',
    'COMPATIBILITY_ISSUE': 'Compatibility Issue',
    'QUALITY_ISSUE': 'Quality Issue',
    'SIZE_ISSUE': 'Size Issue',
    'COLOR_ISSUE': 'Color Issue',
    'PERFORMANCE_ISSUE': 'Performance Issue',
    'MISSING_PARTS': 'Missing Parts',
    'EXPIRED_ITEM': 'Expired Item',
    'COUNTERFEIT_ITEM': 'Counterfeit Item'
  }
  
  return reasonMap[reason] || reason.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())
}



const ItemReturnModal = ({
  onClose,
  onSubmit,
  itemObject,
  ebayListings,
  user,
}) => {
  const { getReturnsForItem } = useContext(storeContext)
  let {
    _id: itemId,
    title,
    sku,
    ebayId,
    dateSold,
    priceSold,
    buyer,
    orderId,
    listedPrice,
    purchasePrice,
    shippingCost,
    dateListed,
    additionalCosts = [],
  } = itemObject

  const { averageShippingCost, ebayFeePercent } = user

  const ebayListing = ebayListings.find((x) => x.SKU === sku)
  if (ebayListing) {
    const {
      ItemID: newEbayId,
      ListingDetails: { StartTime },
    } = ebayListing
    dateListed = new Date(StartTime).toLocaleDateString()
    ebayId = newEbayId
  }
  const [submitEnabled, setSubmitEnabled] = useState(false)

  const [inputs, setInputs] = useState({
    isRelisted: Boolean(ebayListing),
    returnShippingCost: 0,
    refundAmount: priceSold || 100, // Default to the price sold
    returnDate: new Date().toISOString().split('T')[0], // Default to today in ISO format
  })

  const [ebayReturnInfo, setEbayReturnInfo] = useState(null)

  useEffect(() => {
    fetchReturnDetails()
  }, [itemId])

  // Calculate combined costs without modifying state repeatedly
  const calculatedAdditionalCosts = React.useMemo(() => {
    console.log('💰 Recalculating additional costs...')
    console.log('Original additional costs:', additionalCosts)
    console.log('Original shipping cost:', shippingCost)
    console.log('New return shipping cost:', inputs.returnShippingCost)
    
    // Start with a fresh copy of original costs (excluding any previous return shipping costs from this session)
    const baseCosts = additionalCosts.filter(cost => cost.title !== "returnShippingCost" && cost.title !== "shippingCost") || []
    
    // Add the current return shipping cost if it exists
    const finalCosts = [...baseCosts]
    
    // Add original shipping cost (what it cost to ship to buyer)
    if (shippingCost > 0) {
      finalCosts.push({
        title: "shippingCost",
        amount: shippingCost,
      })
    }
    
    // Add return shipping cost (what it cost for buyer to ship back)
    if (inputs.returnShippingCost > 0) {
      finalCosts.push({
        title: "returnShippingCost",
        amount: inputs.returnShippingCost,
      })
    }
    
    console.log('Final calculated costs:', finalCosts)
    return finalCosts
  }, [additionalCosts, inputs.returnShippingCost, shippingCost])

  let newExpectedProfit = inputs.isRelisted
    ? figureExpectedProfit(
        listedPrice,
        purchasePrice,
        calculatedAdditionalCosts,
        averageShippingCost,
        ebayFeePercent
      )
    : (() => {
        // For waste items: Revenue = $0, Costs = Purchase Price + Return Shipping
        const totalAdditionalCosts = calculatedAdditionalCosts.reduce((acc, cost) => acc + cost.amount, 0)
        const wasteProfit = 0 - purchasePrice - totalAdditionalCosts
        
        console.log('🗑️ Waste profit calculation:')
        console.log('  Purchase Price:', purchasePrice)
        console.log('  Original Shipping Cost:', shippingCost)
        console.log('  Return Shipping Cost:', inputs.returnShippingCost)
        console.log('  All Additional Costs:', calculatedAdditionalCosts)
        console.log('  Total Additional Costs:', totalAdditionalCosts)
        console.log('  Formula: $0 - $' + purchasePrice + ' - $' + totalAdditionalCosts + ' = $' + wasteProfit)
        console.log('  Final Waste Profit:', wasteProfit)
        
        return +wasteProfit.toFixed(2)
      })()

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target

    setInputs((prevState) => ({
      ...prevState,
      [name]: type === "checkbox" ? checked : value,
    }))
  }

  const prepareAndSubmitChanges = () => {
    console.log('🚀 Preparing return submission...')
    console.log('📋 Current inputs:', inputs)
    console.log('💰 New expected profit:', newExpectedProfit)
    
    // Create itemReturnValues with current state values
    const itemReturnValues = {
      itemId: itemId,
      ebayId: ebayId,
      dateListed,
      expectedProfit: newExpectedProfit,
      additionalCosts: calculatedAdditionalCosts,
      roi: Math.floor((purchasePrice / newExpectedProfit) * 100),
      returnDate: new Date(inputs.returnDate).toLocaleDateString(), // Convert ISO date back to localized string
      returnShippingCost: inputs.returnShippingCost,
      orderId: orderId, // Include order ID for tracking returned orders
    }
    
    console.log('📦 Item return values:', itemReturnValues)

    let updates = inputs.isRelisted
      ? itemReListed(itemReturnValues)
      : itemIsWaste(itemReturnValues)
      
    console.log(`📝 Processing as ${inputs.isRelisted ? 'RELIST' : 'WASTE'}`)
    console.log('🔄 Final updates to submit:', updates)
    
    if (ebayListing && !inputs.isRelisted) {
      console.log('⚠️ eBay listing exists but item being marked as waste - should end listing')
      //end listing
    }
    
    onSubmit(updates)
  }

  const fetchReturnDetails = async () => {
    if (!itemId) return

    setSubmitEnabled(false)
    try {
      console.log(`🔍 Fetching return details for item ${itemId}`)
      
      // Try multiple strategies to find return data using the new return system
      let latestReturn = null
      
      // Strategy 1: Search by inventory item ID
      const returnsResponse = await getReturnsForItem(itemId)
      if (returnsResponse.success && returnsResponse.returns.length > 0) {
        latestReturn = returnsResponse.returns[0] // Most recent return
        console.log('📊 Found return by inventory item ID:', latestReturn.ebayReturnId)
      }
      
      // Strategy 2: If no return found, try searching by SKU
      if (!latestReturn && sku) {
        try {
          const skuResponse = await fetch(`/api/returns/sku/${sku}`, {
            headers: {
              'Authorization': `Bearer ${user?.token || ''}`
            }
          })
          if (skuResponse.ok) {
            const skuData = await skuResponse.json()
            if (skuData.success && skuData.returns.length > 0) {
              latestReturn = skuData.returns[0]
              console.log('📊 Found return by SKU:', latestReturn.ebayReturnId)
            }
          }
        } catch (error) {
          console.log('⚠️ SKU search not available, continuing...')
        }
      }
      
      // Strategy 3: If no return found, try searching by order ID
      if (!latestReturn && orderId) {
        try {
          const orderResponse = await fetch(`/api/returns/order/${orderId}`, {
            headers: {
              'Authorization': `Bearer ${user?.token || ''}`
            }
          })
          if (orderResponse.ok) {
            const orderData = await orderResponse.json()
            if (orderData.success && orderData.returns.length > 0) {
              latestReturn = orderData.returns[0]
              console.log('📊 Found return by order ID:', latestReturn.ebayReturnId)
            }
          }
        } catch (error) {
          console.log('⚠️ Order ID search not available, continuing...')
        }
      }
      
      if (latestReturn) {
        // Use return data from the new return system
        console.log('✅ Using return from new Return system:', latestReturn)
        
        const updates = {}
        const returnInfo = {
          returnDate: latestReturn.creationDate ? new Date(latestReturn.creationDate).toISOString().split('T')[0] : null,
          returnShippingCost: latestReturn.returnShippingCost || 0,
          returnReason: latestReturn.returnReason,
          buyerComments: latestReturn.buyerComments,
          returnStatus: latestReturn.returnStatus,
          trackingNumber: latestReturn.trackingNumber,
          carrierUsed: latestReturn.carrierUsed,
          trackingStatus: latestReturn.trackingStatus,
          refundAmount: latestReturn.refundAmount || latestReturn.itemPrice,
          refundStatus: latestReturn.refundStatus,
          refundDate: latestReturn.refundDate ? new Date(latestReturn.refundDate).toLocaleDateString() : null,
          deliveredDate: latestReturn.deliveryDate ? new Date(latestReturn.deliveryDate).toLocaleDateString() : null,
          ebayReturnId: latestReturn.ebayReturnId
        }
        
        // Update form inputs with return data
        if (returnInfo.returnDate) {
          updates.returnDate = returnInfo.returnDate
        }
        if (returnInfo.returnShippingCost) {
          updates.returnShippingCost = returnInfo.returnShippingCost
        }
        if (returnInfo.refundAmount) {
          updates.refundAmount = returnInfo.refundAmount
        }
        
        setEbayReturnInfo(returnInfo)
        
        if (Object.keys(updates).length > 0) {
          setInputs((prev) => ({
            ...prev,
            ...updates
          }))
          console.log('✅ Updated form with return data:', updates)
        }
        
        setSubmitEnabled(true)
        return
      }
      
      // If no return found in new system, this might be a manual return
      console.log('ℹ️ No return found in new return system - this may be a manual return')
      setSubmitEnabled(true)
      
    } catch (error) {
      console.error("❌ Error fetching return details:", error)
      setSubmitEnabled(true)
    }
  }

  return (
    <div className={Styles.modal}>
      <div className={Styles.modalContent}>
        <div className={Styles.modalHeader}>
          <h2>Item Return Details</h2>
          <button className={Styles.closeButton} onClick={onClose}>
            &times;
          </button>
        </div>
        <div className={Styles.contentWrapper}>
          
          {/* Item Information Section */}
          <div className={Styles.section}>
            <h3 className={Styles.sectionTitle}>Item Information</h3>
            <div className={Styles.itemTitle}>
              <strong>Title:</strong> {title}
            </div>
            <div className={Styles.infoGrid}>
              <div className={Styles.infoItem}>
                <span className={Styles.label}>SKU:</span>
                <span className={Styles.value}>{sku}</span>
              </div>
              <div className={Styles.infoItem}>
                <span className={Styles.label}>eBay ID:</span>
                <span className={Styles.value}>{ebayId || "N/A"}</span>
              </div>
              <div className={Styles.infoItem}>
                <span className={Styles.label}>Order ID:</span>
                <span className={Styles.value}>{orderId || "N/A"}</span>
              </div>
              <div className={Styles.infoItem}>
                <span className={Styles.label}>Buyer:</span>
                <span className={Styles.value}>{buyer || "N/A"}</span>
              </div>
              <div className={Styles.infoItem}>
                <span className={Styles.label}>Price Sold:</span>
                <span className={Styles.value}>${priceSold || "0.00"}</span>
              </div>
              <div className={Styles.infoItem}>
                <span className={Styles.label}>Date Sold:</span>
                <span className={Styles.value}>{dateSold || "N/A"}</span>
              </div>
            </div>
          </div>

          {/* Return Information Section */}
          <div className={Styles.section}>
            <h3 className={Styles.sectionTitle}>Return Information</h3>
            <div className={Styles.returnInputs}>
              <div className={Styles.inputGroup}>
                <label htmlFor="returnDate">Return Date</label>
                <input
                  id="returnDate"
                  type="date"
                  value={inputs.returnDate}
                  onChange={(e) =>
                    setInputs((prev) => ({
                      ...prev,
                      returnDate: e.target.value,
                    }))
                  }
                />
              </div>
              <div className={Styles.inputGroup}>
                <label htmlFor="returnShippingCost">Return Shipping Cost</label>
                <input
                  id="returnShippingCost"
                  type="number"
                  step="0.01"
                  value={inputs.returnShippingCost}
                  onChange={(e) =>
                    setInputs((prev) => ({
                      ...prev,
                      returnShippingCost: parseFloat(e.target.value) || 0,
                    }))
                  }
                />
              </div>

            </div>
          </div>

          {/* eBay Return Details Section */}
          {ebayReturnInfo && (
            <div className={Styles.section}>
              <h3 className={Styles.sectionTitle}>eBay Return Details</h3>
              <div className={Styles.ebayReturnGrid}>
                {ebayReturnInfo.returnReason && (
                  <div className={Styles.compactDetailItem}>
                    <span className={Styles.label}>Reason:</span>
                    <span className={Styles.value}>{formatReturnReason(ebayReturnInfo.returnReason)}</span>
                  </div>
                )}
                {ebayReturnInfo.returnStatus && (
                  <div className={Styles.compactDetailItem}>
                    <span className={Styles.label}>Status:</span>
                    <span className={`${Styles.value} ${Styles.status}`}>{ebayReturnInfo.returnStatus}</span>
                  </div>
                )}
                {ebayReturnInfo.trackingStatus && (
                  <div className={Styles.compactDetailItem}>
                    <span className={Styles.label}>Tracking:</span>
                    <span className={Styles.value}>{ebayReturnInfo.trackingStatus}</span>
                  </div>
                )}
                {ebayReturnInfo.buyerRefundAmount && (
                  <div className={Styles.compactDetailItem}>
                    <span className={Styles.label}>Buyer Refund:</span>
                    <span className={Styles.value}>${ebayReturnInfo.buyerRefundAmount}</span>
                  </div>
                )}
                {ebayReturnInfo.sellerRefundAmount && (
                  <div className={Styles.compactDetailItem}>
                    <span className={Styles.label}>Seller Charged:</span>
                    <span className={Styles.value}>${ebayReturnInfo.sellerRefundAmount}</span>
                  </div>
                )}
                {ebayReturnInfo.deliveredDate && (
                  <div className={Styles.compactDetailItem}>
                    <span className={Styles.label}>Delivered:</span>
                    <span className={Styles.value}>{ebayReturnInfo.deliveredDate}</span>
                  </div>
                )}
              </div>
              {ebayReturnInfo.buyerComments && (
                <div className={Styles.buyerComments}>
                  <span className={Styles.label}>Buyer Comments:</span>
                  <span className={Styles.commentText}>"{ebayReturnInfo.buyerComments}"</span>
                </div>
              )}
            </div>
          )}

          {/* Financial Summary Section */}
          <div className={Styles.section}>
            <h3 className={Styles.sectionTitle}>Financial Summary</h3>
            <div className={Styles.financialGrid}>
              <div className={Styles.financialItem}>
                <span className={Styles.label}>Listed Price:</span>
                <span className={Styles.value}>${listedPrice || '0.00'}</span>
              </div>
              <div className={Styles.financialItem}>
                <span className={Styles.label}>Purchase Price:</span>
                <span className={Styles.value}>${purchasePrice}</span>
              </div>
              <div className={`${Styles.financialItem} ${Styles.profitItem}`}>
                <span className={Styles.label}>Expected Profit:</span>
                <span className={`${Styles.value} ${newExpectedProfit < 0 ? Styles.negative : Styles.positive}`}>
                  ${newExpectedProfit}
                </span>
              </div>
            </div>
          </div>

          {/* Action Section */}
          <div className={Styles.actionSection}>
            <div className={Styles.statusToggle}>
              <label className={Styles.switch}>
                <input
                  type="checkbox"
                  name="isRelisted"
                  checked={inputs.isRelisted}
                  onChange={handleChange}
                />
                <span className={Styles.slider}></span>
              </label>
              <span className={`${Styles.statusLabel} ${inputs.isRelisted ? Styles.relisted : Styles.waste}`}>
                {inputs.isRelisted ? "Relisted" : "Waste"}
              </span>
            </div>

            <button
              className={Styles.submitButton}
              disabled={!submitEnabled}
              onClick={prepareAndSubmitChanges}
            >
              Submit Return
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ItemReturnModal
