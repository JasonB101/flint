import React from "react"
import { Button } from "react-bootstrap"
import Styles from "./Toolbar.module.scss"

const currencyFormatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
});

const Toolbar = (props) => {
  const { toggleModal, searchTerm, changeSearchTerm, items } = props
  const listingsDetails = assembleListingInfo(items)
  const {totalListed, activeListings, inventoryCost} = listingsDetails

  return (
    <div className={Styles.wrapper}>
      <input
        onChange={(e) => changeSearchTerm(e.target.value)}
        type="text"
        value={searchTerm}
        placeholder={"Search Inventory"}
      />
       <h5>Listed
                <span>{totalListed}</span>
            </h5>
            <h5>Listings Value
                <span>{`${currencyFormatter.format(activeListings[0].toFixed(2))} /`}
                    <span style={{ color: "green", display: "inline" }}>{currencyFormatter.format(activeListings[1].toFixed(2))}
                    </span>
                </span>
            </h5>
       <h5>Inventory Cost
                <span>{currencyFormatter.format(inventoryCost)}</span>
            </h5>
            
      <div className="spacer"></div>
      <Button onClick={() => toggleModal(true)}>New Item</Button>
    </div>
  )

  
}

function assembleListingInfo(items) {
    const salesObj = {
      activeListings: [0, 0],
      totalListed: 0,
      inventoryCost: 0,
    }

    const info = items.reduce((listingInfo, x) => {
      const { listedPrice, expectedProfit, purchasePrice } = x
      if (x.listed) {
        listingInfo.totalListed++
        listingInfo.inventoryCost += purchasePrice
        listingInfo.activeListings[0] += purchasePrice + expectedProfit
        listingInfo.activeListings[1] += expectedProfit
      }
    
      return listingInfo
    }, salesObj)
    return info
  }

export default Toolbar
