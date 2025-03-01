import React, { useMemo } from "react"
import Styles from "./Overview.module.scss"

const Overview = ({ items, expenses }) => {
  // Currency formatter
  const formatCurrency = (value) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(value)
  }

  const metrics = useMemo(() => {
    if (!items || !items.length) return null

    // Separate active and sold items
    const activeItems = items.filter((item) => item.listed && !item.sold)
    const soldItems = items.filter((item) => item.sold)

    // Inventory metrics
    const inventoryValue = activeItems.reduce(
      (sum, item) => sum + parseFloat(item.purchasePrice || 0),
      0
    )
    const totalListedValue = activeItems.reduce(
      (sum, item) => sum + parseFloat(item.listedPrice || 0),
      0
    )

    // Sales metrics
    const totalRevenue = soldItems.reduce(
      (sum, item) => sum + parseFloat(item.priceSold || 0),
      0
    )
    const totalProfit = soldItems.reduce(
      (sum, item) => sum + parseFloat(item.profit || 0),
      0
    )
    const totalEbayFees = soldItems.reduce(
      (sum, item) =>
        sum + parseFloat(item.ebayFees || 0) + parseFloat(item.payPalFees || 0),
      0
    )
    const totalShippingCosts = soldItems.reduce(
      (sum, item) => sum + parseFloat(item.shippingCost || 0),
      0
    )
    // Calculate average values
    const nonFreeItems = soldItems.filter(
      (item) => parseFloat(item.purchasePrice || 0) > 0.01
    )

    const avgROI = nonFreeItems.length
      ? nonFreeItems.reduce((sum, item) => sum + parseFloat(item.roi || 0), 0) /
        nonFreeItems.length
      : 0
    const avgDaysListed = soldItems.length
      ? soldItems.reduce((sum, item) => sum + (item.daysListed || 0), 0) /
        soldItems.length
      : 0

    // Calculate expense total
    const totalExpenses = expenses.reduce(
      (sum, expense) => sum + parseFloat(expense.amount || 0),
      0
    )
    const potentialProfit = activeItems.reduce(
      (sum, item) => sum + parseFloat(item.expectedProfit || 0),
      0
    )
    const netProfit = totalProfit - totalExpenses
    const rawInventoryValue = activeItems.reduce(
      (sum, item) => sum + parseFloat(item.purchasePrice || 0),
      0
    )
    const totalCost = rawInventoryValue + totalExpenses

    const costOfInventorySold = soldItems.reduce(
      (sum, item) => sum + parseFloat(item.purchasePrice || 0),
      0
    )

    const profitMargin =
      totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0

    return {
      activeListings: activeItems.length,
      inventoryValue: formatCurrency(inventoryValue),
      totalListedValue: formatCurrency(totalListedValue),
      potentialProfit: formatCurrency(potentialProfit),

      soldItems: soldItems.length,
      totalRevenue: formatCurrency(totalRevenue),
      totalProfit: formatCurrency(totalProfit),
      averageROI: avgROI.toFixed(1),
      averageDaysListed: Math.round(avgDaysListed),
      costOfInventorySold: formatCurrency(costOfInventorySold),
      profitMargin: profitMargin.toFixed(1),

      totalEbayFees: formatCurrency(totalEbayFees),
      totalShippingCosts: formatCurrency(totalShippingCosts),
      totalExpenses: formatCurrency(totalExpenses),
      totalExpenses: formatCurrency(totalExpenses),
      totalCost: formatCurrency(totalCost),
      netProfit: formatCurrency(netProfit),
      netProfitValue: netProfit, // Keep the raw value for styling positive/negative
    }
  }, [items, expenses])

  if (!metrics) return <div className={Styles.loading}>Loading metrics...</div>

  return (
    <div className={Styles.overviewWrapper}>
      <h1 className={Styles.title}>Business Overview</h1>

      <div className={Styles.metricsGrid}>
        <div className={Styles.card}>
          <h2>Inventory Status</h2>
          <div className={Styles.metric}>
            <span>Active Listings:</span>
            <span>{metrics.activeListings}</span>
          </div>
          <div className={Styles.metric}>
            <span>Inventory Cost:</span>
            <span>{metrics.inventoryValue}</span>
          </div>
          <div className={Styles.metric}>
            <span>Total Listed Value:</span>
            <span>{metrics.totalListedValue}</span>
          </div>
          <div className={Styles.metric}>
            <span>Potential Profit:</span>
            <span>{metrics.potentialProfit}</span>
          </div>
        </div>

        <div className={Styles.card}>
          <h2>Sales Performance</h2>
          <div className={Styles.metric}>
            <span>Items Sold:</span>
            <span>{metrics.soldItems}</span>
          </div>
          <div className={Styles.metric}>
            <span>Total Revenue:</span>
            <span>{metrics.totalRevenue}</span>
          </div>
          <div className={Styles.metric}>
            <span>Average ROI:</span>
            <span>{metrics.averageROI}%</span>
          </div>
          <div className={Styles.metric}>
            <span>Avg Days to Sell:</span>
            <span>{metrics.averageDaysListed}</span>
          </div>
        </div>

        <div className={Styles.card}>
          <h2>Profit Analysis</h2>
          <div className={Styles.metric}>
            <span>Total Revenue:</span>
            <span>{metrics.totalRevenue}</span>
          </div>
          <div className={Styles.metric}>
            <span>Cost of Goods Sold:</span>
            <span>{metrics.costOfInventorySold}</span>
          </div>
          <div className={Styles.metric}>
            <span>eBay Fees:</span>
            <span>{metrics.totalEbayFees}</span>
          </div>
          <div className={Styles.metric}>
            <span>Shipping Costs:</span>
            <span>{metrics.totalShippingCosts}</span>
          </div>
          <div className={Styles.metric}>
            <span>Business Expenses:</span>
            <span>{metrics.totalExpenses}</span>
          </div>
          <div className={Styles.metric}>
            <span>Business Investment:</span>
            <span>{metrics.totalCost}</span>
          </div>
          <div className={`${Styles.metric} ${Styles.highlight}`}>
            <span>Net Profit:</span>
            <span
              className={
                metrics.netProfitValue >= 0 ? Styles.positive : Styles.negative
              }
            >
              {metrics.netProfit}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Overview
