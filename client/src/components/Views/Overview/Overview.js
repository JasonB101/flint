import React, { useMemo, useState } from "react"
import Styles from "./Overview.module.scss"
import TripReport from "./TripReport/TripReport"
import CashFlowChart from "./CashFlowChart/CashFlowChart"
import {
  YearCashFlowChart,
  YearCashFlowChartByWeek,
  YearCashFlowChartByMonth,
} from "./CashFlowChart/ChartTemplates/chartOptions"

const Overview = ({ items, expenses }) => {
  const [dateType, setDateType] = useState("week")
  const [year, setYear] = useState(new Date().getFullYear())

  // Safety checks
  const safeItems = items || []
  const safeExpenses = expenses || []

  // Currency formatter
  const formatCurrency = (value) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(value)
  }

  // Get available years from items and expenses
  const availableYears = [...new Set([
    ...safeItems.filter(item => item.dateSold).map(item => {
      try {
        return new Date(item.dateSold).getFullYear()
      } catch (e) {
        return null
      }
    }),
    ...safeItems.filter(item => item.datePurchased).map(item => {
      try {
        return new Date(item.datePurchased).getFullYear()
      } catch (e) {
        return null
      }
    }),
    ...safeExpenses.map(expense => {
      try {
        return new Date(expense.date).getFullYear()
      } catch (e) {
        return null
      }
    })
  ])].filter(year => year !== null).sort((a, b) => b - a)

  // Ensure we have at least the current year
  const finalAvailableYears = availableYears.length > 0 ? availableYears : [new Date().getFullYear()]

  // Chart options based on selected period
  const getCashFlowChartOptions = () => {
          try {
        switch (dateType) {
          case "day":
            return new YearCashFlowChart(year, safeItems, safeExpenses)
          case "week":
            return new YearCashFlowChartByWeek(year, safeItems, safeExpenses)
          case "month":
            return new YearCashFlowChartByMonth(year, safeItems, safeExpenses)
          default:
            return new YearCashFlowChartByWeek(year, safeItems, safeExpenses)
        }
    } catch (error) {
      console.error('Error generating cash flow chart options:', error)
      return {
        title: { text: 'Cash Flow Chart' },
        data: [{
          dataPoints: []
        }]
      }
    }
  }

  const renderPeriodButton = (period, label) => (
    <button
      key={period}
      onClick={() => setDateType(period)}
      className={`${Styles.periodButton} ${dateType === period ? Styles.active : ''}`}
    >
      {label}
    </button>
  )

  const metrics = useMemo(() => {
    if (!safeItems || !safeItems.length) return null

    // Separate active and finalized items (sold + waste)
    const activeItems = safeItems.filter((item) => item.listed && !item.sold && item.status !== "waste")
    const finalizedItems = safeItems.filter((item) => item.sold === true || item.status === "waste")

    // Inventory metrics
    const inventoryValue = activeItems.reduce(
      (sum, item) => sum + parseFloat(item.purchasePrice || 0),
      0
    )
    const totalListedValue = activeItems.reduce(
      (sum, item) => sum + parseFloat(item.listedPrice || 0),
      0
    )

    // Sales metrics (including waste losses)
    const totalRevenue = finalizedItems.reduce(
      (sum, item) => sum + (item.sold ? parseFloat(item.priceSold || 0) : 0), // Only sold items generate revenue
      0
    )
    const totalProfit = finalizedItems.reduce(
      (sum, item) => sum + parseFloat(item.profit || 0), // Include profit from sales AND losses from waste
      0
    )
    const totalEbayFees = finalizedItems.reduce(
      (sum, item) =>
        sum + parseFloat(item.ebayFees || 0) + parseFloat(item.payPalFees || 0),
      0
    )
    const totalShippingCosts = finalizedItems.reduce(
      (sum, item) => sum + parseFloat(item.shippingCost || 0),
      0
    )
    // Calculate average values (from finalized items, excluding free/waste items for ROI)
    const nonFreeItems = finalizedItems.filter(
      (item) => parseFloat(item.purchasePrice || 0) > 0.01 && item.sold // Only sold items for ROI calculation
    )

    const avgROI = nonFreeItems.length
      ? nonFreeItems.reduce((sum, item) => sum + parseFloat(item.roi || 0), 0) /
        nonFreeItems.length
      : 0
    const avgDaysListed = finalizedItems.filter(item => item.sold).length // Only sold items have meaningful "days listed"
      ? finalizedItems.filter(item => item.sold).reduce((sum, item) => sum + (item.daysListed || 0), 0) /
        finalizedItems.filter(item => item.sold).length
      : 0

    // Calculate expense total
    const totalExpenses = safeExpenses.reduce(
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

    const costOfInventorySold = finalizedItems.reduce(
      (sum, item) => sum + parseFloat(item.purchasePrice || 0), // Include cost of waste items too
      0
    )

    const expectedRevenue = activeItems.reduce(
      (sum, item) =>
        sum +
        parseFloat(item.purchasePrice || 0) +
        parseFloat(item.expectedProfit || 0),
      0
    )

    const profitMargin =
      totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0

    return {
      activeListings: activeItems.length,
      inventoryValue: formatCurrency(inventoryValue),
      totalListedValue: formatCurrency(totalListedValue),
      potentialProfit: formatCurrency(potentialProfit),
      expectedRevenue: formatCurrency(expectedRevenue),

      soldItems: finalizedItems.filter(item => item.sold).length,
      wasteItems: finalizedItems.filter(item => item.status === "waste").length,
      totalFinalized: finalizedItems.length,
      totalRevenue: formatCurrency(totalRevenue),
      totalProfit: formatCurrency(totalProfit),
      averageROI: avgROI.toFixed(1),
      averageDaysListed: Math.round(avgDaysListed),
      costOfInventorySold: formatCurrency(costOfInventorySold),
      profitMargin: profitMargin.toFixed(1),

      totalEbayFees: formatCurrency(totalEbayFees),
      totalShippingCosts: formatCurrency(totalShippingCosts),
      totalExpenses: formatCurrency(totalExpenses),
      totalCost: formatCurrency(totalCost),
      netProfit: formatCurrency(netProfit),
      netProfitValue: netProfit,
    }
  }, [safeItems, safeExpenses])

  if (!metrics) return <div className={Styles.loading}>Loading metrics...</div>

  return (
    <div className={Styles.overviewWrapper}>

      {/* Cash Flow Chart Section */}
      <div className={Styles.chartCard}>
        <div className={Styles.chartHeader}>
          <h2>💰 Cash Flow Overview</h2>
          <div className={Styles.chartControls}>
            <div className={Styles.periodSelector}>
              {renderPeriodButton("day", "Daily")}
              {renderPeriodButton("week", "Weekly")}
              {renderPeriodButton("month", "Monthly")}
            </div>
            
            <div className={Styles.yearSelector}>
              <select 
                value={year} 
                onChange={(e) => setYear(Number(e.target.value))}
                className={Styles.yearSelect}
              >
                {finalAvailableYears.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className={Styles.chartContainer}>
          <CashFlowChart options={getCashFlowChartOptions()} />
        </div>
      </div>

      {/* Business Metrics */}
      <div className={Styles.metricsGrid}>
        <div className={Styles.card}>
          <div className={Styles.cardHeader}>
            <h2>📦 Inventory Status</h2>
          </div>
          <div className={Styles.cardBody}>
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
              <span>Expected Revenue:</span>
              <span>{metrics.expectedRevenue}</span>
            </div>
            <div className={Styles.metric}>
              <span>Potential Profit:</span>
              <span className={Styles.positive}>{metrics.potentialProfit}</span>
            </div>
          </div>
        </div>

        <div className={Styles.card}>
          <div className={Styles.cardHeader}>
            <h2>📈 Sales Performance</h2>
          </div>
          <div className={Styles.cardBody}>
            <div className={Styles.metric}>
              <span>Items Sold:</span>
              <span>{metrics.soldItems}</span>
            </div>
            {metrics.wasteItems > 0 && (
              <div className={Styles.metric}>
                <span>Items Waste:</span>
                <span className={Styles.negative}>{metrics.wasteItems}</span>
              </div>
            )}
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
        </div>

        <div className={Styles.card}>
          <div className={Styles.cardHeader}>
            <h2>💰 Profit Analysis</h2>
          </div>
          <div className={Styles.cardBody}>
            <div className={Styles.metric}>
              <span>Total Revenue:</span>
              <span>{metrics.totalRevenue}</span>
            </div>
            <div className={Styles.metric}>
              <span>Cost of Goods Finalized:</span>
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

      {/* Trip Report Component */}
      <TripReport items={safeItems} expenses={safeExpenses} />

      {/* Add bottom padding */}
      <div className={Styles.bottomPadding}></div>
    </div>
  )
}

export default Overview
