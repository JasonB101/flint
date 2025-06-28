import React, { useState, useEffect, useMemo } from "react"
import DatePicker from "react-datepicker"
import "react-datepicker/dist/react-datepicker.css"
import Styles from "./TripReportModal.module.scss"

const TripReportModal = ({ isOpen, onClose, items, expenses }) => {
  // ===== Helper functions =====
  const formatCurrency = (value) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(value)
  }

  // ===== Date detection logic =====
  const detectAllTrips = () => {
    // Only look at items from the last 2 years to avoid processing ancient data
    const twoYearsAgo = new Date()
    twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2)
    
    // Extract dates only from items with purchase prices (recent items only)
    const purchaseDates = []

    // Add item purchase dates only (ignore expenses)
    if (items && items.length) {
      items.forEach((item) => {
        if (item.datePurchased && item.purchasePrice && parseFloat(item.purchasePrice) > 0) {
          try {
            const date = new Date(item.datePurchased)
            if (!isNaN(date.getTime()) && date >= twoYearsAgo) {
              purchaseDates.push(date)
            }
          } catch (e) {
            // Skip invalid dates
          }
        }
      })
    }

    if (purchaseDates.length === 0) {
      return []
    }

    // Sort dates in descending order (most recent first)
    purchaseDates.sort((a, b) => b - a)

    // Find consecutive days with purchases (no gaps allowed)
    const MIN_CLUSTER_SIZE = 1 // Minimum number of days to be considered a trip

    let allTrips = []
    let currentCluster = [purchaseDates[0]]

    for (let i = 1; i < purchaseDates.length; i++) {
      const currentDate = purchaseDates[i]
      const prevDate = purchaseDates[i - 1]
      
      // Calculate the difference in days (consecutive means exactly 1 day apart or same day)
      const timeDiff = prevDate - currentDate
      const dayDiff = Math.floor(timeDiff / (1000 * 60 * 60 * 24))

      if (dayDiff <= 1) {
        // Same day or consecutive day - add to current cluster
        currentCluster.push(currentDate)
      } else {
        // Gap found - end current cluster and start new one
        if (currentCluster.length >= MIN_CLUSTER_SIZE) {
          const clusterStart = new Date(Math.min(...currentCluster))
          const clusterEnd = new Date(Math.max(...currentCluster))
          allTrips.push({ startDate: clusterStart, endDate: clusterEnd })
        }
        currentCluster = [currentDate]
      }
    }

    // Don't forget the last cluster
    if (currentCluster.length >= MIN_CLUSTER_SIZE) {
      const clusterStart = new Date(Math.min(...currentCluster))
      const clusterEnd = new Date(Math.max(...currentCluster))
      allTrips.push({ startDate: clusterStart, endDate: clusterEnd })
    }

    return allTrips
  }

  const detectMostRecentTripDates = () => {
    const allTrips = detectAllTrips()
    
    if (allTrips.length === 0) {
      // Default to last 30 days if no trips found
      return {
        startDate: new Date(new Date().setDate(new Date().getDate() - 30)),
        endDate: new Date(),
      }
    }

    // Return the first (most recent) trip
    return allTrips[0]
  }

  // ===== Date highlighting logic =====
  const getHighlightedDates = useMemo(() => {
    // Create a Map to store dates that have item purchases with purchase prices
    const highlightedDatesMap = new Map()

    if (items && items.length) {
      // Add dates with item purchases that have purchase prices
      items.forEach((item) => {
        if (item.datePurchased && item.purchasePrice && parseFloat(item.purchasePrice) > 0) {
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
  const allTrips = useMemo(() => detectAllTrips(), [items, expenses])
  const [currentTripIndex, setCurrentTripIndex] = useState(0)
  const [startDate, setStartDate] = useState(detectedDates.startDate)
  const [endDate, setEndDate] = useState(detectedDates.endDate)
  const [selectedLocations, setSelectedLocations] = useState(new Set()) // Track selected locations
  const [metrics, setMetrics] = useState({
    tripPartsCost: "$0.00",
    tripExpensesTotal: "$0.00",
    tripTotalCost: "$0.00",
    tripTotalCostRaw: 0,
    tripRevenueReceived: "$0.00",
    tripRevenueReceivedRaw: 0,
    tripROI: "0.0",
    tripPotentialROI: "0.0",
    tripTotalItems: 0,
    tripSoldItems: 0,
    tripItemsRemaining: 0,
    tripRemainingInventory: "$0.00",
    tripPotentialRevenue: "$0.00",
    tripPotentialProfit: "$0.00",
    tripLocations: "",
    groupedExpenses: [],
    daysToProfitable: null,
    projectedPayoffDate: "No sales yet",
    projectedPayoffDays: null,
    isLocationFiltered: false,
  })

  // Navigation functions
  const goToNextTrip = () => {
    if (allTrips.length > 0 && currentTripIndex > 0) {
      const nextIndex = currentTripIndex - 1
      setCurrentTripIndex(nextIndex)
      setStartDate(allTrips[nextIndex].startDate)
      setEndDate(allTrips[nextIndex].endDate)
    }
  }

  const goToPreviousTrip = () => {
    if (allTrips.length > 0 && currentTripIndex < allTrips.length - 1) {
      const prevIndex = currentTripIndex + 1
      setCurrentTripIndex(prevIndex)
      setStartDate(allTrips[prevIndex].startDate)
      setEndDate(allTrips[prevIndex].endDate)
    }
  }

  const resetToMostRecent = () => {
    setCurrentTripIndex(0)
    if (allTrips.length > 0) {
      setStartDate(allTrips[0].startDate)
      setEndDate(allTrips[0].endDate)
    }
  }

  // Location filtering functions
  const handleLocationClick = (location) => {
    const newSelectedLocations = new Set(selectedLocations)
    if (selectedLocations.has(location)) {
      newSelectedLocations.delete(location)
    } else {
      newSelectedLocations.add(location)
    }
    setSelectedLocations(newSelectedLocations)
  }

  // Calculate metrics when dependencies change
  useEffect(() => {
    const calculatePayoffDate = () => {
      if (!items || items.length === 0) {
        return {
          daysToProfitable: null,
          projectedPayoffDate: "No items found",
          projectedPayoffDays: null,
        }
      }

      // Filter to trip items and get sold items with dates
      const tripItems = items.filter((item) => {
        const purchaseDate = new Date(item.datePurchased)
        return purchaseDate >= startDate && purchaseDate <= endDate
      })

      const finalizedTripItems = tripItems
        .filter((item) => (item.sold && item.dateSold) || (item.status === "waste" && item.dateWasted))
        .map((item) => ({
          ...item,
          dateFinalizedParsed: new Date(item.sold ? item.dateSold : item.dateWasted),
          datePurchasedParsed: new Date(item.datePurchased),
          profit: parseFloat(item.profit || 0),
        }))
        .sort((a, b) => a.dateFinalizedParsed - b.dateFinalizedParsed)

      if (finalizedTripItems.length === 0) {
        return {
          daysToProfitable: null,
          projectedPayoffDate: "No sales or waste yet",
          projectedPayoffDays: null,
        }
      }

      // Calculate trip investment (total cost of items + expenses in date range)
      const tripItemsCost = tripItems.reduce(
        (sum, item) => sum + parseFloat(item.purchasePrice || 0),
        0
      )

      const tripExpenses = expenses
        ? expenses
            .filter((expense) => {
              const expenseDate = new Date(expense.date)
              return expenseDate >= startDate && expenseDate <= endDate
            })
            .reduce((sum, expense) => sum + parseFloat(expense.amount || 0), 0)
        : 0

      const totalInvestment = tripItemsCost + tripExpenses

      // Track cumulative profit over time (including waste losses)
      let cumulativeProfit = 0
      let profitableDate = null
      let daysToProfitable = null

      for (const item of finalizedTripItems) {
        cumulativeProfit += item.profit

        if (cumulativeProfit >= totalInvestment && profitableDate === null) {
          profitableDate = item.dateFinalizedParsed
          // Calculate days from trip start to profitable date
          const tripStartTime = Math.min(...tripItems.map(item => new Date(item.datePurchased).getTime()))
          const tripStartDate = new Date(tripStartTime)
          daysToProfitable = Math.ceil((profitableDate - tripStartDate) / (1000 * 60 * 60 * 24))
          break
        }
      }

      // If not yet profitable, project when it might be
      if (profitableDate === null) {
        const totalProfitSoFar = cumulativeProfit
        const remainingNeeded = totalInvestment - totalProfitSoFar

        if (finalizedTripItems.length >= 2) {
          // Calculate average days between finalizations (sales/waste)
          const finalizationDates = finalizedTripItems.map(item => item.dateFinalizedParsed.getTime())
          const avgDaysBetweenFinalizations = finalizationDates.length > 1 
            ? (Math.max(...finalizationDates) - Math.min(...finalizationDates)) / (finalizationDates.length - 1) / (1000 * 60 * 60 * 24)
            : 30 // Default to 30 days if only one finalization

          // Calculate average profit per finalization (including waste losses)
          const avgProfitPerFinalization = totalProfitSoFar / finalizedTripItems.length

          if (avgProfitPerFinalization > 0) {
            const finalizationsNeeded = Math.ceil(remainingNeeded / avgProfitPerFinalization)
            const daysToProject = finalizationsNeeded * avgDaysBetweenFinalizations

            const lastFinalizationDate = Math.max(...finalizationDates)
            const projectedDate = new Date(lastFinalizationDate + (daysToProject * 24 * 60 * 60 * 1000))

            // Calculate days from now
            const daysFromNow = Math.ceil((projectedDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))

            return {
              daysToProfitable: null,
              projectedPayoffDate: projectedDate.toLocaleDateString(),
              projectedPayoffDays: daysFromNow > 0 ? daysFromNow : null,
            }
          }
        }

        return {
          daysToProfitable: null,
          projectedPayoffDate: "Unable to project",
          projectedPayoffDays: null,
        }
      }

      return {
        daysToProfitable,
        projectedPayoffDate: profitableDate.toLocaleDateString(),
        projectedPayoffDays: null, // Already profitable
      }
    }

    const isLocationFiltered = selectedLocations.size > 0

    // Filter items by date range
    let filteredItems = items.filter((item) => {
      const purchaseDate = new Date(item.datePurchased)
      return purchaseDate >= startDate && purchaseDate <= endDate
    })

    // Apply location filtering if any locations are selected
    if (isLocationFiltered) {
      filteredItems = filteredItems.filter((item) => {
        return selectedLocations.has(item.purchaseLocation?.trim())
      })
    }

    // Filter expenses by date range
    const filteredExpenses = expenses
      ? expenses.filter((expense) => {
          const expenseDate = new Date(expense.date)
          return expenseDate >= startDate && expenseDate <= endDate
        })
      : []

    // Calculate metrics
    const tripPartsCost = filteredItems.reduce(
      (sum, item) => sum + parseFloat(item.purchasePrice || 0),
      0
    )
    const tripExpensesTotal = filteredExpenses.reduce(
      (sum, expense) => sum + parseFloat(expense.amount || 0),
      0
    )
    const tripTotalCost = tripPartsCost + tripExpensesTotal

    // Revenue so far from items purchased during this trip and later finalized
    const finalizedItems = filteredItems.filter((item) => item.sold || item.status === "waste")
    const tripRevenueReceived = finalizedItems.reduce(
      (sum, item) => {
        // Only sold items generate actual revenue (purchase price + profit)
        // Waste items contribute $0 revenue but their losses are reflected in negative profit
        if (item.sold) {
          return sum + parseFloat(item.profit || 0) + parseFloat(item.purchasePrice || 0)
        } else {
          // For waste items, only count the loss (negative profit), no revenue
          return sum + Math.min(0, parseFloat(item.profit || 0)) // Only count negative profit/loss
        }
      },
      0
    )

    // Calculate TOTAL potential revenue from ALL trip items (sold, waste, and unsold)
    const tripPotentialRevenue = filteredItems.reduce(
      (sum, item) => {
        if (item.sold) {
          // Sold items: actual purchase price + actual profit
          return sum + parseFloat(item.purchasePrice || 0) + parseFloat(item.profit || 0)
        } else if (item.status === "waste") {
          // Waste items: only the loss (negative profit), no revenue
          return sum + Math.min(0, parseFloat(item.profit || 0))
        } else {
          // Unsold items: potential purchase price + expected profit
          return sum + parseFloat(item.purchasePrice || 0) + parseFloat(item.expectedProfit || 0)
        }
      },
      0
    )

    // Calculate potential profit (revenue - investment)
    // When filtering by location, we need to handle this differently
    let tripPotentialProfit, tripCurrentProfit, tripROI, potentialROI
    
    if (isLocationFiltered) {
      // For location filtering: show item-only profitability (excluding trip expenses)
      const locationPotentialProfit = tripPotentialRevenue - tripPartsCost
      const locationCurrentProfit = tripRevenueReceived - tripPartsCost
      
      tripPotentialProfit = locationPotentialProfit
      tripCurrentProfit = locationCurrentProfit
      
      // ROI based on item costs only (more meaningful for location comparison)
      if (tripRevenueReceived <= 0) {
        tripROI = "0.0" // No sales yet
      } else if (tripRevenueReceived < tripPartsCost) {
        // Show progress toward break-even (0% to 100%)
        tripROI = ((tripRevenueReceived / tripPartsCost) * 100).toFixed(1)
      } else {
        // Past break-even, show actual profit ROI
        tripROI = ((locationCurrentProfit / tripPartsCost) * 100).toFixed(1)
      }
      
      potentialROI = tripPartsCost > 0 
        ? ((locationPotentialProfit / tripPartsCost) * 100).toFixed(1) 
        : "0.0"
    } else {
      // For full trip view: include all expenses
      tripPotentialProfit = tripPotentialRevenue - tripTotalCost
      tripCurrentProfit = tripRevenueReceived - tripTotalCost
      
      // Calculate trip ROI so far (profit-based, not revenue-based)
      if (tripRevenueReceived <= 0) {
        tripROI = "0.0" // No sales yet
      } else if (tripRevenueReceived < tripTotalCost) {
        // Show progress toward break-even (0% to 100%)
        tripROI = ((tripRevenueReceived / tripTotalCost) * 100).toFixed(1)
      } else {
        // Past break-even, show actual profit ROI
        tripROI = ((tripCurrentProfit / tripTotalCost) * 100).toFixed(1)
      }

      // Calculate potential ROI (profit-based, not revenue-based)
      potentialROI = tripTotalCost > 0
        ? ((tripPotentialProfit / tripTotalCost) * 100).toFixed(1)
        : "0.0"
    }

    const activeItems = filteredItems.filter((item) => !item.sold && item.status !== "waste")
    const tripRemainingInventory = activeItems.reduce(
      (sum, item) => sum + parseFloat(item.purchasePrice || 0),
      0
    )

    // Extract purchase locations with their first visit dates (use ALL trip items for complete location list)
    const allTripItems = items.filter((item) => {
      const purchaseDate = new Date(item.datePurchased)
      return purchaseDate >= startDate && purchaseDate <= endDate
    })

    const locationMap = new Map()
    allTripItems.forEach((item) => {
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

    // Group expenses by title for display
    const expenseGroups = {}
    filteredExpenses.forEach((expense) => {
      const title = expense.title || "Miscellaneous"
      if (!expenseGroups[title]) {
        expenseGroups[title] = { total: 0, count: 0 }
      }
      expenseGroups[title].total += parseFloat(expense.amount || 0)
      expenseGroups[title].count += 1
    })

    const groupedExpenses = Object.entries(expenseGroups)
      .map(([title, data]) => ({
        title,
        amount: data.total,
        count: data.count,
        formattedAmount: formatCurrency(data.total),
      }))
      .sort((a, b) => b.amount - a.amount)

    // Calculate average metrics
    const avgItemCost = filteredItems.length > 0 ? formatCurrency(tripPartsCost / filteredItems.length) : "$0.00"
    const avgExpectedProfitPerItem = filteredItems.length > 0 
      ? formatCurrency(filteredItems.reduce((sum, item) => sum + parseFloat(item.expectedProfit || 0), 0) / filteredItems.length)
      : "$0.00"
    
    const avgProfitMargin = filteredItems.length > 0
      ? (filteredItems.reduce((sum, item) => {
          const purchasePrice = parseFloat(item.purchasePrice || 0)
          const expectedProfit = parseFloat(item.expectedProfit || 0)
          return purchasePrice > 0 ? sum + ((expectedProfit / purchasePrice) * 100) : sum
        }, 0) / filteredItems.length).toFixed(1)
      : "0.0"

    const projectedPayoffData = calculatePayoffDate()

    setMetrics({
      tripPartsCost: formatCurrency(tripPartsCost),
      tripExpensesTotal: formatCurrency(tripExpensesTotal),
      tripTotalCost: isLocationFiltered ? formatCurrency(tripPartsCost) : formatCurrency(tripTotalCost),
      tripTotalCostRaw: isLocationFiltered ? tripPartsCost : tripTotalCost,
      tripRevenueReceived: formatCurrency(tripRevenueReceived),
      tripRevenueReceivedRaw: tripRevenueReceived,
      tripROI: tripROI,
      tripPotentialROI: potentialROI,
      tripTotalItems: filteredItems.length,
      tripSoldItems: finalizedItems.filter(item => item.sold).length,
      tripWasteItems: finalizedItems.filter(item => item.status === "waste").length,
      tripItemsRemaining: activeItems.length,
      tripRemainingInventory: formatCurrency(tripRemainingInventory),
      tripPotentialRevenue: formatCurrency(tripPotentialRevenue),
      tripPotentialProfit: formatCurrency(tripPotentialProfit),
      tripLocations: tripLocations,
      groupedExpenses: groupedExpenses,
      tripCurrentProfit: formatCurrency(tripCurrentProfit),
      avgItemCost: avgItemCost,
      avgExpectedProfitPerItem: avgExpectedProfitPerItem,
      avgProfitMargin: avgProfitMargin,
      projectedPayoffDate: projectedPayoffData.projectedPayoffDate,
      projectedPayoffDays: projectedPayoffData.projectedPayoffDays,
      daysToProfitable: projectedPayoffData.daysToProfitable,
      isLocationFiltered: isLocationFiltered,
    })
  }, [items, expenses, startDate, endDate, selectedLocations])

  if (!isOpen) return null

  return (
    <div className={Styles.modalOverlay} onClick={onClose}>
      <div className={Styles.modalContent} onClick={e => e.stopPropagation()}>
        <div className={Styles.modalHeader}>
          <h2>📊 Trip Report</h2>
          <button className={Styles.closeButton} onClick={onClose}>×</button>
        </div>
        
        <div className={Styles.modalBody}>
          <div className={Styles.tripReportHeader}>
            {/* Left side - Date picker */}
            <div className={Styles.dateFilterContainer}>
              {/* Trip Navigation */}
              {allTrips.length > 1 && (
                <div className={Styles.tripNavigation}>
                  <div className={Styles.tripCounter}>
                    Trip {currentTripIndex + 1} of {allTrips.length}
                  </div>
                  <div className={Styles.tripNavButtons}>
                    <button 
                      onClick={goToPreviousTrip}
                      disabled={currentTripIndex === allTrips.length - 1}
                      className={Styles.navButton}
                      title="Previous trip (older)"
                    >
                      ← Prev
                    </button>
                    <button 
                      onClick={goToNextTrip}
                      disabled={currentTripIndex === 0}
                      className={Styles.navButton}
                      title="Next trip (newer)"
                    >
                      Next →
                    </button>
                    <button 
                      onClick={resetToMostRecent}
                      className={Styles.navButton}
                      title="Go to most recent trip"
                    >
                      Latest
                    </button>
                  </div>
                </div>
              )}

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

              {/* Payoff Status below date pickers */}
              {metrics.tripTotalItems > 0 && (
                <div className={Styles.payoffStatusContainer}>
                  <div className={Styles.payoffStatus}>
                    {metrics.tripRevenueReceivedRaw >= metrics.tripTotalCostRaw ? (
                      <div className={Styles.payoffSuccess}>
                        <span className={Styles.checkmark}>✓</span>
                        <span className={Styles.payoffText}>Profitable in</span>
                        <span className={Styles.payoffDays}>{metrics.daysToProfitable || 'N/A'} days</span>
                      </div>
                    ) : metrics.projectedPayoffDays !== null ? (
                      <div className={Styles.payoffPending}>
                        <span className={Styles.clockIcon}>⏰</span>
                        <span className={Styles.payoffText}>Payoff in</span>
                        <span className={Styles.payoffDays}>{metrics.projectedPayoffDays} days</span>
                      </div>
                    ) : (
                      <div className={Styles.payoffUnknown}>
                        <span className={Styles.payoffText}>{metrics.projectedPayoffDate}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Right side - Summary info */}
            {metrics.tripTotalItems > 0 && (
              <div className={Styles.tripSummary}>
                {metrics.tripLocations && (
                  <div className={Styles.locationsContainer}>
                    <div className={Styles.locationBadges}>
                      {metrics.tripLocations.split(" - ").map((location, index) => (
                        <span
                          key={index}
                          className={`${Styles.locationBadge} ${
                            selectedLocations.has(location.trim()) ? Styles.locationSelected : ''
                          }`}
                          onClick={() => handleLocationClick(location.trim())}
                        >
                          {location.trim()}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Key Metrics Grid */}
                <div className={Styles.keyMetricsGrid}>
                  <div className={Styles.keyMetric}>
                    <div className={Styles.dualMetric}>
                      <div className={Styles.metricSection}>
                        <span className={Styles.metricLabel}>
                          {metrics.isLocationFiltered ? "Items → Revenue" : "Investment → Revenue"}
                        </span>
                        <div className={Styles.metricValue}>
                          <span className={Styles.highlight}>{metrics.tripTotalCost}</span>
                          <span className={Styles.arrow}>→</span>
                          <span className={Styles.positive}>{metrics.tripRevenueReceived}</span>
                        </div>
                        <div className={Styles.metricSubtext}>
                          <span
                            className={`${Styles.currentValue} ${
                              parseFloat(metrics.tripROI) < 0
                                ? Styles.negative
                                : parseFloat(metrics.tripROI) > 100
                                ? Styles.positive
                                : ""
                            }`}
                          >
                            {metrics.tripROI}%
                          </span>
                          <span className={Styles.separator}>/</span>
                          <span className={Styles.currentValue}>
                            {metrics.tripPotentialROI}%
                          </span>
                        </div>
                      </div>
                      <div className={Styles.metricSection}>
                        <span className={Styles.metricLabel}>Potential Revenue</span>
                        <div className={Styles.metricValue}>
                          <span>{metrics.tripPotentialRevenue}</span>
                        </div>
                        <div className={Styles.metricSubtext}>
                          <span className={Styles.currentValue}>Profit: <span className={Styles.positive}>{metrics.tripPotentialProfit}</span></span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className={Styles.keyMetric}>
                    <div className={Styles.dualMetric}>
                      <div className={Styles.metricSection}>
                        <span className={Styles.metricLabel}>Items Finalized</span>
                        <div className={Styles.metricValue}>
                          <span className={Styles.highlight}>{metrics.tripSoldItems}</span>
                          {metrics.tripWasteItems > 0 && (
                            <>
                              <span className={Styles.separator}>+</span>
                              <span className={Styles.negative}>{metrics.tripWasteItems}W</span>
                            </>
                          )}
                          <span className={Styles.separator}>/</span>
                          <span>{metrics.tripTotalItems}</span>
                        </div>
                      </div>
                      <div className={Styles.metricSection}>
                        <span className={Styles.metricLabel}>Avg Cost → Profit</span>
                        <div className={Styles.metricValue}>
                          <span className={Styles.highlight}>{metrics.avgItemCost}</span>
                          <span className={Styles.arrow}>→</span>
                          <span className={Styles.positive}>{metrics.avgExpectedProfitPerItem}</span>
                        </div>
                        <div className={Styles.metricSubtext}>
                          <span className={Styles.currentValue}>
                            {metrics.avgProfitMargin}% margin
                          </span>
                        </div>
                      </div>
                    </div>
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
              <div className={Styles.keyMetric}>
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
      </div>
    </div>
  )
}

export default TripReportModal 