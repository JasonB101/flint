import React, { useState, useMemo } from "react"
import Styles from "./SoldSummaryModal.module.scss"

const SoldSummaryModal = ({ soldItems, setToggleSummaryModal }) => {
  const [sortConfig, setSortConfig] = useState({
    key: "count",
    direction: "descending",
  })

  const calculateAverages = (items) => {
    const summary = {}
    items.forEach((item) => {
      const partNo = item.partNo.replace(/\s+/g, "") // Remove all spaces from partNo
      if (partNo === "" || partNo === "N/A" || partNo === "n/a") return // Exclude items with "" or "N/A" partNo

      if (!summary[partNo]) {
        summary[partNo] = {
          partNo: partNo,
          title: item.title,
          daysListed: 0,
          priceSold: 0,
          profit: 0,
          roi: 0,
          purchasePrice: 0,
          count: 0,
        }
      }
      summary[partNo].daysListed += item.daysListed
      summary[partNo].priceSold += item.priceSold
      summary[partNo].profit += item.profit
      summary[partNo].roi += item.roi
      summary[partNo].purchasePrice += item.purchasePrice
      summary[partNo].count += 1
    })

    return Object.values(summary).map((item) => ({
      partNo: item.partNo,
      title: item.title,
      daysListed: Math.floor(item.daysListed / item.count),
      priceSold: Math.ceil(item.priceSold / item.count).toFixed(2),
      profit: Math.floor(item.profit / item.count),
      roi: Math.floor(item.roi / item.count),
      purchasePrice: Math.ceil(item.purchasePrice / item.count),
      count: item.count,
    }))
  }

  const summaryData = useMemo(() => {
    const data = calculateAverages(soldItems)
    data.sort((a, b) => {
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
    return data
  }, [soldItems, sortConfig])

  const requestSort = (key) => {
    let direction = "ascending"
    if (sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending"
    }
    setSortConfig({ key, direction })
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
        <h2>Sold Summary</h2>
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
                  <td style={{textAlign: "left"}}>{item.partNo}</td>
                  <td style={{textAlign: "left"}}>{item.title}</td>
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
