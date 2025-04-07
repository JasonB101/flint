import React, { useState, useEffect } from "react"
import DatePicker from "react-datepicker"
import "react-datepicker/dist/react-datepicker.css"
import Styles from "./TripReport.module.scss"

const TripReport = ({ items, expenses }) => {
  const [startDate, setStartDate] = useState(
    new Date(new Date().setDate(new Date().getDate() - 30))
  )
  const [endDate, setEndDate] = useState(new Date())
  const [applyDateFilter, setApplyDateFilter] = useState(false)
  const [metrics, setMetrics] = useState({
    tripPartsCost: "$0.00",
    tripExpensesTotal: "$0.00",
    tripTotalCost: "$0.00",
    tripRevenueReceived: "$0.00",
    tripROI: "0.0",
    tripTotalItems: 0,
    tripSoldItems: 0,
    tripItemsRemaining: 0,
    tripRemainingInventory: "$0.00",
    groupedExpenses: [],
  })
  const getHighlightedDates = () => {
    // Create a Map to store dates that have items or expenses
    const highlightedDatesMap = new Map()

    if (items && items.length) {
      // Add dates with items
      items.forEach((item) => {
        if (item.datePurchased) {
          try {
            const dateStr = new Date(item.datePurchased)
              .toISOString()
              .split("T")[0]
            highlightedDatesMap.set(dateStr, true)
          } catch (e) {
            // Skip invalid dates
          }
        }
      })
    }

    if (expenses && expenses.length) {
      // Add dates with expenses
      expenses.forEach((expense) => {
        if (expense.date) {
          try {
            const dateStr = new Date(expense.date).toISOString().split("T")[0]
            highlightedDatesMap.set(dateStr, true)
          } catch (e) {
            // Skip invalid dates
          }
        }
      })
    }

    return highlightedDatesMap
  }

  // Use the Map to check if a date should be highlighted
  const highlightedDatesMap = getHighlightedDates()

  // Add this function to check if a date should be highlighted
  const getDateClass = (date) => {
    const dateStr = date.toISOString().split("T")[0]
    return highlightedDatesMap.has(dateStr) ? Styles.highlightedDate : null
  }

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(value)
  }

  const handleApplyFilter = () => {
    setApplyDateFilter(true)
  }

  const handleResetFilter = () => {
    setApplyDateFilter(false)
  }

  // Calculate metrics when the filter is applied or dates/items/expenses change
  useEffect(() => {
    if (!items || !expenses || !applyDateFilter) return

    // Filter items by purchase date in the trip range
    const tripPurchases = items.filter((item) => {
      if (!item.datePurchased) return false

      try {
        const datePurchased = new Date(item.datePurchased)
        const datePurchasedStr = datePurchased.toISOString().split("T")[0]

        const startDateStr = startDate.toISOString().split("T")[0]
        const endDateStr = endDate.toISOString().split("T")[0]

        return (
          datePurchasedStr >= startDateStr && datePurchasedStr <= endDateStr
        )
      } catch (e) {
        console.error("Date comparison error:", e)
        return false
      }
    })

    // Filter expenses within trip date range
    const tripExpenses = expenses.filter((expense) => {
      if (!expense.date) return false

      try {
        const expenseDate = new Date(expense.date)
        const expenseDateStr = expenseDate.toISOString().split("T")[0]

        const startDateStr = startDate.toISOString().split("T")[0]
        const endDateStr = endDate.toISOString().split("T")[0]

        return expenseDateStr >= startDateStr && expenseDateStr <= endDateStr
      } catch (e) {
        console.error("Expense date comparison error:", e)
        return false
      }
    })

    // Calculate TOTAL potential revenue from ALL trip items (sold and unsold)
    const tripPotentialRevenue = tripPurchases.reduce(
      (sum, item) =>
        sum +
        parseFloat(item.purchasePrice || 0) +
        // Use actual sale price for sold items, expected profit for unsold items
        (item.sold
          ? parseFloat(item.profit || 0)
          : parseFloat(item.expectedProfit || 0)),
      0
    )

    // Group expenses by title (case-insensitive)
    const expenseGroups = {}
    tripExpenses.forEach((expense) => {
      const key = (expense.title || "Other").toLowerCase()
      if (!expenseGroups[key]) {
        expenseGroups[key] = {
          title: expense.title || "Other",
          amount: 0,
          count: 0,
        }
      }
      expenseGroups[key].amount += parseFloat(expense.amount || 0)
      expenseGroups[key].count++
    })

    // Convert to array and sort by amount (highest first)
    const groupedExpenses = Object.values(expenseGroups)
      .map((group) => ({
        ...group,
        formattedAmount: formatCurrency(group.amount),
      }))
      .sort((a, b) => b.amount - a.amount)

    // Cost of all parts purchased during the trip
    const tripPartsCost = tripPurchases.reduce(
      (sum, item) => sum + parseFloat(item.purchasePrice || 0),
      0
    )

    // Total expenses during the trip
    const tripExpensesTotal = tripExpenses.reduce(
      (sum, expense) => sum + parseFloat(expense.amount || 0),
      0
    )

    // Total trip investment
    const tripTotalCost = tripPartsCost + tripExpensesTotal

    // Revenue so far from items purchased during this trip and later sold
    const tripRevenueReceived = tripPurchases
      .filter((item) => item.sold)
      .reduce(
        (sum, item) =>
          sum +
          parseFloat(item.profit || 0) +
          parseFloat(item.purchasePrice || 0),
        0
      )

    // Calculate trip ROI so far
    const tripROI =
      tripTotalCost > 0
        ? ((tripRevenueReceived / tripTotalCost) * 100).toFixed(1)
        : "0.0"

    // Items purchased but not yet sold
    const tripItemsRemaining = tripPurchases.filter((item) => !item.sold).length

    // Remaining inventory value from trip
    const tripRemainingInventory = tripPurchases
      .filter((item) => !item.sold)
      .reduce((sum, item) => sum + parseFloat(item.purchasePrice || 0), 0)

    // Calculate potential ROI (what could be achieved when all items sell)
    const potentialROI =
      tripTotalCost > 0
        ? ((tripPotentialRevenue / tripTotalCost) * 100).toFixed(1)
        : "0.0"

    // Update metrics state
    setMetrics({
      tripPartsCost: formatCurrency(tripPartsCost),
      tripExpensesTotal: formatCurrency(tripExpensesTotal),
      tripTotalCost: formatCurrency(tripTotalCost),
      tripRevenueReceived: formatCurrency(tripRevenueReceived),
      tripROI: tripROI,
      tripPotentialROI: potentialROI,
      tripTotalItems: tripPurchases.length,
      tripSoldItems: tripPurchases.filter((item) => item.sold).length,
      tripItemsRemaining: tripItemsRemaining,
      tripRemainingInventory: formatCurrency(tripRemainingInventory),
      // Used for calculations
      rawTripTotalCost: tripTotalCost,
      rawTripItemsRemaining: tripItemsRemaining,
      tripPotentialRevenue: formatCurrency(tripPotentialRevenue),
      // Grouped expenses for display
      groupedExpenses,
    })
  }, [items, expenses, startDate, endDate, applyDateFilter])

  return (
    <div className={Styles.tripReportCard}>
      <h2>Trip Report</h2>

      <div className={Styles.tripReportHeader}>
        {/* Left side - Date picker */}
        <div className={Styles.dateFilterContainer}>
          <div className={Styles.datePickerGroup}>
            <label>Trip Start:</label>
            <DatePicker
              selected={startDate}
              onChange={(date) => setStartDate(date)}
              selectsStart
              startDate={startDate}
              endDate={endDate}
              className={Styles.datePicker}
              dateFormat="MM/dd/yyyy"
              dayClassName={getDateClass}
            />

            <DatePicker
              selected={endDate}
              onChange={(date) => setEndDate(date)}
              selectsEnd
              startDate={startDate}
              endDate={endDate}
              minDate={startDate}
              className={Styles.datePicker}
              dateFormat="MM/dd/yyyy"
              dayClassName={getDateClass}
            />
          </div>

          <div className={Styles.dateFilterButtons}>
            <button className={Styles.applyButton} onClick={handleApplyFilter}>
              Calculate Trip
            </button>
            {applyDateFilter && (
              <button
                className={Styles.resetButton}
                onClick={handleResetFilter}
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Right side - Summary info */}
        {applyDateFilter && metrics.tripTotalItems > 0 && (
          <div className={Styles.tripSummary}>
            <div className={Styles.summaryHeader}>
              Trip Summary: {startDate.toLocaleDateString()} -{" "}
              {endDate.toLocaleDateString()}
            </div>

            <div className={Styles.summaryMetricsGrid}>
              <div className={Styles.summaryMetric}>
                <span>Potential Revenue</span>
                <span className={Styles.potential}>
                  {metrics.tripPotentialRevenue}
                </span>
              </div>
              <div className={Styles.summaryMetric}>
                <span>Total Investment</span>
                <span className={Styles.highlight}>
                  {metrics.tripTotalCost}
                </span>
              </div>
              <div className={Styles.summaryMetric}>
                <span>Items Cost</span>
                <span>{metrics.tripPartsCost}</span>
              </div>
              <div className={Styles.summaryMetric}>
                <span>Items Sold</span>
                <span>
                  {metrics.tripSoldItems} / {metrics.tripTotalItems}
                </span>
              </div>
              <div className={Styles.summaryMetric}>
                <span>Revenue Received</span>
                <span>{metrics.tripRevenueReceived}</span>
              </div>
              <div className={Styles.summaryMetric}>
                <span>Current / Potential ROI</span>
                <span>
                  <span
                    className={`${Styles.currentValue} ${
                      parseFloat(metrics.tripROI) > 0
                        ? Styles.positive
                        : Styles.negative
                    }`}
                  >
                    {metrics.tripROI}%
                  </span>
                  {" / "}
                  <span className={Styles.potentialHighlight}>
                    {metrics.tripPotentialROI}%
                  </span>
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className={Styles.tripReportContent}>
        {!applyDateFilter ? (
          <div className={Styles.noFilterMessage}>
            Select a date range and click "Calculate Trip" to see trip metrics.
          </div>
        ) : metrics.tripTotalItems === 0 &&
          metrics.groupedExpenses.length === 0 ? (
          <div className={Styles.noDataMessage}>
            No items or expenses found in the selected date range.
          </div>
        ) : (
          <div className={Styles.expensesSection}>
            <h3 className={Styles.columnHeader}>Expense Breakdown</h3>
            <div className={Styles.expenseList}>
              {metrics.groupedExpenses.length === 0 ? (
                <div className={Styles.noExpenses}>
                  No expenses for this trip
                </div>
              ) : (
                metrics.groupedExpenses.map((group, index) => (
                  <div key={index} className={Styles.expenseItem}>
                    <div className={Styles.expenseTitle}>
                      {group.title} {group.count > 1 ? `(${group.count})` : ""}
                    </div>
                    <div className={Styles.expenseAmount}>
                      {group.formattedAmount}
                    </div>
                  </div>
                ))
              )}
            </div>
            {metrics.groupedExpenses.length > 0 && (
              <div className={Styles.totalExpenses}>
                <span>Total Expenses:</span>
                <span>{metrics.tripExpensesTotal}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default TripReport
