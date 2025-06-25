import React, { useEffect, useState } from "react"
import Styles from "./Toolbar.module.scss"
import { Button } from "react-bootstrap"

const Toolbar = ({
  changeSearchTerm,
  searchTerm,
  items,
  ebayListings,
  setToggleSummaryModal,
  timeFilter,
  setTimeFilter,
}) => {
  const [soldInfo, setSoldInfo] = useState({})

  useEffect(() => {
    setSoldInfo(assembleSoldInfo(items, ebayListings))
  }, [items, ebayListings])

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
          placeholder="Search sold items..."
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
        Items Sold
        <span>{soldInfo.soldAmount}</span>
      </h5>
      <h5>
        Total Sales
        <span>{soldInfo.totalSales}</span>
      </h5>
      <h5>
        Total Profit
        <span>{soldInfo.totalProfit}</span>
      </h5>
      <h5>
        Avg ROI
        <span>{soldInfo.avgRoi}%</span>
      </h5>
      <h5>
        Avg Shipping
        <span>{soldInfo.avgShipping}</span>
      </h5>
      <h5>
        Avg Price Sold
        <span>{soldInfo.avgPriceSold}</span>
      </h5>
      <h5>
        Avg Profit
        <span>{soldInfo.avgProfit}</span>
      </h5>
      <h5>
        Avg Days
        <span>{soldInfo.avgDaysListed}</span>
      </h5>
      <div className="spacer"></div>
      <Button onClick={() => setToggleSummaryModal(true)}>View Summary</Button>
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
  }

  items.forEach((item) => {
    const { priceSold, shippingCost, profit, roi, purchasePrice } = item
    soldObj.soldAmount++
    soldObj.totalProfit += profit
    soldObj.totalSales += priceSold
    soldObj.avgShipping += shippingCost < 1 ? 13 : shippingCost //This is a hard coded average. Too many items have 0 shipping cost. As long as you always update 0 shipping cost this should be fine
    soldObj.avgPriceSold += priceSold
    soldObj.avgRoi += purchasePrice < 1 ? 100 : roi //Items that are sourced for free, and purchasePrice set to $0.01 throw off the avg, so they get recorded as 100% roi
    soldObj.avgProfit += profit
    soldObj.avgDaysListed += item.daysListed
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
    soldAmount: soldObj.soldAmount.toLocaleString(),
    totalSales: formatCurrency(soldObj.totalSales),
    totalProfit: formatCurrency(soldObj.totalProfit),
    avgRoi: Math.round(soldObj.avgRoi),
    avgShipping: formatCurrency(soldObj.avgShipping),
    avgPriceSold: formatCurrency(soldObj.avgPriceSold),
    avgProfit: formatCurrency(soldObj.avgProfit),
    avgDaysListed: Math.round(soldObj.avgDaysListed),
  }
}

export default Toolbar
