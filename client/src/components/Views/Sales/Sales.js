import React, { useState, useEffect } from "react"
import Styles from "./Sales.module.scss"
import SalesChart from "./SalesChart/SalesChart"
import {
  YearSalesChart,
  YearSalesChartByWeek,
  YearSalesChartByMonth,
  MultiYearSalesChart,
  DaysRangeChart,
  MonthsRangeChart,
} from "./SalesChart/ChartTemplates/chartOptions"

const Sales = (props) => {
  // Initialize states from localStorage or defaults
  const [dateType, setDateType] = useState(() => {
    const savedDateType = localStorage.getItem('salesDateType')
    return savedDateType ? savedDateType : "week"
  })
  const [year, setYear] = useState(new Date().getFullYear())
  const [metricType, setMetricType] = useState(() => {
    const savedMetricType = localStorage.getItem('salesMetricType')
    return savedMetricType ? savedMetricType : "revenue"
  })

  // Save states to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('salesDateType', dateType)
  }, [dateType])

  useEffect(() => {
    localStorage.setItem('salesMetricType', metricType)
  }, [metricType])

  const { items } = props
  // Include both sold items AND waste items for accurate financial calculations
  const finalizedItems = items.filter((x) => x.sold === true || x.status === "waste")

  // Get available years from finalized items (sold or waste)
  const availableYears = [...new Set(finalizedItems.map(item => {
    // Use dateSold for sold items, dateWasted for waste items
    const relevantDate = item.sold ? item.dateSold : item.dateWasted
    return relevantDate ? new Date(relevantDate).getFullYear() : null
  }).filter(year => year !== null))].sort((a, b) => b - a)

  // Helper function to get date range for contextual metrics
  const getDateRange = () => {
    const now = new Date()
    const currentYear = now.getFullYear()
    
    switch (dateType) {
      case "7days":
        return {
          start: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
          end: now
        }
      case "30days":
        return {
          start: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
          end: now
        }
      case "90days":
        return {
          start: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000),
          end: now
        }
      case "6months":
        return {
          start: new Date(now.getTime() - 6 * 30 * 24 * 60 * 60 * 1000),
          end: now
        }
      case "12months":
        return {
          start: new Date(now.getTime() - 12 * 30 * 24 * 60 * 60 * 1000),
          end: now
        }
      case "day":
      case "week":
      case "month":
        return {
          start: new Date(year, 0, 1),
          end: year === currentYear ? now : new Date(year, 11, 31)
        }
      case "year":
        // For yearly view, show data for the selected year only
        return {
          start: new Date(year, 0, 1),
          end: year === currentYear ? now : new Date(year, 11, 31)
        }
      default:
        return {
          start: new Date(year, 0, 1),
          end: year === currentYear ? now : new Date(year, 11, 31)
        }
    }
  }

  // Chart options based on selected period
  const getChartOptions = () => {
    const profitTrue = metricType === "profit"
    const salesTrue = metricType === "sales"
    
    switch (dateType) {
      case "day":
        return new YearSalesChart(year, finalizedItems, profitTrue, salesTrue)
      case "week":
        return new YearSalesChartByWeek(year, finalizedItems, profitTrue, salesTrue)
      case "month":
        return new YearSalesChartByMonth(year, finalizedItems, profitTrue, salesTrue)
      case "year":
        return new MultiYearSalesChart(availableYears, finalizedItems, profitTrue, salesTrue)
      case "7days":
      case "30days":
      case "90days":
        const days = parseInt(dateType.replace('days', ''))
        return new DaysRangeChart(days, finalizedItems, profitTrue, salesTrue)
      case "6months":
      case "12months":
        const months = parseInt(dateType.replace('months', ''))
        return new MonthsRangeChart(months, finalizedItems, profitTrue, salesTrue)
      default:
        return new YearSalesChartByWeek(year, finalizedItems, profitTrue, salesTrue)
    }
  }

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value)
  }

  // Calculate contextual metrics based on selected time period
  const getContextualMetrics = () => {
    const { start, end } = getDateRange()
    
    const filteredItems = finalizedItems.filter(item => {
      const relevantDate = item.sold ? item.dateSold : item.dateWasted
      if (!relevantDate) return false
      const itemDate = new Date(relevantDate)
      return itemDate >= start && itemDate <= end
    })

    const sales = filteredItems.reduce((sum, item) => {
      return sum + (item.sold ? 1 : 0)
    }, 0)

    const revenue = filteredItems.reduce((sum, item) => {
      return sum + (item.sold ? Number(item.priceSold) : 0)
    }, 0)

    const profit = filteredItems.reduce((sum, item) => {
      return sum + Number(item.profit)
    }, 0)

    const itemsFinalized = filteredItems.length

    return { sales, revenue, profit, itemsFinalized }
  }

  const contextualMetrics = getContextualMetrics()

  // Get contextual sales total label
  const getSalesTotalLabel = () => {
    const currentYear = new Date().getFullYear()
    switch (dateType) {
      case "day": return `${year} Daily Sales`
      case "week": return `${year} Weekly Sales`
      case "month": return `${year} Monthly Sales`
      case "year": return year === currentYear ? `${year} Sales (YTD)` : `${year} Sales`
      case "7days": return "7-Day Sales"
      case "30days": return "30-Day Sales"
      case "90days": return "90-Day Sales"
      case "6months": return "6-Month Sales"
      case "12months": return "12-Month Sales"
      default: return "Total Sales"
    }
  }

  // Get contextual revenue total label
  const getRevenueTotalLabel = () => {
    const currentYear = new Date().getFullYear()
    switch (dateType) {
      case "day": return `${year} Daily Revenue`
      case "week": return `${year} Weekly Revenue`
      case "month": return `${year} Monthly Revenue`
      case "year": return year === currentYear ? `${year} Revenue (YTD)` : `${year} Revenue`
      case "7days": return "7-Day Revenue"
      case "30days": return "30-Day Revenue"
      case "90days": return "90-Day Revenue"
      case "6months": return "6-Month Revenue"
      case "12months": return "12-Month Revenue"
      default: return "Total Revenue"
    }
  }

  // Get contextual profit total label
  const getProfitTotalLabel = () => {
    const currentYear = new Date().getFullYear()
    switch (dateType) {
      case "day": return `${year} Daily Profit`
      case "week": return `${year} Weekly Profit`
      case "month": return `${year} Monthly Profit`
      case "year": return year === currentYear ? `${year} Profit (YTD)` : `${year} Profit`
      case "7days": return "7-Day Profit"
      case "30days": return "30-Day Profit"
      case "90days": return "90-Day Profit"
      case "6months": return "6-Month Profit"
      case "12months": return "12-Month Profit"
      default: return "Total Profit"
    }
  }

  // Get contextual sold items label
  const getSoldItemsLabel = () => {
    const currentYear = new Date().getFullYear()
    switch (dateType) {
      case "day": return "Avg Daily Sales"
      case "week": return "Avg Weekly Sales"
      case "month": return "Avg Monthly Sales"
      case "year": return year === currentYear ? "Items Sold (YTD)" : "Items Sold"
      case "7days": return "Items Sold (7 Days)"
      case "30days": return "Items Sold (30 Days)"
      case "90days": return "Items Sold (90 Days)"
      case "6months": return "Items Sold (6 Months)"
      case "12months": return "Items Sold (12 Months)"
      default: return "Items Sold"
    }
  }

  // Get contextual sold items value
  const getSoldItemsValue = () => {
    const { start, end } = getDateRange()
    const diffTime = Math.abs(end - start)
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    switch (dateType) {
      case "day":
        return diffDays > 0 ? Math.round(contextualMetrics.sales / diffDays) : 0
      case "week":
        const weeks = Math.ceil(diffDays / 7)
        return weeks > 0 ? Math.round(contextualMetrics.sales / weeks) : 0
      case "month":
        const months = Math.ceil(diffDays / 30)
        return months > 0 ? Math.round(contextualMetrics.sales / months) : 0
      default:
        return contextualMetrics.sales
    }
  }

  // Get contextual average profit label
  const getAverageProfitLabel = () => {
    switch (dateType) {
      case "day": return "Average Profit/Day"
      case "week": return "Average Profit/Week"
      case "month": return "Average Profit/Month"
      case "year": return `${year} Total Profit`
      case "7days":
      case "30days":
      case "90days": return "Average Profit/Day"
      case "6months":
      case "12months": return "Average Profit/Month"
      default: return "Average Profit/Day"
    }
  }

  // Get contextual average profit value
  const getAverageProfitValue = () => {
    const { start, end } = getDateRange()
    const diffTime = Math.abs(end - start)
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) return 0
    
    switch (dateType) {
      case "day":
        return contextualMetrics.profit / diffDays
      case "week":
        const weeks = Math.ceil(diffDays / 7)
        return weeks > 0 ? contextualMetrics.profit / weeks : 0
      case "month":
        const months = Math.ceil(diffDays / 30)
        return months > 0 ? contextualMetrics.profit / months : 0
      case "year":
        // For yearly view, return total profit for that year
        return contextualMetrics.profit
      case "6months":
      case "12months":
        const monthsRange = Math.ceil(diffDays / 30)
        return monthsRange > 0 ? contextualMetrics.profit / monthsRange : 0
      default:
        return contextualMetrics.profit / diffDays
    }
  }

  // Get contextual average sales label
  const getAverageSalesLabel = () => {
    switch (dateType) {
      case "day": return "Average Sales/Day"
      case "week": return "Average Sales/Week"
      case "month": return "Average Sales/Month"
      case "year": return `${year} Total Sales`
      case "7days":
      case "30days":
      case "90days": return "Average Sales/Day"
      case "6months":
      case "12months": return "Average Sales/Month"
      default: return "Average Sales/Day"
    }
  }

  // Get contextual average sales value
  const getAverageSalesValue = () => {
    const { start, end } = getDateRange()
    const diffTime = Math.abs(end - start)
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) return 0
    
    switch (dateType) {
      case "day":
        return contextualMetrics.revenue / diffDays
      case "week":
        const weeks = Math.ceil(diffDays / 7)
        return weeks > 0 ? contextualMetrics.revenue / weeks : 0
      case "month":
        const months = Math.ceil(diffDays / 30)
        return months > 0 ? contextualMetrics.revenue / months : 0
      case "year":
        // For yearly view, return total sales (revenue) for that year
        return contextualMetrics.revenue
      case "6months":
      case "12months":
        const monthsRange = Math.ceil(diffDays / 30)
        return monthsRange > 0 ? contextualMetrics.revenue / monthsRange : 0
      default:
        return contextualMetrics.revenue / diffDays
    }
  }

  // Get contextual average revenue label
  const getAverageRevenueLabel = () => {
    switch (dateType) {
      case "day": return "Average Revenue/Day"
      case "week": return "Average Revenue/Week"
      case "month": return "Average Revenue/Month"
      case "year": return `${year} Total Revenue`
      case "7days":
      case "30days":
      case "90days": return "Average Revenue/Day"
      case "6months":
      case "12months": return "Average Revenue/Month"
      default: return "Average Revenue/Day"
    }
  }

  // Get contextual average revenue value
  const getAverageRevenueValue = () => {
    const { start, end } = getDateRange()
    const diffTime = Math.abs(end - start)
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) return 0
    
    switch (dateType) {
      case "day":
        return contextualMetrics.revenue / diffDays
      case "week":
        const weeks = Math.ceil(diffDays / 7)
        return weeks > 0 ? contextualMetrics.revenue / weeks : 0
      case "month":
        const months = Math.ceil(diffDays / 30)
        return months > 0 ? contextualMetrics.revenue / months : 0
      case "year":
        // For yearly view, return total revenue for that year
        return contextualMetrics.revenue
      case "6months":
      case "12months":
        const monthsRange = Math.ceil(diffDays / 30)
        return monthsRange > 0 ? contextualMetrics.revenue / monthsRange : 0
      default:
        return contextualMetrics.revenue / diffDays
    }
  }

  // Calculate yearly projections for current year
  const getYearlyProjections = () => {
    const currentYear = new Date().getFullYear()
    const now = new Date()
    
    if (dateType !== "year" || year !== currentYear) {
      return null
    }
    
    // Calculate days elapsed and total days in year
    const startOfYear = new Date(currentYear, 0, 1)
    const daysElapsed = Math.ceil((now - startOfYear) / (1000 * 60 * 60 * 24))
    
    // Check if it's a leap year
    const isLeapYear = (currentYear % 4 === 0 && currentYear % 100 !== 0) || (currentYear % 400 === 0)
    const totalDaysInYear = isLeapYear ? 366 : 365
    
    // Calculate projection multiplier
    const projectionMultiplier = totalDaysInYear / daysElapsed
    
    // Project based on current YTD performance
    const projectedRevenue = contextualMetrics.revenue * projectionMultiplier
    const projectedProfit = contextualMetrics.profit * projectionMultiplier
    const projectedSales = Math.round(contextualMetrics.sales * projectionMultiplier)
    
    return {
      revenue: projectedRevenue,
      profit: projectedProfit,
      sales: projectedSales,
      multiplier: projectionMultiplier
    }
  }

  const projections = getYearlyProjections()

  const renderPeriodButton = (period, label) => (
    <button
      key={period}
      onClick={() => setDateType(period)}
      className={`${Styles.periodButton} ${dateType === period ? Styles.active : ''}`}
    >
      {label}
    </button>
  )

  const renderMetricButton = (metric, label) => (
    <button
      key={metric}
      onClick={() => setMetricType(metric)}
      className={`${Styles.toggleButton} ${metricType === metric ? Styles.active : ''}`}
    >
      {label}
    </button>
  )

  // Get chart options once to avoid multiple calls
  const chartOptions = getChartOptions()

  return (
    <div className={Styles.wrapper}>
      {/* Chart Section */}
      <div className={Styles.chartCard}>
        <div className={Styles.chartHeader}>
          <h2>{metricType === "sales" ? "Sales" : metricType === "revenue" ? "Revenue" : "Profit"} Trends</h2>
          <div className={Styles.chartControls}>
            {/* Metric Type Toggle - Full Width Top Row */}
            <div className={Styles.metricTypeToggle}>
              {renderMetricButton("sales", "Sales")}
              {renderMetricButton("revenue", "Revenue")}
              {renderMetricButton("profit", "Profit")}
            </div>
            
            {/* Period Selectors - Two 48% Width Sections Side by Side */}
            <div className={Styles.periodRow}>
              <div className={Styles.periodSelector}>
                {renderPeriodButton("day", "Daily")}
                {renderPeriodButton("week", "Weekly")}
                {renderPeriodButton("month", "Monthly")}
                {renderPeriodButton("year", "Yearly")}
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
              
              <div className={Styles.periodSelector}>
                {renderPeriodButton("7days", "7 Days")}
                {renderPeriodButton("30days", "30 Days")}
                {renderPeriodButton("90days", "90 Days")}
                {renderPeriodButton("6months", "6 Months")}
                {renderPeriodButton("12months", "12 Months")}
              </div>
            </div>
          </div>
        </div>

        <div className={Styles.chartContainer}>
          <SalesChart options={chartOptions} />
        </div>

        {/* Summary Section - Right below chart */}
        <div className={Styles.summarySection}>
          {metricType === "sales" && (
            <>
              <div className={Styles.summaryItem}>
                <span className={Styles.summaryLabel}>{getSalesTotalLabel()}:</span>
                <span className={Styles.summaryValue}>{formatCurrency(contextualMetrics.revenue)}</span>
              </div>
              {!projections && dateType !== "year" && (
                <div className={Styles.summaryItem}>
                  <span className={Styles.summaryLabel}>{getAverageSalesLabel()}:</span>
                  <span className={Styles.summaryValue}>{formatCurrency(getAverageSalesValue())}</span>
                </div>
              )}
              <div className={Styles.summaryItem}>
                <span className={Styles.summaryLabel}>{getSoldItemsLabel()}:</span>
                <span className={Styles.summaryValue}>{getSoldItemsValue()}</span>
              </div>
              {projections && (
                <>
                  <div className={Styles.summaryItem}>
                    <span className={Styles.summaryLabel}>Projected {year} Sales:</span>
                    <span className={Styles.summaryValue}>{formatCurrency(projections.revenue)}</span>
                  </div>
                  <div className={Styles.summaryItem}>
                    <span className={Styles.summaryLabel}>Projected Items Sold:</span>
                    <span className={Styles.summaryValue}>{projections.sales}</span>
                  </div>
                </>
              )}
            </>
          )}
          
          {metricType === "revenue" && (
            <>
              <div className={Styles.summaryItem}>
                <span className={Styles.summaryLabel}>{getRevenueTotalLabel()}:</span>
                <span className={Styles.summaryValue}>{formatCurrency(contextualMetrics.revenue)}</span>
              </div>
              {!projections && dateType !== "year" && (
                <div className={Styles.summaryItem}>
                  <span className={Styles.summaryLabel}>{getAverageRevenueLabel()}:</span>
                  <span className={Styles.summaryValue}>{formatCurrency(getAverageRevenueValue())}</span>
                </div>
              )}
              <div className={Styles.summaryItem}>
                <span className={Styles.summaryLabel}>{getSoldItemsLabel()}:</span>
                <span className={Styles.summaryValue}>{getSoldItemsValue()}</span>
              </div>
              {projections && (
                <>
                  <div className={Styles.summaryItem}>
                    <span className={Styles.summaryLabel}>Projected {year} Revenue:</span>
                    <span className={Styles.summaryValue}>{formatCurrency(projections.revenue)}</span>
                  </div>
                  <div className={Styles.summaryItem}>
                    <span className={Styles.summaryLabel}>Projected Items Sold:</span>
                    <span className={Styles.summaryValue}>{projections.sales}</span>
                  </div>
                </>
              )}
            </>
          )}
          
          {metricType === "profit" && (
            <>
              <div className={Styles.summaryItem}>
                <span className={Styles.summaryLabel}>{getProfitTotalLabel()}:</span>
                <span className={`${Styles.summaryValueProfit}`}>{formatCurrency(contextualMetrics.profit)}</span>
              </div>
              {!projections && dateType !== "year" && (
                <div className={Styles.summaryItem}>
                  <span className={Styles.summaryLabel}>{getAverageProfitLabel()}:</span>
                  <span className={`${Styles.summaryValueProfit}`}>{formatCurrency(getAverageProfitValue())}</span>
                </div>
              )}
              <div className={Styles.summaryItem}>
                <span className={Styles.summaryLabel}>{getSoldItemsLabel()}:</span>
                <span className={Styles.summaryValue}>{getSoldItemsValue()}</span>
              </div>
              {projections && (
                <>
                  <div className={Styles.summaryItem}>
                    <span className={Styles.summaryLabel}>Projected {year} Profit:</span>
                    <span className={`${Styles.summaryValueProfit}`}>{formatCurrency(projections.profit)}</span>
                  </div>
                  <div className={Styles.summaryItem}>
                    <span className={Styles.summaryLabel}>Projected Items Sold:</span>
                    <span className={Styles.summaryValue}>{projections.sales}</span>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>

      {/* Add bottom padding */}
      <div className={Styles.bottomPadding}></div>
    </div>
  )
}

export default Sales
