import React from "react"
import Styles from "./Toolbar.module.scss"
import { Button } from "react-bootstrap"

const Toolbar = (props) => {
  const { searchTerm, changeSearchTerm, items, setToggleSummaryModal, timeFilter, setTimeFilter } = props
  const returnDetails = assembleReturnInfo(items)
  const {
    totalReturns,
    automaticReturns,
    manualReturns,
    totalReturnCosts,
    avgReturnCost,
    reListedCount,
    wasteCount,
    completedCount
  } = returnDetails

  return (
    <div className={Styles.wrapper}>
      <div className={Styles.leftColumn}>
        <input
          onChange={(e) => changeSearchTerm(e.target.value.trim())}
          type="text"
          value={searchTerm}
          placeholder={"Search Returns"}
        />
        <select 
          value={timeFilter} 
          onChange={(e) => setTimeFilter(e.target.value)}
          className={Styles.timeFilter}
        >
          <option value="thisyear">This Year</option>
          <option value="12months">Last 12 Months</option>
          <option value="6months">Last 6 Months</option>
          <option value="all">All Time</option>
        </select>
      </div>
      
      <h5>
        Total Returns
        <span>{totalReturns}</span>
      </h5>
      <h5>
        Automatic
        <span className={Styles.automaticBadge}>{automaticReturns}</span>
      </h5>
      <h5>
        Manual
        <span className={Styles.manualBadge}>{manualReturns}</span>
      </h5>
      <h5>
        Return Costs
        <span>{totalReturnCosts}</span>
      </h5>
      <h5>
        Avg Return Cost
        <span>{avgReturnCost}</span>
      </h5>
      <h5>
        Re-listed
        <span className={Styles.reListedBadge}>{reListedCount}</span>
      </h5>
      <h5>
        Wasted
        <span className={Styles.wasteBadge}>{wasteCount}</span>
      </h5>
      <h5>
        Completed
        <span className={Styles.completedBadge}>{completedCount}</span>
      </h5>
      <div className="spacer"></div>
      <Button onClick={() => setToggleSummaryModal(true)}>Summary</Button>
    </div>
  )
}

function assembleReturnInfo(items) {
  const returnObj = {
    totalReturns: 0,
    automaticReturns: 0,
    manualReturns: 0,
    totalReturnCosts: 0,
    avgReturnCost: 0,
    reListedCount: 0,
    wasteCount: 0,
    completedCount: 0,
  }

  items.forEach((item) => {
    returnObj.totalReturns++
    
    // Count automatic vs manual returns
    if (item.automaticReturn) {
      returnObj.automaticReturns++
    } else {
      returnObj.manualReturns++
    }
    
    // Calculate return costs
    const returnShippingCost = item.additionalCosts?.find(
      cost => cost.title === "returnShippingCost"
    )?.amount || 0
    returnObj.totalReturnCosts += returnShippingCost
    
    // Count by status
    if (item.listed && item.status === "active") {
      returnObj.reListedCount++
    } else if (item.status === "waste") {
      returnObj.wasteCount++
    } else if (item.status === "completed") {
      returnObj.completedCount++
    }
  })

  // Calculate averages
  if (returnObj.totalReturns > 0) {
    returnObj.avgReturnCost = returnObj.totalReturnCosts / returnObj.totalReturns
  }

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(value)
  }

  // Format currency values
  returnObj.totalReturnCosts = formatCurrency(returnObj.totalReturnCosts)
  returnObj.avgReturnCost = formatCurrency(returnObj.avgReturnCost)

  return returnObj
}

export default Toolbar 