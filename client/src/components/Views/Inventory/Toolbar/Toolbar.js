import React from "react"
import { Button } from "react-bootstrap"
import Styles from "./Toolbar.module.scss"

const currencyFormatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
});

const Toolbar = (props) => {
  const { toggleModal, searchTerm, changeSearchTerm, items, setToggleInventorySummaryModal } = props
  const listingsDetails = assembleListingInfo(items)
  const {totalListed, inventoryCost, expectedRevenue, expectedProfit} = listingsDetails

  return (
    <div className={Styles.wrapper}>
      <input
        onChange={(e) => changeSearchTerm(e.target.value)}
        type="text"
        value={searchTerm}
        placeholder={"Search Inventory"}
      />
      <h5>
        Total Listed
        <span>{totalListed}</span>
      </h5>
      <h5>
        Inventory Cost
        <span>{inventoryCost}</span>
      </h5>
      <h5>
        Expected Revenue
        <span>{expectedRevenue}</span>
      </h5>
      <h5>
        Expected Profit
        <span>{expectedProfit}</span>
      </h5>
      <div className="spacer"></div>
      <Button onClick={() => toggleModal(true)}>New Item</Button>
      <Button onClick={() => setToggleInventorySummaryModal(true)}>Summary</Button>
    </div>
  )
}

function assembleListingInfo(items) {
    const salesObj = {
      totalListed: 0,
      inventoryCost: 0,
      expectedRevenue: 0,
      expectedProfit: 0,
    }

    items.forEach((x) => {
      const { listedPrice, expectedProfit, purchasePrice, listed } = x
      if (listed) {
        salesObj.totalListed++
        salesObj.inventoryCost += purchasePrice || 0
        salesObj.expectedRevenue += (purchasePrice || 0) + (expectedProfit || 0)
        salesObj.expectedProfit += expectedProfit || 0
      }
    })

    return {
      totalListed: salesObj.totalListed.toLocaleString("en-US"),
      inventoryCost: currencyFormatter.format(salesObj.inventoryCost),
      expectedRevenue: currencyFormatter.format(salesObj.expectedRevenue),
      expectedProfit: currencyFormatter.format(salesObj.expectedProfit),
    }
}

export default Toolbar
