import React, { useState, useMemo } from "react"
import Styles from "./SoldSummaryModal.module.scss"

const SoldSummaryModal = ({ soldItems, inventoryItems = [], setToggleSummaryModal }) => {
  const [sortConfig, setSortConfig] = useState({
    key: "count",
    direction: "descending",
  })
  const [sortMethod, setSortMethod] = useState("default")
  const [filters, setFilters] = useState({
    year: "All Years",
    minPurchasePrice: 200,
    minProfit: -50,
    minCount: 1,
    maxDaysListed: 2000,
    titleKeyword: "",
  })

  const requestSort = (key) => {
    let direction = "ascending"
    if (sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending"
    }
    setSortConfig({ key, direction })
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFilters((prevFilters) => ({
      ...prevFilters,
      [name]: value,
    }))
  }

  // Function to extract key features from a title for matching
  const extractFeatures = (title) => {
    const normalized = title.toLowerCase()
    
    // Extract make/brand
    const makes = ['subaru', 'mercedes', 'benz', 'hyundai', 'dodge', 'chrysler', 'ford', 'toyota', 'honda', 'nissan', 'bmw', 'audi', 'volkswagen', 'vw', 'lexus', 'infiniti', 'acura', 'mazda', 'mitsubishi', 'kia', 'genesis']
    const make = makes.find(m => normalized.includes(m)) || ''
    
    // Extract model
    const models = ['forester', 'outback', 'legacy', 'impreza', 'wrx', 'c250', 'c300', 'c350', 'c-class', 'genesis', 'avenger', 'charger', 'challenger', 'camry', 'corolla', 'accord', 'civic', 'altima', 'sentra', 'maxima']
    const model = models.find(m => normalized.includes(m)) || ''
    
    // Extract year range (look for patterns like 09-13, 2009-2013, etc.)
    const yearMatch = normalized.match(/(?:20)?(\d{2})[\s-]*(?:(?:20)?(\d{2}))?/) || []
    let yearRange = ''
    if (yearMatch[1]) {
      const startYear = yearMatch[1].length === 2 ? (parseInt(yearMatch[1]) > 50 ? '19' + yearMatch[1] : '20' + yearMatch[1]) : yearMatch[1]
      const endYear = yearMatch[2] ? (yearMatch[2].length === 2 ? (parseInt(yearMatch[2]) > 50 ? '19' + yearMatch[2] : '20' + yearMatch[2]) : yearMatch[2]) : startYear
      yearRange = startYear === endYear ? startYear : `${startYear}-${endYear}`
    }
    
    // Extract part type
    const partTypes = ['headrest', 'head rest', 'sun visor', 'visor', 'seat', 'mirror', 'door handle', 'handle', 'bumper', 'fender', 'hood', 'trunk', 'tailgate', 'grille', 'light', 'lamp']
    const partType = partTypes.find(p => normalized.includes(p)) || ''
    
    // Extract position/location
    const positions = ['front', 'rear', 'back', 'left', 'right', 'driver', 'passenger', 'center', 'middle']
    const position = positions.find(p => normalized.includes(p)) || ''
    
    // Extract color
    const colors = ['black', 'gray', 'grey', 'white', 'red', 'blue', 'green', 'brown', 'tan', 'beige']
    const color = colors.find(c => normalized.includes(c)) || ''
    
    // Extract material
    const materials = ['leather', 'cloth', 'fabric', 'vinyl', 'plastic']
    const material = materials.find(m => normalized.includes(m)) || ''
    
    return {
      make,
      model,
      yearRange,
      partType,
      position,
      color,
      material,
      normalized: normalized.replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim()
    }
  }

  // Function to calculate similarity between two items
  const calculateSimilarity = (features1, features2) => {
    let score = 0
    let maxScore = 0
    
    // Make/Brand match (very important)
    maxScore += 3
    if (features1.make && features2.make && features1.make === features2.make) {
      score += 3
    }
    
    // Model match (very important)
    maxScore += 3
    if (features1.model && features2.model && features1.model === features2.model) {
      score += 3
    }
    
    // Part type match (essential)
    maxScore += 4
    if (features1.partType && features2.partType && features1.partType === features2.partType) {
      score += 4
    }
    
    // Position match (important for parts like headrests)
    maxScore += 2
    if (features1.position && features2.position && features1.position === features2.position) {
      score += 2
    }
    
    // Year range compatibility (less strict)
    maxScore += 2
    if (features1.yearRange && features2.yearRange) {
      if (features1.yearRange === features2.yearRange) {
        score += 2
      } else {
        // Check for overlapping year ranges
        const years1 = features1.yearRange.split('-').map(y => parseInt(y))
        const years2 = features2.yearRange.split('-').map(y => parseInt(y))
        const start1 = Math.min(...years1)
        const end1 = Math.max(...years1)
        const start2 = Math.min(...years2)
        const end2 = Math.max(...years2)
        
        if ((start1 <= end2 && end1 >= start2)) {
          score += 1 // Partial credit for overlapping years
        }
      }
    }
    
    // Color and material are less important for grouping (cosmetic differences)
    // We'll allow different colors/materials to be grouped together
    
    return maxScore > 0 ? score / maxScore : 0
  }

  // Function to group similar items and assign synthetic part numbers
  const groupSimilarItems = (itemsWithoutPartNumbers) => {
    const groups = []
    const processed = new Set()
    
    itemsWithoutPartNumbers.forEach((item, index) => {
      if (processed.has(index)) return
      
      const features = extractFeatures(item.title)
      const group = {
        items: [item],
        indices: [index],
        features: features,
        syntheticPartNo: ''
      }
      
      // Find similar items
      itemsWithoutPartNumbers.forEach((otherItem, otherIndex) => {
        if (otherIndex === index || processed.has(otherIndex)) return
        
        const otherFeatures = extractFeatures(otherItem.title)
        const similarity = calculateSimilarity(features, otherFeatures)
        
        // If similarity is high enough (70% or more), group them together
        if (similarity >= 0.7) {
          group.items.push(otherItem)
          group.indices.push(otherIndex)
          processed.add(otherIndex)
        }
      })
      
      processed.add(index)
      
      // Generate synthetic part number for this group
      const { make, model, yearRange, partType, position } = features
      let partNumber = 'AUTO'
      
      if (make) partNumber += `-${make.toUpperCase()}`
      if (model) partNumber += `-${model.toUpperCase()}`
      if (yearRange) partNumber += `-${yearRange.replace('-', 'TO')}`
      if (position) partNumber += `-${position.toUpperCase()}`
      if (partType) partNumber += `-${partType.replace(/\s+/g, '').toUpperCase()}`
      
      group.syntheticPartNo = partNumber
      groups.push(group)
    })
    
    return groups
  }

  // Enhanced preprocessing to handle both sold and inventory items
  const preprocessAllItems = () => {
    // Separate items with and without valid part numbers for BOTH sold and inventory
    const allItemsWithPartNumbers = []
    const allItemsWithoutPartNumbers = []
    
    // Add sold items with status
    soldItems.forEach(item => {
      const partNo = item.partNo.replace(/\s+/g, "")
      const hasValidPartNo = partNo !== "" && partNo !== "N/A" && partNo !== "n/a"
      
      const enhancedItem = {
        ...item,
        status: 'sold',
        dateSold: item.dateSold,
        daysToSell: item.daysListed
      }
      
      if (hasValidPartNo) {
        allItemsWithPartNumbers.push(enhancedItem)
      } else {
        allItemsWithoutPartNumbers.push(enhancedItem)
      }
    })
    
    // Add inventory items with status and aging calculation
    const currentDate = new Date()
    inventoryItems.forEach(item => {
      const partNo = item.partNo.replace(/\s+/g, "")
      const hasValidPartNo = partNo !== "" && partNo !== "N/A" && partNo !== "n/a"
      
      // Calculate how long this item has been in inventory
      const dateAdded = new Date(item.dateAdded || item.datePulled || item.createdAt)
      const daysInInventory = Math.floor((currentDate - dateAdded) / (1000 * 60 * 60 * 24))
      
      const enhancedItem = {
        ...item,
        status: 'inventory',
        daysInInventory: daysInInventory,
        purchasePrice: item.purchasePrice,
        title: item.title
      }
      
      if (hasValidPartNo) {
        allItemsWithPartNumbers.push(enhancedItem)
      } else {
        allItemsWithoutPartNumbers.push(enhancedItem)
      }
    })
    
    // Group similar items without part numbers
    const groups = groupSimilarItems(allItemsWithoutPartNumbers)
    
    // Assign synthetic part numbers to grouped items
    const processedItemsWithoutPartNumbers = []
    groups.forEach(group => {
      group.items.forEach(item => {
        processedItemsWithoutPartNumbers.push({
          ...item,
          partNo: group.syntheticPartNo,
          originalPartNo: item.partNo,
          isSyntheticPartNo: true,
          groupSize: group.items.length
        })
      })
    })
    
    return [...allItemsWithPartNumbers, ...processedItemsWithoutPartNumbers]
  }

  // Calculate comprehensive performance metrics including inventory
  const calculateComprehensiveMetrics = (allItems) => {
    const summary = {}
    
    allItems.forEach((item) => {
      const partNo = item.partNo.replace(/\s+/g, "")
      if (item.purchasePrice < 0.01 && item.status === 'sold') return // Exclude sold items with invalid purchase price
      
      if (!summary[partNo]) {
        summary[partNo] = {
          partNo: partNo,
          title: item.title,
          isSyntheticPartNo: item.isSyntheticPartNo || false,
          // Sold metrics
          soldCount: 0,
          totalSalesProfit: 0,
          totalSalesRevenue: 0,
          totalDaysToSell: 0,
          totalPurchaseCost: 0,
          validSoldCount: 0,
          // Inventory metrics
          inventoryCount: 0,
          totalInventoryValue: 0,
          totalInventoryAge: 0,
          oldestInventoryAge: 0,
          // Combined metrics
          totalPulled: 0,
          allTitles: new Set(),
        }
      }
      
      // Add this title to the set of titles for this group
      summary[partNo].allTitles.add(item.title)
      summary[partNo].totalPulled += 1
      
      if (item.status === 'sold') {
        summary[partNo].soldCount += 1
        summary[partNo].totalSalesProfit += item.profit
        summary[partNo].totalSalesRevenue += item.priceSold
        summary[partNo].totalDaysToSell += item.daysToSell
        
        if (item.purchasePrice > 0.01) {
          summary[partNo].totalPurchaseCost += item.purchasePrice
          summary[partNo].validSoldCount += 1
        }
      } else if (item.status === 'inventory') {
        summary[partNo].inventoryCount += 1
        summary[partNo].totalInventoryValue += item.purchasePrice || 0
        summary[partNo].totalInventoryAge += item.daysInInventory
        summary[partNo].oldestInventoryAge = Math.max(summary[partNo].oldestInventoryAge, item.daysInInventory)
      }
    })

    return Object.values(summary).map((item) => {
      // Calculate comprehensive metrics
      const avgPurchasePrice = item.validSoldCount > 0 ? item.totalPurchaseCost / item.validSoldCount : 0
      const avgProfit = item.soldCount > 0 ? item.totalSalesProfit / item.soldCount : 0
      const avgROI = avgPurchasePrice > 0 ? (avgProfit / avgPurchasePrice) * 100 : 0
      const avgDaysToSell = item.soldCount > 0 ? item.totalDaysToSell / item.soldCount : 0
      const avgInventoryAge = item.inventoryCount > 0 ? item.totalInventoryAge / item.inventoryCount : 0
      
      // Key performance metrics
      const sellThroughRate = item.totalPulled > 0 ? (item.soldCount / item.totalPulled) * 100 : 0
      const inventoryTurnover = avgDaysToSell > 0 ? 365 / avgDaysToSell : 0
      const totalCapitalTiedUp = item.totalInventoryValue
      const capitalEfficiency = totalCapitalTiedUp > 0 ? (item.totalSalesProfit / totalCapitalTiedUp) * 100 : 0
      
      // For synthetic part numbers, enhance the display title
      let displayTitle = item.title
      let displayPartNo = item.partNo
      
      if (item.isSyntheticPartNo && item.allTitles.size > 1) {
        const titleArray = Array.from(item.allTitles)
        displayTitle = titleArray.reduce((shortest, current) => 
          current.length < shortest.length ? current : shortest
        )
        displayTitle += ` (${item.allTitles.size} variants)`
      }

      return {
        partNo: displayPartNo,
        title: displayTitle,
        // Original metrics for compatibility
        daysListed: Math.floor(avgDaysToSell),
        priceSold: item.soldCount > 0 ? (item.totalSalesRevenue / item.soldCount).toFixed(2) : 0,
        profit: Math.floor(avgProfit),
        roi: Math.floor(avgROI),
        purchasePrice: avgPurchasePrice > 0 ? Math.ceil(avgPurchasePrice) : 0,
        count: item.soldCount,
        // New comprehensive metrics
        totalPulled: item.totalPulled,
        inventoryCount: item.inventoryCount,
        sellThroughRate: Math.round(sellThroughRate),
        avgInventoryAge: Math.round(avgInventoryAge),
        oldestInventoryAge: item.oldestInventoryAge,
        inventoryTurnover: Math.round(inventoryTurnover * 10) / 10,
        totalCapitalTiedUp: Math.round(totalCapitalTiedUp),
        capitalEfficiency: Math.round(capitalEfficiency),
        isSyntheticPartNo: item.isSyntheticPartNo,
      }
    })
  }

  // Enhanced sorting algorithm optimized for junkyard trip economics
  const sortBestPerforming = (data) => {
    if (data.length === 0) return data;

    // Calculate dataset statistics for adaptive scoring
    const stats = {
      avgDays: data.reduce((sum, item) => sum + item.daysListed, 0) / data.length,
      avgROI: data.reduce((sum, item) => sum + item.roi, 0) / data.length,
      avgProfit: data.reduce((sum, item) => sum + item.profit, 0) / data.length,
      avgCount: data.reduce((sum, item) => sum + item.count, 0) / data.length,
      avgSellThrough: data.reduce((sum, item) => sum + item.sellThroughRate, 0) / data.length,
      avgTurnover: data.reduce((sum, item) => sum + item.inventoryTurnover, 0) / data.length,
      avgPrice: data.reduce((sum, item) => sum + item.purchasePrice, 0) / data.length,
    };

    // Helper function to determine price tier performance multiplier
    const getPriceTierMultiplier = (price) => {
      if (price <= 25) return 1.0;      // Under $25 - standard performance expected
      else if (price <= 75) return 1.1; // $25-75 - sweet spot, slight bonus
      else if (price <= 150) return 1.2; // $75-150 - premium range, good bonus
      else if (price <= 300) return 1.1; // $150-300 - higher risk, moderate bonus
      else return 0.95;                  // $300+ - luxury/specialty, slight penalty for complexity
    };

    // Helper function to calculate junkyard trip efficiency
    const getJunkyardTripEfficiency = (item) => {
      // Factors that make an item worth the junkyard trip:
      // 1. Multiple sales (proves demand)
      // 2. High sell-through rate (doesn't sit in inventory)
      // 3. Good profit per piece
      // 4. Low current inventory (room for more)
      
      const salesMultiplier = Math.min(item.count / Math.max(stats.avgCount, 1), 3); // Cap at 3x
      const sellThroughBonus = Math.min(item.sellThroughRate / Math.max(stats.avgSellThrough, 1), 2); // Cap at 2x
      const profitPerPiece = item.profit / Math.max(stats.avgProfit, 1);
      const inventoryPenalty = item.inventoryCount > 5 ? 0.7 : 1.0; // Penalty for too much inventory
      
      return (salesMultiplier * sellThroughBonus * profitPerPiece * inventoryPenalty);
    };

    // Helper function to calculate cargo slot value
    const getCargoSlotValue = (item) => {
      // What's the total value generated per "cargo slot" over time?
      const totalValue = item.count * item.profit;
      const timeSpan = Math.max(item.daysListed, 30); // At least 30 days
      return (totalValue / timeSpan) * 365; // Annualized value per slot
    };

    return data.sort((a, b) => {
      // 1. JUNKYARD TRIP EFFICIENCY (35%) - Is this worth the trip?
      const tripEffA = getJunkyardTripEfficiency(a);
      const tripEffB = getJunkyardTripEfficiency(b);
      const maxTripEff = Math.max(...data.map(item => getJunkyardTripEfficiency(item)));
      const normalizedTripEffA = tripEffA / Math.max(maxTripEff, 1);
      const normalizedTripEffB = tripEffB / Math.max(maxTripEff, 1);

      // 2. SELL-THROUGH PERFORMANCE (25%) - Does it actually sell when you pull it?
      const sellThroughA = Math.min(a.sellThroughRate / Math.max(stats.avgSellThrough, 1), 2);
      const sellThroughB = Math.min(b.sellThroughRate / Math.max(stats.avgSellThrough, 1), 2);

      // 3. CARGO SLOT VALUE (20%) - Profit per cargo space over time
      const cargoValueA = getCargoSlotValue(a);
      const cargoValueB = getCargoSlotValue(b);
      const maxCargoValue = Math.max(...data.map(item => getCargoSlotValue(item)));
      const normalizedCargoValueA = cargoValueA / Math.max(maxCargoValue, 1);
      const normalizedCargoValueB = cargoValueB / Math.max(maxCargoValue, 1);

      // 4. INVENTORY TURNOVER (10%) - How fast does it move?
      const turnoverA = Math.min(a.inventoryTurnover / Math.max(stats.avgTurnover, 1), 3);
      const turnoverB = Math.min(b.inventoryTurnover / Math.max(stats.avgTurnover, 1), 3);

      // 5. PROFITABILITY (10%) - Basic ROI
      const roiA = Math.min(a.roi / Math.max(stats.avgROI, 1), 2);
      const roiB = Math.min(b.roi / Math.max(stats.avgROI, 1), 2);

      // Apply price tier multipliers
      const priceTierMultiplierA = getPriceTierMultiplier(a.purchasePrice);
      const priceTierMultiplierB = getPriceTierMultiplier(b.purchasePrice);

      // Weighted final score optimized for junkyard business model
      const scoreA = (
        0.35 * normalizedTripEffA +     // Is it worth the trip?
        0.25 * sellThroughA +           // Will it actually sell?
        0.20 * normalizedCargoValueA +  // Value per cargo slot
        0.10 * turnoverA +              // How fast it moves
        0.10 * roiA                     // Basic profitability
      ) * priceTierMultiplierA;

      const scoreB = (
        0.35 * normalizedTripEffB +
        0.25 * sellThroughB +
        0.20 * normalizedCargoValueB +
        0.10 * turnoverB +
        0.10 * roiB
      ) * priceTierMultiplierB;

      return scoreB - scoreA; // Descending order
    });
  }

  const summaryData = useMemo(() => {
    // Get all items (sold + inventory) preprocessed
    const allProcessedItems = preprocessAllItems();
    
    // Filter based on sold items criteria (existing filters)
    const filteredSoldItems = allProcessedItems.filter((item) => {
      if (item.status !== 'sold') return false;
      
      const itemYear = new Date(item.dateSold).getFullYear()
      const matchesYear = filters.year === "All Years" || itemYear === parseInt(filters.year)
      const matchesPurchasePrice = item.purchasePrice <= filters.minPurchasePrice
      const matchesProfit = item.profit >= filters.minProfit
      const matchesDaysListed = item.daysToSell <= filters.maxDaysListed
      const matchesKeyword = filters.titleKeyword === "" || 
        item.title.toLowerCase().includes(filters.titleKeyword.toLowerCase())

      return matchesYear && matchesPurchasePrice && matchesProfit && 
             matchesDaysListed && matchesKeyword
    })

    // Calculate comprehensive metrics for all items
    let data = calculateComprehensiveMetrics(allProcessedItems)

    // Apply additional filters for comprehensive metrics
    const filteredData = data.filter((item) => {
      return item.count >= filters.minCount
    })
    
    data = filteredData
    
    if (sortMethod === "bestPerforming") {
      return sortBestPerforming(data)
    } else if (sortMethod === "worstPerforming") {
      return sortBestPerforming(data).reverse()
    }

    return data.sort((a, b) => {
      if (
        typeof a[sortConfig.key] === "string" &&
        typeof b[sortConfig.key] === "string"
      ) {
        return sortConfig.direction === "ascending"
          ? a[sortConfig.key].localeCompare(b[sortConfig.key])
          : b[sortConfig.key].localeCompare(a[sortConfig.key])
      } else {
        return sortConfig.direction === "ascending"
          ? a[sortConfig.key] - b[sortConfig.key]
          : b[sortConfig.key] - a[sortConfig.key]
      }
    })
  }, [soldItems, inventoryItems, sortConfig, sortMethod, filters])

  const years = useMemo(() => {
    const uniqueYears = [
      ...new Set(
        soldItems.map((item) => new Date(item.dateSold).getFullYear())
      ),
    ].sort((a, b) => b - a)
    return ["All Years", ...uniqueYears]
  }, [soldItems])

  const handleSortBestPerforming = () => {
    if (sortMethod === "bestPerforming") {
      setSortMethod("worstPerforming")
    } else if (sortMethod === "worstPerforming") {
      setSortMethod("default")
    } else {
      setSortMethod("bestPerforming")
    }
  }

  const getButtonText = () => {
    if (sortMethod === "bestPerforming") {
      return "Show Worst Performing"
    } else if (sortMethod === "worstPerforming") {
      return "Show Default Sort"
    } else {
      return "Show Best Performing"
    }
  }

  return (
    <div className={Styles.modal}>
      <div className={Styles.modalContent}>
        <button
          className={Styles.closeButton}
          onClick={() => setToggleSummaryModal(false)}
        >
          &times;
        </button>
        <div className={Styles.header}>
          <h2>Sold Summary</h2>
          <div className={Styles.headerControls}>
            <div className={Styles["filter-inputs"]}>
              <select
                name="year"
                value={filters.year}
                onChange={handleInputChange}
                className={Styles["yearSelect"]}
              >
                {years.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
              <input
                type="text"
                name="titleKeyword"
                value={filters.titleKeyword}
                onChange={handleInputChange}
                placeholder="Title Keyword"
                className={Styles["keywordFilter"]}
              />
              <div className={Styles["filter-inputs"]}>
                <div className={Styles["filter-group"]}>
                  <label htmlFor="minPurchasePrice">Min Price</label>
                  <input
                    id="minPurchasePrice"
                    type="number"
                    name="minPurchasePrice"
                    value={filters.minPurchasePrice}
                    onChange={handleInputChange}
                    placeholder="Enter minimum price"
                  />
                </div>
                <div className={Styles["filter-group"]}>
                  <label htmlFor="minProfit">Min Profit</label>
                  <input
                    id="minProfit"
                    type="number"
                    name="minProfit"
                    value={filters.minProfit}
                    onChange={handleInputChange}
                    placeholder="Enter minimum profit"
                  />
                </div>
                <div className={Styles["filter-group"]}>
                  <label htmlFor="minCount">Min Count</label>
                  <input
                    id="minCount"
                    type="number"
                    name="minCount"
                    value={filters.minCount}
                    onChange={handleInputChange}
                    placeholder="Enter minimum count"
                  />
                </div>
                <div className={Styles["filter-group"]}>
                  <label htmlFor="maxDaysListed">Max Days</label>
                  <input
                    id="maxDaysListed"
                    type="number"
                    name="maxDaysListed"
                    value={filters.maxDaysListed}
                    onChange={handleInputChange}
                    placeholder="Enter maximum days listed"
                  />
                </div>
              </div>
            </div>
            <button onClick={handleSortBestPerforming}>
              {getButtonText()}
            </button>
          </div>
        </div>
        <div className={Styles.tableContainer}>
          <table>
            <thead>
              <tr>
                <th onClick={() => requestSort("partNo")}>Part No</th>
                <th onClick={() => requestSort("title")}>Title</th>
                <th onClick={() => requestSort("daysListed")}>Days Listed</th>
                <th onClick={() => requestSort("priceSold")}>Price Sold</th>
                <th onClick={() => requestSort("profit")}>Profit</th>
                <th onClick={() => requestSort("roi")}>ROI</th>
                <th onClick={() => requestSort("purchasePrice")}>Purchase Price</th>
                <th onClick={() => requestSort("count")}>Count</th>
              </tr>
            </thead>
            <tbody>
              {summaryData.map((item) => (
                <tr key={item.partNo}>
                  <td style={{ textAlign: "left" }}>{item.partNo}</td>
                  <td style={{ textAlign: "left" }}>{item.title}</td>
                  <td>{item.daysListed}</td>
                  <td>${item.priceSold}</td>
                  <td>${item.profit}</td>
                  <td>{item.roi}%</td>
                  <td>${item.purchasePrice}</td>
                  <td>{item.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default SoldSummaryModal
