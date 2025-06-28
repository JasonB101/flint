import React, { useEffect, useState } from "react"
import Styles from "./Toolbar.module.scss"
import { Button } from "react-bootstrap"

const Toolbar = ({
  changeSearchTerm,
  searchTerm,
  items,
  setToggleSummaryModal,
  timeFilter,
  setTimeFilter,
}) => {
  const [wasteInfo, setWasteInfo] = useState({})

  useEffect(() => {
    setWasteInfo(assembleWasteInfo(items))
  }, [items])

  function searchTermChange(e) {
    const { value } = e.target
    changeSearchTerm(value)
  }

  function handleTimeFilterChange(e) {
    setTimeFilter(e.target.value)
  }

  return (
    <div className={Styles.wrapper}>
      <div className={Styles.leftColumn}>
        <input
          onChange={searchTermChange}
          type="text"
          value={searchTerm}
          placeholder="Search waste items..."
        />
        <select 
          value={timeFilter} 
          onChange={handleTimeFilterChange}
          className={Styles.timeFilter}
        >
          <option value="6months">Last 6 Months</option>
          <option value="12months">Last 12 Months</option>
          <option value="thisyear">This Year</option>
          <option value="all">All Time</option>
        </select>
      </div>
      <h5>
        Items Wasted
        <span>{wasteInfo.wasteAmount}</span>
      </h5>
      <h5>
        Total Loss
        <span className={Styles.lossValue}>{wasteInfo.totalLoss}</span>
      </h5>
      <h5>
        Avg Loss
        <span className={Styles.lossValue}>{wasteInfo.avgLoss}</span>
      </h5>
      <h5>
        Total Cost
        <span>{wasteInfo.totalCost}</span>
      </h5>
      <h5>
        Avg Cost
        <span>{wasteInfo.avgCost}</span>
      </h5>
      <h5>
        Additional Costs
        <span>{wasteInfo.totalAdditionalCosts}</span>
      </h5>
      <h5>
        Returns
        <span>{wasteInfo.returnCount}</span>
      </h5>
      <h5>
        Cancellations
        <span>{wasteInfo.cancellationCount}</span>
      </h5>
      <div className="spacer"></div>
      <Button onClick={() => setToggleSummaryModal(true)} variant="outline-danger">
        View Summary
      </Button>
    </div>
  )
}

function assembleWasteInfo(items) {
  const wasteObj = {
    wasteAmount: 0,
    totalLoss: 0,
    totalCost: 0,
    totalAdditionalCosts: 0,
    returnCount: 0,
    cancellationCount: 0,
    avgLoss: 0,
    avgCost: 0,
  }

  items.forEach((item) => {
    const { profit, purchasePrice, additionalCosts } = item
    wasteObj.wasteAmount++
    
    // Calculate loss (should be negative profit, so we make it positive for display)
    const itemLoss = Math.abs(profit || purchasePrice || 0)
    wasteObj.totalLoss += itemLoss
    
    wasteObj.totalCost += purchasePrice || 0
    
    // Calculate additional costs from array
    const itemAdditionalCosts = Array.isArray(additionalCosts) 
      ? additionalCosts.reduce((sum, cost) => sum + (cost.amount || 0), 0)
      : (additionalCosts || 0)
    wasteObj.totalAdditionalCosts += itemAdditionalCosts
    
    // Count reason types
    if (item.returnDate || item.lastReturnedOrder) {
      wasteObj.returnCount++
    }
    if (item.ebayCancelReason) {
      wasteObj.cancellationCount++
    }
  })

  if (wasteObj.wasteAmount > 0) {
    wasteObj.avgLoss = wasteObj.totalLoss / wasteObj.wasteAmount
    wasteObj.avgCost = wasteObj.totalCost / wasteObj.wasteAmount
  }

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(value)
  }

  return {
    wasteAmount: wasteObj.wasteAmount.toLocaleString(),
    totalLoss: formatCurrency(wasteObj.totalLoss),
    avgLoss: formatCurrency(wasteObj.avgLoss),
    totalCost: formatCurrency(wasteObj.totalCost),
    avgCost: formatCurrency(wasteObj.avgCost),
    totalAdditionalCosts: formatCurrency(wasteObj.totalAdditionalCosts),
    returnCount: wasteObj.returnCount.toLocaleString(),
    cancellationCount: wasteObj.cancellationCount.toLocaleString(),
  }
}

export default Toolbar 