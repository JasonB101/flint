import React, { useState, useMemo } from "react"
import Styles from "./InventorySummaryModal.module.scss"

const InventorySummaryModal = ({ inventoryItems, soldItems = [], setToggleInventorySummaryModal }) => {
  const [sortConfig, setSortConfig] = useState({
    key: "totalPulled",
    direction: "descending",
  })
  const [filters, setFilters] = useState({
    titleKeyword: "",
    minTotalSold: 1, // Only show items that have actually sold
    showOutOfStock: true,
  })

  const requestSort = (key) => {
    let direction = "ascending"
    if (sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending"
    }
    setSortConfig({ key, direction })
  }

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setFilters((prevFilters) => ({
      ...prevFilters,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  // Function to extract key features from a title for matching (same as SoldSummaryModal)
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

  // Function to calculate similarity between two items (same as SoldSummaryModal)
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

  // Process all items to create comprehensive inventory tracking data
  const preprocessAllItems = () => {
    // Calculate date cutoff for last 12 months
    const twelveMonthsAgo = new Date()
    twelveMonthsAgo.setFullYear(twelveMonthsAgo.getFullYear() - 1)
    
    // Filter sold items to only include last 12 months
    const recentSoldItems = soldItems.filter(item => {
      if (!item.dateSold) return false
      const saleDate = new Date(item.dateSold)
      return saleDate >= twelveMonthsAgo
    })
    
    // Separate items with and without valid part numbers for BOTH sold and inventory
    const allItemsWithPartNumbers = []
    const allItemsWithoutPartNumbers = []
    
    // Add inventory items with status
    inventoryItems.forEach(item => {
      const partNo = item.partNo.replace(/\s+/g, "")
      const hasValidPartNo = partNo !== "" && partNo !== "N/A" && partNo !== "n/a"
      
      const enhancedItem = {
        ...item,
        status: 'inventory'
      }
      
      if (hasValidPartNo) {
        allItemsWithPartNumbers.push(enhancedItem)
      } else {
        allItemsWithoutPartNumbers.push(enhancedItem)
      }
    })
    
    // Add recent sold items with status (last 12 months only)
    recentSoldItems.forEach(item => {
      const partNo = item.partNo.replace(/\s+/g, "")
      const hasValidPartNo = partNo !== "" && partNo !== "N/A" && partNo !== "n/a"
      
      const enhancedItem = {
        ...item,
        status: 'sold'
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

  // Calculate inventory restocking metrics
  const calculateInventoryMetrics = (allItems) => {
    const summary = {}
    
    allItems.forEach((item) => {
      const partNo = item.partNo.replace(/\s+/g, "")
      
      if (!summary[partNo]) {
        summary[partNo] = {
          partNo: partNo,
          title: item.title,
          isSyntheticPartNo: item.isSyntheticPartNo || false,
          // Current inventory
          currentInventory: 0,
          // Historical data
          totalSold: 0,
          totalPulled: 0,
          totalProfit: 0,
          avgPurchasePrice: 0,
          avgSalePrice: 0,
          totalPurchaseCost: 0,
          validSoldCount: 0,
          allTitles: new Set(),
        }
      }
      
      // Add this title to the set of titles for this group
      summary[partNo].allTitles.add(item.title)
      summary[partNo].totalPulled += 1
      
      if (item.status === 'inventory') {
        summary[partNo].currentInventory += 1
      } else if (item.status === 'sold') {
        summary[partNo].totalSold += 1
        summary[partNo].totalProfit += item.profit || 0
        
        if (item.purchasePrice > 0.01) {
          summary[partNo].totalPurchaseCost += item.purchasePrice
          summary[partNo].validSoldCount += 1
        }
      }
    })

    return Object.values(summary)
      .filter(item => item.totalPulled >= 2 && item.totalSold > 0) // Only show items pulled multiple times AND actually sold
      .map((item) => {
        // Calculate metrics
        const avgPurchasePrice = item.validSoldCount > 0 ? item.totalPurchaseCost / item.validSoldCount : 0
        const avgProfit = item.totalSold > 0 ? item.totalProfit / item.totalSold : 0
        const restockUrgency = item.currentInventory === 0 ? "OUT OF STOCK" : 
                              item.currentInventory === 1 ? "LOW STOCK" : 
                              item.currentInventory <= 3 ? "MODERATE" : "WELL STOCKED"
        
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
          currentInventory: item.currentInventory,
          totalPulled: item.totalPulled,
          totalSold: item.totalSold,
          avgPurchasePrice: Math.ceil(avgPurchasePrice),
          avgProfit: Math.floor(avgProfit),
          restockUrgency: restockUrgency,
          isSyntheticPartNo: item.isSyntheticPartNo,
        }
      })
  }

  const summaryData = useMemo(() => {
    // Get all items (inventory + sold) preprocessed
    const allProcessedItems = preprocessAllItems()
    
    // Calculate inventory metrics
    let data = calculateInventoryMetrics(allProcessedItems)

         // Apply filters
     const filteredData = data.filter((item) => {
       const matchesKeyword = filters.titleKeyword === "" || 
         item.title.toLowerCase().includes(filters.titleKeyword.toLowerCase())
       const matchesMinSold = item.totalSold >= filters.minTotalSold
       const matchesStockFilter = filters.showOutOfStock || item.currentInventory > 0

       return matchesKeyword && matchesMinSold && matchesStockFilter
     })
    
    // Sort the data
    return filteredData.sort((a, b) => {
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
  }, [inventoryItems, soldItems, sortConfig, filters])

  return (
    <div className={Styles.modal}>
      <div className={Styles.modalContent}>
        <button
          className={Styles.closeButton}
          onClick={() => setToggleInventorySummaryModal(false)}
        >
          &times;
        </button>
        <div className={Styles.header}>
          <div className={Styles.compactHeader}>
            <h2>Restocking Guide - Last 12 Months</h2>
            <div className={Styles.compactFilters}>
              <input
                type="text"
                name="titleKeyword"
                value={filters.titleKeyword}
                onChange={handleInputChange}
                placeholder="Search parts..."
                className={Styles.compactInput}
              />
              <input
                type="number"
                name="minTotalSold"
                value={filters.minTotalSold}
                onChange={handleInputChange}
                placeholder="Min sold"
                min="1"
                className={Styles.compactNumber}
              />
              <label className={Styles.compactCheckbox}>
                <input
                  type="checkbox"
                  name="showOutOfStock"
                  checked={filters.showOutOfStock}
                  onChange={handleInputChange}
                />
                Include out of stock
              </label>
            </div>
          </div>
        </div>
        <div className={Styles.tableContainer}>
          <table>
            <thead>
              <tr>
                <th onClick={() => requestSort("partNo")}>Part No</th>
                <th onClick={() => requestSort("title")}>Title</th>
                <th onClick={() => requestSort("currentInventory")}>Current Stock</th>
                <th onClick={() => requestSort("totalPulled")}>Total Pulled</th>
                <th onClick={() => requestSort("totalSold")}>Total Sold</th>
                <th onClick={() => requestSort("avgPurchasePrice")}>Avg Purchase Price</th>
                <th onClick={() => requestSort("avgProfit")}>Avg Profit</th>
                <th onClick={() => requestSort("restockUrgency")}>Restock Status</th>
              </tr>
            </thead>
            <tbody>
              {summaryData.map((item) => (
                <tr key={item.partNo}>
                  <td style={{ textAlign: "left" }}>{item.partNo}</td>
                  <td style={{ textAlign: "left" }}>{item.title}</td>
                  <td style={{ 
                    textAlign: "center",
                    color: item.currentInventory === 0 ? '#dc3545' : 
                           item.currentInventory === 1 ? '#fd7e14' : '#28a745'
                  }}>
                    {item.currentInventory}
                  </td>
                  <td>{item.totalPulled}</td>
                  <td>{item.totalSold}</td>
                  <td>${item.avgPurchasePrice}</td>
                  <td>${item.avgProfit}</td>
                  <td style={{
                    color: item.restockUrgency === "OUT OF STOCK" ? '#dc3545' : 
                           item.restockUrgency === "LOW STOCK" ? '#fd7e14' : 
                           item.restockUrgency === "MODERATE" ? '#ffc107' : '#28a745'
                  }}>
                    {item.restockUrgency}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default InventorySummaryModal 