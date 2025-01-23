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
    // Threshold constants - adjusted based on data patterns
    const MIN_PROFIT = 80 // Lowered to account for quick-turn items
    const MIN_ROI = 500 // Adjusted for faster sales focus
    const GOOD_DAYS = 20 // Reduced to emphasize very quick sales
    const MAX_DAYS = 90 // Cap for very old items

    return data.sort((a, b) => {
      // Days listed scoring - exponential decay with cap
      const daysA = Math.min(a.daysListed, MAX_DAYS)
      const daysB = Math.min(b.daysListed, MAX_DAYS)
      const daysScoreA = Math.exp(-daysA / GOOD_DAYS)
      const daysScoreB = Math.exp(-daysB / GOOD_DAYS)

      // ROI scoring - logarithmic scale to reduce extreme values' impact
      const roiScoreA =
        a.roi > MIN_ROI ? Math.log(a.roi) / Math.log(MIN_ROI) : 0
      const roiScoreB =
        b.roi > MIN_ROI ? Math.log(b.roi) / Math.log(MIN_ROI) : 0

      // Profit scoring - linear with minimum threshold
      const profitScoreA = a.profit > MIN_PROFIT ? a.profit / MIN_PROFIT : 0
      const profitScoreB = b.profit > MIN_PROFIT ? b.profit / MIN_PROFIT : 0

      // Count scoring - logarithmic scale
      const countScoreA = Math.log(a.count + 1)
      const countScoreB = Math.log(b.count + 1)

      // Final score with adjusted weights
      const scoreA =
        0.4 * daysScoreA + // Quick sales are highest priority
        0.25 * roiScoreA + // ROI still important
        0.25 * profitScoreA + // Profit maintains importance
        0.1 * countScoreA // Multiple sales indicator

      const scoreB =
        0.4 * daysScoreB +
        0.25 * roiScoreB +
        0.25 * profitScoreB +
        0.1 * countScoreB
      return scoreB - scoreA // Descending order
    })
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
    setSortMethod(
      sortMethod === "bestPerforming" ? "default" : "bestPerforming"
    )
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
            Sort by Best Performing
          </button>
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
