import React from "react"
import Styles from "./Toolbar.module.scss"
import { Button } from "react-bootstrap"


const Toolbar = (props) => {
  const { searchTerm, changeSearchTerm, items, ebayListings = [], setToggleSummaryModal, timeFilter, setTimeFilter } = props
  const soldDetails = assembleSoldInfo(items, ebayListings)
  const {
    soldAmount,
    totalProfit,
    totalSales,
    avgRoi,
    avgShipping,
    avgPriceSold,
    avgProfit,
    avgDaysListed,
    returnedCount
  } = soldDetails

  return (
    <div className={Styles.wrapper}>
      <div className={Styles.leftColumn}>
        <input
          onChange={(e) => changeSearchTerm(e.target.value.trim())}
          type="text"
          value={searchTerm}
          placeholder={"Search Sold Items"}
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
      <div className={Styles.rightSection}>
      <h5>
        Total Sold
        <span>{soldAmount}</span>
      </h5>
      <h5>
        Sales
        <span>{totalSales}</span>
      </h5>
      <h5>
        Profit
        <span>{totalProfit}</span>
      </h5>
      <h5>
        Avg ROI
        <span>{`${avgRoi}%`}</span>
      </h5>
      <h5>
        Avg Shipping
        <span>{avgShipping}</span>
      </h5>
      <h5>
        Avg Price Sold
        <span>{avgPriceSold}</span>
      </h5>
      <h5>
        Avg Profit
        <span>{avgProfit}</span>
      </h5>
      <h5>
        Avg Days Listed
        <span>{avgDaysListed}</span>
      </h5>
      {returnedCount > 0 && (
        <h5 className={Styles.returnedAlert}>
          Potential Returns
          <span className={Styles.returnedBadge}>{returnedCount}</span>
        </h5>
      )}
        <div className="spacer"></div>
        <Button onClick={() => setToggleSummaryModal(true)}>Summary</Button>
      </div>
    </div>
  )
}

function assembleSoldInfo(items, ebayListings = []) {
  const soldObj = {
    soldAmount: 0,
    totalProfit: 0,
    totalSales: 0,
    avgRoi: 0,
    avgShipping: 0,
    avgPriceSold: 0,
    avgProfit: 0,
    avgDaysListed: 0,
    returnedCount: 0,
  }

  items.forEach((x) => {
    const { priceSold, shippingCost, profit, roi, purchasePrice, sku } = x
    soldObj.soldAmount++
    soldObj.totalProfit += profit
    soldObj.totalSales += priceSold
    soldObj.avgShipping += shippingCost < 1 ? 13 : shippingCost //This is a hard coded average. Too many items have 0 shipping cost. Aslong as you always update 0 shipping cost this should be fine
    soldObj.avgPriceSold += priceSold
    soldObj.avgRoi += purchasePrice < 1 ? 100 : roi //Items that are sourced for free, and purchasePrice set to $0.01 throw off the avg, so they get recorded as 100% roi
    soldObj.avgProfit += profit
    soldObj.avgDaysListed += x.daysListed
    
    // Check if this sold item is currently listed on eBay (potential return)
    if (ebayListings.some(listing => listing.sku === sku)) {
      soldObj.returnedCount++
    }
  })

  if (soldObj.soldAmount > 0) {
    soldObj.avgRoi /= soldObj.soldAmount
    soldObj.avgShipping /= soldObj.soldAmount
    soldObj.avgPriceSold /= soldObj.soldAmount
    soldObj.avgProfit /= soldObj.soldAmount
    soldObj.avgDaysListed /= soldObj.soldAmount
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
    soldAmount: soldObj.soldAmount.toLocaleString("en-US"),
    totalProfit: formatCurrency(Math.floor(soldObj.totalProfit)),
    totalSales: formatCurrency(Math.floor(soldObj.totalSales)),
    avgRoi: Math.floor(soldObj.avgRoi),
    avgShipping: formatCurrency(soldObj.avgShipping),
    avgPriceSold: formatCurrency(Math.floor(soldObj.avgPriceSold)),
    avgProfit: formatCurrency(Math.floor(soldObj.avgProfit)),
    avgDaysListed: Math.floor(soldObj.avgDaysListed),
    returnedCount: soldObj.returnedCount,
  }
}

export default Toolbar
