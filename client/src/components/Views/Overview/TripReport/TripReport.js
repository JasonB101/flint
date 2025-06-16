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

    // Removed expense highlighting - only showing purchase dates now

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
    console.log('Clicking location:', location);
    console.log('Current selected:', Array.from(selectedLocations));
    
    setSelectedLocations(prev => {
      const newSet = new Set(prev)
      if (newSet.has(location)) {
        newSet.delete(location)
        console.log('Removed location:', location);
      } else {
        newSet.add(location)
        console.log('Added location:', location);
      }
      console.log('New selected locations:', Array.from(newSet));
      return newSet
    })
  }

  // ===== Trip metrics calculation =====
  useEffect(() => {
    if (!items || !expenses) return

    // First get ALL items in the date range (unfiltered by location)
    const allTripPurchases = items.filter((item) => {
      if (!item.datePurchased) return false

      try {
        const datePurchased = new Date(item.datePurchased)
        const datePurchasedStr = datePurchased.toISOString().split("T")[0]
        const startDateStr = startDate.toISOString().split("T")[0]
        const endDateStr = endDate.toISOString().split("T")[0]

        return datePurchasedStr >= startDateStr && datePurchasedStr <= endDateStr
      } catch (e) {
        return false
      }
    })

    // Then filter items by location selection for metrics calculation
    const tripPurchases = selectedLocations.size === 0 
      ? allTripPurchases 
      : allTripPurchases.filter((item) => {
          const itemLocation = item.purchaseLocation?.trim()
          return itemLocation && selectedLocations.has(itemLocation)
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

    // Calculate potential profit (revenue - investment)
    // When filtering by location, we need to handle this differently
    const isLocationFiltered = selectedLocations.size > 0
    
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

    // Calculate average item cost
    const avgItemCost = tripPurchases.length > 0 ? tripPartsCost / tripPurchases.length : 0

    // Calculate average expected profit per item (pure profit from items, not including expenses)
    const avgExpectedProfitPerItem = tripPurchases.length > 0 
      ? tripPurchases.reduce((sum, item) => 
          sum + (item.sold ? parseFloat(item.profit || 0) : parseFloat(item.expectedProfit || 0)), 0
        ) / tripPurchases.length 
      : 0

    // Calculate profit margin based on item profit vs item cost (excluding trip expenses for location filtering)
    // This gives a cleaner view when filtering by specific locations
    const totalExpectedProfit = tripPurchases.reduce((sum, item) => 
      sum + (item.sold ? parseFloat(item.profit || 0) : parseFloat(item.expectedProfit || 0)), 0)
    
    const avgProfitMargin = tripPartsCost > 0 
      ? ((totalExpectedProfit / tripPartsCost) * 100) 
      : 0

    // Calculate days since trip started
    const tripDuration = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1

    // Calculate daily spending rate
    const dailySpendingRate = tripDuration > 0 ? tripTotalCost / tripDuration : 0

    // Calculate success rate (percentage of items sold)
    const successRate = tripPurchases.length > 0 
      ? ((tripPurchases.filter(item => item.sold).length / tripPurchases.length) * 100).toFixed(1)
      : "0.0"

    // Calculate projected payoff date
    const calculatePayoffDate = () => {
      const remainingToBreakEven = tripTotalCost - tripRevenueReceived
      
      if (remainingToBreakEven <= 0) {
        // Already profitable - calculate how long it took
        const soldItems = tripPurchases.filter(item => item.sold)
        if (soldItems.length === 0) {
          return { text: "Already profitable!", days: null, daysToProfitable: null }
        }
        
        // Find the date of the last sale that put us into profit
        const latestSaleDate = soldItems.reduce((latest, item) => {
          if (item.dateSold) {
            const saleDate = new Date(item.dateSold)
            return saleDate > latest ? saleDate : latest
          }
          return latest
        }, new Date(0))
        
        if (latestSaleDate.getTime() === 0) {
          return { text: "Already profitable!", days: null, daysToProfitable: null }
        }
        
        // Calculate days from trip start to profitability
        const daysToPayoff = Math.ceil((latestSaleDate - startDate) / (1000 * 60 * 60 * 24))
        return { 
          text: `✓ Profitable (${daysToPayoff} days)`, 
          days: daysToPayoff,
          daysToProfitable: daysToPayoff
        }
      }
      
      if (tripRevenueReceived <= 0) {
        return { text: "No sales yet", days: null, daysToProfitable: null }
      }
      
      // Calculate revenue generation rate based on actual sales
      const soldItems = tripPurchases.filter(item => item.sold && item.dateSold)
      if (soldItems.length === 0) {
        return { text: "No sales yet", days: null, daysToProfitable: null }
      }
      
      // Find the earliest sale date to calculate timespan
      const earliestSaleDate = soldItems.reduce((earliest, item) => {
        const saleDate = new Date(item.dateSold)
        return saleDate < earliest ? saleDate : earliest
      }, new Date())
      
      const daysWithSales = Math.max(1, Math.ceil((new Date() - earliestSaleDate) / (1000 * 60 * 60 * 24)))
      const revenuePerDay = tripRevenueReceived / daysWithSales
      
      if (revenuePerDay <= 0) {
        return { text: "Unable to calculate", days: null, daysToProfitable: null }
      }
      
      // Calculate days needed to generate remaining revenue
      const daysToBreakEven = Math.ceil(remainingToBreakEven / revenuePerDay)
      const payoffDate = new Date()
      payoffDate.setDate(payoffDate.getDate() + daysToBreakEven)
      
      return { 
        text: `${payoffDate.toLocaleDateString()} (${daysToBreakEven} days)`, 
        days: daysToBreakEven,
        daysToProfitable: null
      }
    }

    const projectedPayoffData = calculatePayoffDate()

    // Calculate location breakdown with costs and item counts
    const locationBreakdown = {}
    tripPurchases.forEach((item) => {
      if (item.purchaseLocation && item.purchaseLocation.trim()) {
        const location = item.purchaseLocation.trim()
        if (!locationBreakdown[location]) {
          locationBreakdown[location] = {
            name: location,
            itemCount: 0,
            totalSpent: 0,
            firstVisit: new Date(item.datePurchased)
          }
        }
        locationBreakdown[location].itemCount++
        locationBreakdown[location].totalSpent += parseFloat(item.purchasePrice || 0)
        
        const purchaseDate = new Date(item.datePurchased)
        if (purchaseDate < locationBreakdown[location].firstVisit) {
          locationBreakdown[location].firstVisit = purchaseDate
        }
      }
    })

    // Convert to array and sort by total spent (highest first)
    const locationStats = Object.values(locationBreakdown)
      .map(loc => ({
        ...loc,
        formattedSpent: formatCurrency(loc.totalSpent),
        avgItemCost: loc.itemCount > 0 ? loc.totalSpent / loc.itemCount : 0
      }))
      .sort((a, b) => b.totalSpent - a.totalSpent)

    // Items purchased but not yet sold
    const tripItemsRemaining = tripPurchases.filter((item) => !item.sold).length

    // Remaining inventory value from trip
    const tripRemainingInventory = tripPurchases
      .filter((item) => !item.sold)
      .reduce((sum, item) => sum + parseFloat(item.purchasePrice || 0), 0)
    // Extract purchase locations with their first visit dates (use allTripPurchases for all locations)
    const locationMap = new Map()
    allTripPurchases.forEach((item) => {
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
      tripTotalCost: isLocationFiltered ? formatCurrency(tripPartsCost) : formatCurrency(tripTotalCost),
      tripTotalCostRaw: isLocationFiltered ? tripPartsCost : tripTotalCost,
      tripRevenueReceived: formatCurrency(tripRevenueReceived),
      tripRevenueReceivedRaw: tripRevenueReceived,
      tripROI: tripROI,
      tripPotentialROI: potentialROI,
      tripTotalItems: tripPurchases.length,
      tripSoldItems: tripPurchases.filter((item) => item.sold).length,
      tripItemsRemaining: tripItemsRemaining,
      tripRemainingInventory: formatCurrency(tripRemainingInventory),
      tripPotentialRevenue: formatCurrency(tripPotentialRevenue),
      tripPotentialProfit: formatCurrency(tripPotentialProfit),
      tripLocations,
      groupedExpenses,
      tripCurrentProfit: formatCurrency(tripCurrentProfit),
      avgItemCost: formatCurrency(avgItemCost),
      avgExpectedProfitPerItem: formatCurrency(avgExpectedProfitPerItem),
      avgProfitMargin: avgProfitMargin.toFixed(1),
      tripDuration: tripDuration,
      dailySpendingRate: formatCurrency(dailySpendingRate),
      successRate: successRate,
      projectedPayoffDate: projectedPayoffData.text,
      projectedPayoffDays: projectedPayoffData.days,
      locationStats: locationStats,
      daysToProfitable: projectedPayoffData.daysToProfitable,
      isLocationFiltered: isLocationFiltered,
    })
  }, [items, expenses, startDate, endDate, selectedLocations])

  // ===== Component rendering =====
  return (
    <div className={Styles.tripReportCard}>
      <h2>Trip Report</h2>

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
                  style={{ padding: '4px 8px', fontSize: '12px' }}
                >
                  ← Prev
                </button>
                <button 
                  onClick={goToNextTrip}
                  disabled={currentTripIndex === 0}
                  className={Styles.navButton}
                  title="Next trip (newer)"
                  style={{ padding: '4px 8px', fontSize: '12px' }}
                >
                  Next →
                </button>
                <button 
                  onClick={resetToMostRecent}
                  className={Styles.navButton}
                  title="Go to most recent trip"
                  style={{ padding: '4px 8px', fontSize: '12px' }}
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
          <div className={Styles.tripSummary} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
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
                    <span className={Styles.metricLabel}>Items Sold</span>
                    <div className={Styles.metricValue}>
                      <span className={Styles.highlight}>{metrics.tripSoldItems}</span>
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
  )
}

export default TripReport
