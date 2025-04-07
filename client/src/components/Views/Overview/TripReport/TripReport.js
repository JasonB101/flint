import React, { useState, useEffect, useMemo } from "react"
import DatePicker from "react-datepicker"
import "react-datepicker/dist/react-datepicker.css"
import Styles from "./TripReport.module.scss"

const TripReport = ({ items, expenses }) => {
  // ===== Helper functions =====
  const formatCurrency = (value) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(value)
  }

  // ===== Date detection logic =====
  const detectMostRecentTripDates = () => {
    // Extract all relevant dates
    const allDates = []

    // Add item purchase dates
    if (items && items.length) {
      items.forEach((item) => {
        if (item.datePurchased) {
          try {
            const date = new Date(item.datePurchased)
            if (!isNaN(date.getTime())) {
              allDates.push({ date, type: "item" })
            }
          } catch (e) {
            // Skip invalid dates
          }
        }
      })
    }

    // Add expense dates
    if (expenses && expenses.length) {
      expenses.forEach((expense) => {
        if (expense.date) {
          try {
            const date = new Date(expense.date)
            if (!isNaN(date.getTime())) {
              allDates.push({ date, type: "expense" })
            }
          } catch (e) {
            // Skip invalid dates
          }
        }
      })
    }

    if (allDates.length === 0) {
      // Default to last 30 days if no dates found
      return {
        startDate: new Date(new Date().setDate(new Date().getDate() - 30)),
        endDate: new Date(),
      }
    }

    // Sort dates in descending order (most recent first)
    allDates.sort((a, b) => b.date - a.date)

    // Find clusters of dates (potential trips)
    const MAX_GAP_DAYS = 3 // Maximum gap between dates to be considered same trip
    const MIN_CLUSTER_SIZE = 1 // Minimum number of dates to be considered a trip

    let clusters = []
    let currentCluster = [allDates[0]]

    for (let i = 1; i < allDates.length; i++) {
      const currentDate = allDates[i].date
      const prevDate = allDates[i - 1].date
      const dayDiff = Math.abs((prevDate - currentDate) / (1000 * 60 * 60 * 24))

      if (dayDiff <= MAX_GAP_DAYS) {
        // Same cluster/trip
        currentCluster.push(allDates[i])
      } else {
        // New cluster/trip
        if (currentCluster.length >= MIN_CLUSTER_SIZE) {
          clusters.push([...currentCluster])
        }
        currentCluster = [allDates[i]]
      }
    }

    // Don't forget the last cluster
    if (currentCluster.length >= MIN_CLUSTER_SIZE) {
      clusters.push(currentCluster)
    }

    // No clusters found, fall back to default
    if (clusters.length === 0) {
      return {
        startDate: new Date(new Date().setDate(new Date().getDate() - 30)),
        endDate: new Date(),
      }
    }

    // Take the first (most recent) cluster
    const mostRecentCluster = clusters[0]

    // Find start and end dates of the cluster
    const clusterDates = mostRecentCluster.map((item) => item.date)
    const clusterStart = new Date(Math.min(...clusterDates))
    const clusterEnd = new Date(Math.max(...clusterDates))

    return {
      startDate: clusterStart,
      endDate: clusterEnd,
    }
  }

  // ===== Date highlighting logic =====
  const getHighlightedDates = useMemo(() => {
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
  }, [items, expenses])

  // Function to check if a date should be highlighted
  const getDateClass = (date) => {
    try {
      const dateStr = date.toISOString().split("T")[0]
      return getHighlightedDates.has(dateStr) ? Styles.highlightedDate : null
    } catch (e) {
      return null
    }
  }

  // ===== State management =====
  const detectedDates = useMemo(
    () => detectMostRecentTripDates(),
    [items, expenses]
  )
  const [startDate, setStartDate] = useState(detectedDates.startDate)
  const [endDate, setEndDate] = useState(detectedDates.endDate)
  const [metrics, setMetrics] = useState({
    tripPartsCost: "$0.00",
    tripExpensesTotal: "$0.00",
    tripTotalCost: "$0.00",
    tripRevenueReceived: "$0.00",
    tripROI: "0.0",
    tripPotentialROI: "0.0",
    tripTotalItems: 0,
    tripSoldItems: 0,
    tripItemsRemaining: 0,
    tripRemainingInventory: "$0.00",
    tripPotentialRevenue: "$0.00",
    tripLocations: "",
    groupedExpenses: [],
  })

  // ===== Trip metrics calculation =====
  useEffect(() => {
    if (!items || !expenses) return

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
        return false
      }
    })

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

    // Calculate TOTAL potential revenue from ALL trip items (sold and unsold)
    const tripPotentialRevenue = tripPurchases.reduce(
      (sum, item) =>
        sum +
        parseFloat(item.purchasePrice || 0) +
        (item.sold
          ? parseFloat(item.profit || 0)
          : parseFloat(item.expectedProfit || 0)),
      0
    )

    // Calculate trip ROI so far
    const tripROI =
      tripTotalCost > 0
        ? ((tripRevenueReceived / tripTotalCost) * 100).toFixed(1)
        : "0.0"

    // Calculate potential ROI
    const potentialROI =
      tripTotalCost > 0
        ? ((tripPotentialRevenue / tripTotalCost) * 100).toFixed(1)
        : "0.0"

    // Items purchased but not yet sold
    const tripItemsRemaining = tripPurchases.filter((item) => !item.sold).length

    // Remaining inventory value from trip
    const tripRemainingInventory = tripPurchases
      .filter((item) => !item.sold)
      .reduce((sum, item) => sum + parseFloat(item.purchasePrice || 0), 0)
    // Extract purchase locations with their first visit dates
    const locationMap = new Map()
    tripPurchases.forEach((item) => {
      if (
        item.purchaseLocation &&
        item.datePurchased &&
        item.purchaseLocation.trim()
      ) {
        const location = item.purchaseLocation.trim()
        const purchaseDate = new Date(item.datePurchased)

        // Only add the location if it's not already in the map,
        // or if this purchase date is earlier than the one we have
        if (
          !locationMap.has(location) ||
          purchaseDate < locationMap.get(location).date
        ) {
          locationMap.set(location, {
            date: purchaseDate,
            location: location,
          })
        }
      }
    })

    // Convert to array, sort by date, and extract just the location names
    const tripLocations = Array.from(locationMap.values())
      .sort((a, b) => a.date - b.date) // Sort by date (earliest first)
      .map((item) => item.location) // Extract just the location names
      .join(" - ")
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
      tripPotentialRevenue: formatCurrency(tripPotentialRevenue),
      tripLocations,
      groupedExpenses,
    })
  }, [items, expenses, startDate, endDate])

  // ===== Component rendering =====
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
          </div>

          <div className={Styles.datePickerGroup}>
            <label>Trip End:</label>
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
        </div>

        {/* Right side - Summary info */}
        {metrics.tripTotalItems > 0 && (
          <div className={Styles.tripSummary}>
            <div className={Styles.summaryHeader}>
              Trip Summary: {startDate.toLocaleDateString()} -{" "}
              {endDate.toLocaleDateString()}
              {metrics.tripLocations && (
                <span className={Styles.tripLocations}>
                  {" "}
                  {metrics.tripLocations}
                </span>
              )}
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
                      parseFloat(metrics.tripROI) < 0
                        ? Styles.negative
                        : parseFloat(metrics.tripROI) > 100
                        ? Styles.positive
                        : "" // No special color class if between 0-100%
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
        {metrics.tripTotalItems === 0 &&
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
