import React, { useEffect, useState, useMemo } from "react"
import Styles from "./Returns.module.scss"
import ReturnsTable from "./ReturnsTable/ReturnsTable"
import Toolbar from "./Toolbar/Toolbar"
import ReturnsSummaryModal from "./ReturnsSummaryModal/ReturnsSummaryModal"
import { useContext } from "react"
import { storeContext } from "../../../Store"

const Returns = (props) => {
  const {
    updateItem,
    ebayListings,
    getShippingLabels,
    returnInventoryItem,
    user,
  } = props
  const [returnsSearchTerm, changeSearchTerm] = useState("")
  const [timeFilter, setTimeFilter] = useState("thisyear") // "6months", "12months", "thisyear", "all"
  const [statusFilter, setStatusFilter] = useState("all")
  const [allReturns, setAllReturns] = useState([])
  const [returnedItems, setReturnedItems] = useState([])
  const [itemsToShow, filterItems] = useState([])
  const [toggleSummaryModal, setToggleSummaryModal] = useState(false)
  const [unprocessedReturnIds, setUnprocessedReturnIds] = useState(new Set())
  const [unprocessedReturnsDetails, setUnprocessedReturnsDetails] = useState({})
  const { ebaySyncComplete, returns: storeReturns } = useContext(storeContext)

  // Dynamically generate status options from loaded returns
  const statusOptions = useMemo(() => {
    const uniqueStatuses = Array.from(new Set(allReturns.map(r => (r.returnStatus || '').toUpperCase()).filter(Boolean)))
    uniqueStatuses.sort()
    return [
      { value: "all", label: "All" },
      ...uniqueStatuses.map(status => ({ value: status, label: status.replace(/_/g, ' ').toUpperCase() }))
    ]
  }, [allReturns])

  // Transform return objects to match the expected inventory item format
  const transformReturnData = (returns) => {
    return returns.map((returnItem, index) => {
      // Get inventory item data from the populated field
      const inventoryItem = returnItem.inventoryItemId || {}
      
      // Debug logging to verify ID mapping
      if (inventoryItem._id) {
        console.log(`🔗 Return ${returnItem.ebayReturnId} linked to inventory item ${inventoryItem._id}`)
      } else {
        console.log(`⚠️ Return ${returnItem.ebayReturnId} has no linked inventory item`)
      }
      
      
      
      return {
        _id: inventoryItem._id || returnItem.inventoryItemId, // Use inventory item ID, not return ID
        // Basic item info
        title: returnItem.itemTitle || inventoryItem.title || "Unknown Item",
        partNo: inventoryItem.partNo || "N/A",
        sku: returnItem.sku || inventoryItem.sku || "N/A",
        
        // Dates - use return-specific dates
        datePurchased: inventoryItem.datePurchased || returnItem.originalSaleDate,
        dateSold: returnItem.originalSaleDate || returnItem.transactionDate || inventoryItem.dateSold,
        returnDate: returnItem.creationDate,
        updatedAt: returnItem.updatedAt || returnItem.lastModifiedDate,
        
        // Financial data - use available data from either source
        purchasePrice: inventoryItem.purchasePrice || 0,
        priceSold: inventoryItem.priceSold || returnItem.itemPrice || 0,
        listedPrice: inventoryItem.listedPrice || returnItem.itemPrice || 0,
        profit: inventoryItem.profit,
        expectedProfit: inventoryItem.expectedProfit,
        shippingCost: inventoryItem.shippingCost || returnItem.returnShippingCost || 0,
        ebayFees: inventoryItem.ebayFees || 0,
        
        // Calculate return shipping cost from additional costs if needed
        returnShippingCost: (() => {
          const additionalCosts = inventoryItem.additionalCosts || []
          const returnShippingCost = additionalCosts.find(
            cost => cost.title === "returnShippingCost"
          )?.amount || returnItem.returnShippingCost || 0
          return returnShippingCost
        })(),
        
        // Return-specific data
        returnStatus: returnItem.returnStatus || "Unknown",
        returnReason: returnItem.returnReason,
        buyerComments: returnItem.buyerComments,
        buyer: returnItem.buyerLoginName || inventoryItem.buyer || "Unknown",
        
        // Refund information
        refundAmount: returnItem.refundAmount || 0,
        refundStatus: returnItem.refundStatus || null,
        refundDate: returnItem.refundDate || null,
        sellerRefundAmount: returnItem.sellerRefundAmount || 0,
        
        // Tracking info
        ebayTrackingStatus: returnItem.trackingStatus,
        trackingNumber: returnItem.trackingNumber,
        carrierUsed: returnItem.carrierUsed,
        
        // Status mapping - use actual inventory status if available, otherwise derive from return status
        status: inventoryItem.status || mapReturnStatusToInventoryStatus(returnItem.returnStatus),
        listed: inventoryItem.listed || false,
        sold: inventoryItem.sold,
        automaticReturn: returnItem.autoProcessed || false,
        
        // Additional costs - ensure return shipping cost is included
        additionalCosts: (() => {
          const costs = inventoryItem.additionalCosts || []
          const returnShippingCost = returnItem.returnShippingCost || 0
          
          // Check if return shipping cost already exists in additional costs
          const hasReturnShippingCost = costs.some(cost => cost.title === "returnShippingCost")
          
          if (!hasReturnShippingCost && returnShippingCost > 0) {
            // Add return shipping cost to additional costs
            return [...costs, { title: "returnShippingCost", amount: returnShippingCost }]
          }
          
          return costs
        })(),
        
        // eBay specific fields for tracking
        ebayReturnId: returnItem.ebayReturnId,
        ebayReturnStatus: returnItem.returnStatus,
        orderId: returnItem.orderId,
        itemId: returnItem.itemId,
        returnDocumentId: returnItem._id, // Keep track of the return document ID
      }
    })
  }

  // Map return status to inventory status for display
  const mapReturnStatusToInventoryStatus = (returnStatus) => {
    switch (returnStatus?.toUpperCase()) {
      case 'CLOSED':
        return 'completed'
      case 'OPEN':
      case 'RETURN_REQUESTED':
        return 'active'
      default:
        return 'active'
    }
  }

  // Fetch unprocessed returns for UI indication
  const fetchUnprocessedReturns = async () => {
    try {
      const response = await fetch('/api/returns/unprocessed', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.token}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        
        if (data.success) {
          const unprocessedIds = new Set(data.unprocessedReturns.map(r => r.ebayReturnId))
          console.log(`📊 Found ${unprocessedIds.size} unprocessed returns`)
          setUnprocessedReturnIds(unprocessedIds)
          setUnprocessedReturnsDetails(data.unprocessedReturnsMap || {})
        }
      }
    } catch (error) {
      console.error('Error fetching unprocessed returns:', error)
    }
  }

  // Wait for eBay sync to complete, then use returns from Store
  useEffect(() => {
    if (ebaySyncComplete && storeReturns) {
      console.log("📦 Using returns from Store after eBay sync completion");
      
      const transformedReturns = transformReturnData(storeReturns);
      setAllReturns(transformedReturns);
      
      // Fetch unprocessed returns info
      fetchUnprocessedReturns();
    }
  }, [ebaySyncComplete, storeReturns])

  // Filter by time
  useEffect(() => {
    const now = new Date()
    let filteredByTime = allReturns
    if (timeFilter === "6months") {
      const sixMonthsAgo = new Date()
      sixMonthsAgo.setMonth(now.getMonth() - 6)
      filteredByTime = allReturns.filter(item => {
        const updateDate = new Date(item.updatedAt || item.creationDate)
        return updateDate >= sixMonthsAgo
      })
    } else if (timeFilter === "12months") {
      const twelveMonthsAgo = new Date()
      twelveMonthsAgo.setFullYear(now.getFullYear() - 1)
      filteredByTime = allReturns.filter(item => {
        const updateDate = new Date(item.updatedAt || item.creationDate)
        return updateDate >= twelveMonthsAgo
      })
    } else if (timeFilter === "thisyear") {
      const yearStart = new Date(now.getFullYear(), 0, 1)
      filteredByTime = allReturns.filter(item => {
        const updateDate = new Date(item.updatedAt || item.creationDate)
        return updateDate >= yearStart
      })
    }
    setReturnedItems(filteredByTime)
  }, [allReturns, timeFilter])

  // Filter by search term and status
  useEffect(() => {
    let filtered = returnedItems
    if (statusFilter !== "all") {
      filtered = filtered.filter(r => r.returnStatus && r.returnStatus.toUpperCase() === statusFilter)
    }
    if (returnsSearchTerm === "") {
      filterItems(filtered)
    } else {
      filterItems(
        filtered.filter((x) => {
          const { itemTitle, partNo, sku, buyerLoginName } = x
          const username = buyerLoginName ? buyerLoginName : "Unknown"
          const conditionsArray = [itemTitle, partNo, sku, username]
          return conditionsArray.some((j) =>
            j
              ? j.toLowerCase().includes(returnsSearchTerm.toLowerCase())
              : false
          )
        })
      )
    }
  }, [returnsSearchTerm, returnedItems, statusFilter])

  return (
    <div className={Styles.wrapper}>
      {/* Main Content Card */}
      <div className={Styles.contentCard}>
        <div className={Styles.toolbarSection}>
          <Toolbar
            changeSearchTerm={changeSearchTerm}
            searchTerm={returnsSearchTerm}
            items={returnedItems}
            ebayListings={ebayListings}
            setToggleSummaryModal={setToggleSummaryModal}
            timeFilter={timeFilter}
            setTimeFilter={setTimeFilter}
          />
          {/* Status Filter Dropdown */}
          <div style={{ marginTop: 8, marginBottom: 8 }}>
            <label htmlFor="statusFilter" style={{ marginRight: 8 }}>Status:</label>
            <select
              id="statusFilter"
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              style={{ padding: 4 }}
            >
              {statusOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>
        
        <div className={Styles.tableSection}>
          <ReturnsTable
            updateItem={updateItem}
            returnedItems={itemsToShow}
            ebayListings={ebayListings}
            getShippingLabels={getShippingLabels}
            returnInventoryItem={returnInventoryItem}
            user={user}
            statusFilter={statusFilter}
            unprocessedReturnIds={unprocessedReturnIds}
            unprocessedReturnsDetails={unprocessedReturnsDetails}
          />
        </div>
      </div>

      {/* Bottom Padding */}
      <div className={Styles.bottomPadding}></div>

      {/* Modal */}
      {toggleSummaryModal && (
        <ReturnsSummaryModal
          returnedItems={returnedItems}
          setToggleSummaryModal={setToggleSummaryModal}
        />
      )}
    </div>
  )
}

export default Returns 