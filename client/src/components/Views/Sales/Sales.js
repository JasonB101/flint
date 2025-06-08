import React, { useState } from "react"
import Styles from "./Sales.module.scss"
import SalesChart from "./SalesChart/SalesChart"
import {
  YearSalesChart,
  YearSalesChartByWeek,
  YearSalesChartByMonth,
  MultiYearSalesChart,
} from "./SalesChart/ChartTemplates/chartOptions"

const Sales = (props) => {
  const [dateType, setDateType] = useState("week")
  const [year, setYear] = useState(new Date().getFullYear())
  const [profitTrue, setProfitState] = useState(true)

  const { items, expenses } = props
  const soldItems = items.filter((x) => x.sold)

  const salesInfo = assembleSalesInfo(items, expenses)

  // Get available years from sold items
  const availableYears = [...new Set(soldItems.map(item => 
    new Date(item.dateSold).getFullYear()
  ))].sort((a, b) => b - a)

  // Chart options based on selected period
  const getChartOptions = () => {
    switch (dateType) {
      case "day":
        return new YearSalesChart(year, soldItems, profitTrue)
      case "week":
        return new YearSalesChartByWeek(year, soldItems, profitTrue)
      case "month":
        return new YearSalesChartByMonth(year, soldItems, profitTrue)
      case "year":
        return new MultiYearSalesChart(availableYears, soldItems, profitTrue)
      default:
        return new YearSalesChartByWeek(year, soldItems, profitTrue)
    }
  }

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value)
  }

  // Calculate current year metrics
  const currentYearSales = soldItems.reduce((sales, item) => {
    let isThisYear = new Date(item.dateSold).getFullYear() === year
    return sales + (isThisYear ? Number(item.priceSold) : 0)
  }, 0)

  const currentYearProfit = soldItems.reduce((profit, item) => {
    let isThisYear = new Date(item.dateSold).getFullYear() === year
    return profit + (isThisYear ? Number(item.profit) : 0)
  }, 0)

  const currentYearItemsSold = soldItems.filter(item => 
    new Date(item.dateSold).getFullYear() === year
  ).length

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
            <span className={Styles.metricLabel}>Items Sold</span>
            <span className={Styles.metricValue}>{currentYearItemsSold}</span>
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
      let isThisYear = new Date(x.dateSold).getFullYear() === year
      if (x.sold && isThisYear) {
        salesInfo.YTDProfit += isThisYear ? x.profit : 0
        salesInfo.allItemsProfit += x.profit
        salesInfo.totalCost += purchasePrice + ebayFees + shippingCost
        salesInfo.totalSold += isThisYear ? 1 : 0
        salesInfo.profitPerItem = (
          salesInfo.allItemsProfit / salesInfo.totalSold
        ).toFixed(2)
        salesInfo.roi = Math.floor(
          (salesInfo.allItemsProfit / salesInfo.totalCost) * 100
        )
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
