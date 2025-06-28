import React, { useState, useEffect } from "react"
import Styles from "./Sales.module.scss"
import SalesChart from "./SalesChart/SalesChart"
import {
  YearSalesChart,
  YearSalesChartByWeek,
  YearSalesChartByMonth,
  MultiYearSalesChart,
} from "./SalesChart/ChartTemplates/chartOptions"

const Sales = (props) => {
  // Initialize dateType from localStorage or default to "week"
  const [dateType, setDateType] = useState(() => {
    const savedDateType = localStorage.getItem('salesDateType')
    return savedDateType ? savedDateType : "week"
  })
  const [year, setYear] = useState(new Date().getFullYear())
  const [profitTrue, setProfitState] = useState(true)

  // Save dateType to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('salesDateType', dateType)
  }, [dateType])

  const { items, expenses } = props
  // Include both sold items AND waste items for accurate financial calculations
  const finalizedItems = items.filter((x) => x.sold === true || x.status === "waste")

  const salesInfo = assembleSalesInfo(items, expenses)

  // Get available years from finalized items (sold or waste)
  const availableYears = [...new Set(finalizedItems.map(item => {
    // Use dateSold for sold items, dateWasted for waste items
    const relevantDate = item.sold ? item.dateSold : item.dateWasted
    return relevantDate ? new Date(relevantDate).getFullYear() : null
  }).filter(year => year !== null))].sort((a, b) => b - a)

  // Chart options based on selected period
  const getChartOptions = () => {
    switch (dateType) {
      case "day":
        return new YearSalesChart(year, finalizedItems, profitTrue)
      case "week":
        return new YearSalesChartByWeek(year, finalizedItems, profitTrue)
      case "month":
        return new YearSalesChartByMonth(year, finalizedItems, profitTrue)
      case "year":
        return new MultiYearSalesChart(availableYears, finalizedItems, profitTrue)
      default:
        return new YearSalesChartByWeek(year, finalizedItems, profitTrue)
    }
  }

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value)
  }

  // Calculate current year metrics (including waste items)
  const currentYearSales = finalizedItems.reduce((sales, item) => {
    const relevantDate = item.sold ? item.dateSold : item.dateWasted
    let isThisYear = relevantDate && new Date(relevantDate).getFullYear() === year
    // Only count revenue for actually sold items (waste items contribute $0 revenue)
    return sales + (isThisYear && item.sold ? Number(item.priceSold) : 0)
  }, 0)

  const currentYearProfit = finalizedItems.reduce((profit, item) => {
    const relevantDate = item.sold ? item.dateSold : item.dateWasted
    let isThisYear = relevantDate && new Date(relevantDate).getFullYear() === year
    // Include both profit from sales AND losses from waste
    return profit + (isThisYear ? Number(item.profit) : 0)
  }, 0)

  const currentYearItemsFinalized = finalizedItems.filter(item => {
    const relevantDate = item.sold ? item.dateSold : item.dateWasted
    return relevantDate && new Date(relevantDate).getFullYear() === year
  }).length

  // Projection calculation
  function getProjected(value) {
    const now = new Date()
    const start = new Date(now.getFullYear(), 0, 0)
    const diff = now - start
    const oneDay = 1000 * 60 * 60 * 24
    const dayOfYear = Math.floor(diff / oneDay)
    const average = (value / dayOfYear)
    const remainingDays = 366 - dayOfYear
    const projected = value + (remainingDays * average)
    return formatCurrency(projected)
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

  // Get chart options once to avoid multiple calls
  const chartOptions = getChartOptions()

  return (
    <div className={Styles.wrapper}>
      {/* Chart Section - Moved to top */}
      <div className={Styles.chartCard}>
        <div className={Styles.chartHeader}>
          <h2>Sales Trends</h2>
          <div className={Styles.chartControls}>
            <div className={Styles.periodSelector}>
              {renderPeriodButton("day", "Daily")}
              {renderPeriodButton("week", "Weekly")}
              {renderPeriodButton("month", "Monthly")}
              {renderPeriodButton("year", "Yearly")}
            </div>
            
            {dateType !== "year" && (
              <div className={Styles.yearSelector}>
                <select 
                  value={year} 
                  onChange={(e) => setYear(Number(e.target.value))}
                  className={Styles.yearSelect}
                >
                  {availableYears.map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            )}
            
            <div className={Styles.dataTypeToggle}>
              <button
                onClick={() => setProfitState(false)}
                className={`${Styles.toggleButton} ${!profitTrue ? Styles.active : ''}`}
              >
                Revenue
              </button>
              <button
                onClick={() => setProfitState(true)}
                className={`${Styles.toggleButton} ${profitTrue ? Styles.active : ''}`}
              >
                Profit
              </button>
            </div>
          </div>
        </div>

        <div className={Styles.chartContainer}>
          <SalesChart options={chartOptions} />
        </div>
      </div>

      {/* Key Metrics Cards - Moved below chart */}
      <div className={Styles.metricsGrid}>
        <div className={Styles.metricCard}>
          <div className={Styles.metricIcon}>📊</div>
          <div className={Styles.metricContent}>
            <span className={Styles.metricLabel}>Items Finalized</span>
            <span className={Styles.metricValue}>{currentYearItemsFinalized}</span>
          </div>
        </div>
        
        <div className={Styles.metricCard}>
          <div className={Styles.metricIcon}>💰</div>
          <div className={Styles.metricContent}>
            <span className={Styles.metricLabel}>Revenue</span>
            <span className={Styles.metricValue}>{formatCurrency(currentYearSales)}</span>
          </div>
        </div>
        
        <div className={Styles.metricCard}>
          <div className={Styles.metricIcon}>📈</div>
          <div className={Styles.metricContent}>
            <span className={Styles.metricLabel}>Profit ({year})</span>
            <span className={`${Styles.metricValue} ${Styles.profit}`}>
              {formatCurrency(currentYearProfit)}
            </span>
          </div>
        </div>
        
        <div className={Styles.metricCard}>
          <div className={Styles.metricIcon}>🎯</div>
          <div className={Styles.metricContent}>
            <span className={Styles.metricLabel}>Avg ROI</span>
            <span className={`${Styles.metricValue} ${Styles.roi}`}>
              {salesInfo.roi}%
            </span>
          </div>
        </div>
      </div>

      <div className={Styles.projectionSection}>
        <div className={Styles.projectionCard}>
          <div className={Styles.projectionContent}>
            <span className={Styles.projectionLabel}>Projected {year} Revenue</span>
            <span className={Styles.projectionValue}>{getProjected(currentYearSales)}</span>
          </div>
        </div>
        <div className={Styles.projectionCard}>
          <div className={Styles.projectionContent}>
            <span className={Styles.projectionLabel}>Projected {year} Profit</span>
            <span className={`${Styles.projectionValue} ${Styles.profit}`}>
              {getProjected(currentYearProfit)}
            </span>
          </div>
        </div>
      </div>

      {/* Add bottom padding */}
      <div className={Styles.bottomPadding}></div>
    </div>
  )

  function assembleSalesInfo(items, expenses) {
    const salesObj = {
      YTDProfit: 0,
      allItemsProfit: 0,
      profitPerItem: 0,
      totalSold: 0,
      totalCost: 0,
      roi: 0,
      inventoryCost: 0,
    }

    const expenseTotal = expenses.length
      ? expenses.reduce((sum, x) => {
          const isThisYear = new Date(x.date).getFullYear() === year
          return isThisYear ? sum + x.amount : sum
        }, 0)
      : 0

    const info = items.reduce((salesInfo, x) => {
      const { purchasePrice, ebayFees, shippingCost } = x
      const relevantDate = x.sold ? x.dateSold : x.dateWasted
      let isThisYear = relevantDate && new Date(relevantDate).getFullYear() === year
      
      // Include both sold items AND waste items in financial calculations
      if ((x.sold || x.status === "waste") && isThisYear) {
        salesInfo.YTDProfit += isThisYear ? x.profit : 0
        salesInfo.allItemsProfit += x.profit
        salesInfo.totalCost += purchasePrice + (ebayFees || 0) + (shippingCost || 0)
        salesInfo.totalSold += isThisYear ? 1 : 0
        salesInfo.profitPerItem = salesInfo.totalSold > 0 ? (
          salesInfo.allItemsProfit / salesInfo.totalSold
        ).toFixed(2) : "0.00"
        salesInfo.roi = salesInfo.totalCost > 0 ? Math.floor(
          (salesInfo.allItemsProfit / salesInfo.totalCost) * 100
        ) : 0
      } else {
        if (x.listed && isThisYear) {
          salesInfo.inventoryCost += x.purchasePrice
        }
        salesInfo.YTDProfit -= isThisYear
          ? x.purchasePrice + (x.shippingCost ? x.shippingCost : 0)
          : 0
      }

      return salesInfo
    }, salesObj)
    info.YTDProfit = info.YTDProfit - expenseTotal - info.inventoryCost
    return info
  }
}

export default Sales
