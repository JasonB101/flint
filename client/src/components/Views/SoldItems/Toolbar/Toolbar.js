import React from "react"
import Styles from "./Toolbar.module.scss"

const Toolbar = (props) => {
  const { searchTerm, changeSearchTerm, items } = props
  const soldDetails = assembleSoldInfo(items)
  const {
    soldAmount,
    totalProfit,
    totalSales,
    avgRoi,
    avgShipping,
    avgPriceSold,
    avgProfit,
    avgDaysListed
  } = soldDetails

  return (
    <div className={Styles.wrapper}>
      <input
        onChange={(e) => changeSearchTerm(e.target.value.trim())}
        type="text"
        value={searchTerm}
        placeholder={"Search Sold Items"}
      />
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
      <div className="spacer"></div>
    </div>
  )
}

function assembleSoldInfo(items) {
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

  items.forEach((x) => {
    const { priceSold, shippingCost, profit, roi } = x
    soldObj.soldAmount++
    soldObj.totalProfit += profit
    soldObj.totalSales += priceSold
    soldObj.avgShipping += shippingCost < 1 ? 13 : shippingCost //This is a hard coded average. Too many items have 0 shipping cost. Aslong as you always update 0 shipping cost this should be fine
    soldObj.avgPriceSold += priceSold
    soldObj.avgRoi += roi
    soldObj.avgProfit += profit
    soldObj.avgDaysListed += x.daysListed
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
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value)
  }

  return {
    soldAmount: soldObj.soldAmount.toLocaleString("en-US"),
    totalProfit: formatCurrency(soldObj.totalProfit),
    totalSales: formatCurrency(soldObj.totalSales),
    avgRoi: soldObj.avgRoi.toFixed(2),
    avgShipping: formatCurrency(soldObj.avgShipping),
    avgPriceSold: formatCurrency(soldObj.avgPriceSold),
    avgProfit: formatCurrency(soldObj.avgProfit),
    avgDaysListed: Math.floor(soldObj.avgDaysListed),
  }
}

export default Toolbar
