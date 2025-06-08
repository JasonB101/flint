import React, { useState, useMemo } from "react"
import Styles from "./SoldSummaryModal.module.scss"

const SoldSummaryModal = ({ soldItems, setToggleSummaryModal }) => {
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

  const calculateAverages = (items) => {
    const summary = {}
    items.forEach((item) => {
      const partNo = item.partNo.replace(/\s+/g, "") // Remove all spaces from partNo
      if (
        partNo === "" ||
        partNo === "N/A" ||
        partNo === "n/a" ||
        item.purchasePrice < 0.01
      )
        return // Exclude items with "" or "N/A" partNo

      if (!summary[partNo]) {
        summary[partNo] = {
          partNo: partNo,
          title: item.title,
          daysListed: 0,
          priceSold: 0,
          profit: 0,
          purchasePrice: 0,
          count: 0,
          validPurchaseCount: 0, // Track valid purchase prices
        }
      }
      summary[partNo].daysListed += item.daysListed
      summary[partNo].priceSold += item.priceSold
      summary[partNo].profit += item.profit
      if (item.purchasePrice > 0.01) {
        summary[partNo].purchasePrice += item.purchasePrice
        summary[partNo].validPurchaseCount += 1
      }
      summary[partNo].count += 1
    })

    return Object.values(summary).map((item) => {
      const avgPurchasePrice =
        item.validPurchaseCount > 0
          ? item.purchasePrice / item.validPurchaseCount
          : 0
      const avgProfit = item.profit / item.count
      const avgRoi =
        avgPurchasePrice > 0 ? (avgProfit / avgPurchasePrice) * 100 : 0

      return {
        partNo: item.partNo,
        title: item.title,
        daysListed: Math.floor(item.daysListed / item.count),
        priceSold: Math.ceil(item.priceSold / item.count).toFixed(2),
        profit: Math.floor(avgProfit),
        roi: Math.floor(avgRoi),
        purchasePrice:
          item.validPurchaseCount > 0
            ? Math.ceil(item.purchasePrice / item.validPurchaseCount)
            : 0,
        count: item.count,
      }
    })
  }

  const sortBestPerforming = (data) => {
    if (data.length === 0) return data;

    // Calculate dataset statistics for adaptive scoring
    const stats = {
      avgDays: data.reduce((sum, item) => sum + item.daysListed, 0) / data.length,
      avgROI: data.reduce((sum, item) => sum + item.roi, 0) / data.length,
      avgProfit: data.reduce((sum, item) => sum + item.profit, 0) / data.length,
      avgCount: data.reduce((sum, item) => sum + item.count, 0) / data.length,
      maxDays: Math.max(...data.map(item => item.daysListed)),
      maxROI: Math.max(...data.map(item => item.roi)),
      maxProfit: Math.max(...data.map(item => item.profit)),
      maxCount: Math.max(...data.map(item => item.count)),
      minDays: Math.min(...data.map(item => item.daysListed)),
    };

    return data.sort((a, b) => {
      // 1. VELOCITY SCORE (30%) - Speed relative to your average
      const velocityA = Math.max(0, (stats.avgDays - a.daysListed) / stats.avgDays);
      const velocityB = Math.max(0, (stats.avgDays - b.daysListed) / stats.avgDays);
      
      // 2. PROFITABILITY SCORE (25%) - ROI relative to your average, with diminishing returns
      const roiNormA = Math.min(a.roi / stats.avgROI, 3); // Cap at 3x average to prevent outliers
      const roiNormB = Math.min(b.roi / stats.avgROI, 3);
      const profitabilityA = Math.sqrt(roiNormA); // Square root for diminishing returns
      const profitabilityB = Math.sqrt(roiNormB);
      
      // 3. CONSISTENCY SCORE (20%) - Based on profit predictability and volume
      const profitConsistencyA = Math.min(a.profit / stats.avgProfit, 2); // Cap at 2x average
      const profitConsistencyB = Math.min(b.profit / stats.avgProfit, 2);
      const volumeBoostA = Math.log(a.count + 1) / Math.log(stats.avgCount + 1);
      const volumeBoostB = Math.log(b.count + 1) / Math.log(stats.avgCount + 1);
      const consistencyA = (profitConsistencyA + volumeBoostA) / 2;
      const consistencyB = (profitConsistencyB + volumeBoostB) / 2;
      
      // 4. MARKET DEMAND SCORE (15%) - High count suggests reliable demand
      const demandA = Math.sqrt(a.count / Math.max(stats.avgCount, 1));
      const demandB = Math.sqrt(b.count / Math.max(stats.avgCount, 1));
      
      // 5. OPPORTUNITY SCORE (10%) - Considers both speed and profit together
      const opportunityA = (a.profit * a.count) / Math.max(a.daysListed, 1);
      const opportunityB = (b.profit * b.count) / Math.max(b.daysListed, 1);
      const maxOpportunity = Math.max(...data.map(item => 
        (item.profit * item.count) / Math.max(item.daysListed, 1)
      ));
      const opportunityScoreA = opportunityA / maxOpportunity;
      const opportunityScoreB = opportunityB / maxOpportunity;

      // Weighted final score
      const scoreA = 
        0.30 * velocityA +          // Speed is king
        0.25 * profitabilityA +     // Profitability matters
        0.20 * consistencyA +       // Reliability is valuable
        0.15 * demandA +            // Market demand
        0.10 * opportunityScoreA;   // Overall opportunity

      const scoreB = 
        0.30 * velocityB +
        0.25 * profitabilityB +
        0.20 * consistencyB +
        0.15 * demandB +
        0.10 * opportunityScoreB;

      return scoreB - scoreA; // Descending order
    });
  }

  const summaryData = useMemo(() => {
    // Filter soldItems based on filters
    const filteredItems = soldItems.filter((item) => {
      const itemYear = new Date(item.dateSold).getFullYear()
      const matchesYear =
        filters.year === "All Years" || itemYear === parseInt(filters.year)
      const matchesPurchasePrice =
        item.purchasePrice <= filters.minPurchasePrice
      const matchesProfit = item.profit >= filters.minProfit
      const matchesDaysListed = item.daysListed <= filters.maxDaysListed
      const matchesKeyword =
        filters.titleKeyword === "" ||
        item.title.toLowerCase().includes(filters.titleKeyword.toLowerCase())

      return (
        matchesYear &&
        matchesPurchasePrice &&
        matchesProfit &&
        matchesDaysListed &&
        matchesKeyword
      )
    })

    // Calculate averages
    let data = calculateAverages(filteredItems)

    // Remove objects with count < filters.minCount
    const filteredData = data.filter((item) => item.count >= filters.minCount)
    data = filteredData
    
    if (sortMethod === "bestPerforming") {
      return sortBestPerforming(data)
    } else if (sortMethod === "worstPerforming") {
      return sortBestPerforming(data).reverse() // Reverse the best performing to get worst
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
  }, [soldItems, sortConfig, sortMethod, filters])

  const years = useMemo(() => {
    const uniqueYears = [
      ...new Set(
        soldItems.map((item) => new Date(item.dateSold).getFullYear())
      ),
    ].sort((a, b) => b - a) // Sort descending
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
                <th onClick={() => requestSort("purchasePrice")}>
                  Purchase Price
                </th>
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
