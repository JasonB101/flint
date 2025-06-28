import React, { useEffect, useState } from "react"
import Styles from "./SoldItems.module.scss"
import SoldTable from "./SoldTable/SoldTable"
import Toolbar from "./Toolbar/Toolbar"
import SoldSummaryModal from "./SoldSummaryModal/SoldSummaryModal"

const SoldItems = (props) => {
  const {
    updateItem,
    items,
    ebayListings,
    getShippingLabels,
    returnInventoryItem,
    user,
  } = props
  
  const [soldItemsSearchTerm, changeSearchTerm] = useState("")
  const [timeFilter, setTimeFilter] = useState("thisyear") // "6months", "12months", "thisyear", "all"
  const [soldItems, setSoldItems] = useState([])
  const [itemsToShow, filterItems] = useState([])
  const [toggleSummaryModal, setToggleSummaryModal] = useState(false)

  // Filter items based on time range
  useEffect(() => {
    const allSoldItems = items.filter((x) => x.sold === true)
    
    const now = new Date()
    let filteredByTime = allSoldItems
    
    if (timeFilter === "6months") {
      const sixMonthsAgo = new Date()
      sixMonthsAgo.setMonth(now.getMonth() - 6)
      filteredByTime = allSoldItems.filter(item => {
        const saleDate = new Date(item.dateSold)
        return saleDate >= sixMonthsAgo
      })
    } else if (timeFilter === "12months") {
      const twelveMonthsAgo = new Date()
      twelveMonthsAgo.setFullYear(now.getFullYear() - 1)
      filteredByTime = allSoldItems.filter(item => {
        const saleDate = new Date(item.dateSold)
        return saleDate >= twelveMonthsAgo
      })
    } else if (timeFilter === "thisyear") {
      const yearStart = new Date(now.getFullYear(), 0, 1) // January 1st of current year
      filteredByTime = allSoldItems.filter(item => {
        const saleDate = new Date(item.dateSold)
        return saleDate >= yearStart
      })
    }
    
    setSoldItems(filteredByTime)
  }, [items, timeFilter])



  // Filter by search term
  useEffect(() => {
    if (soldItemsSearchTerm === "") {
      filterItems(soldItems)
    } else {
      filterItems(
        soldItems.filter((x) => {
          const { title, partNo, sku, buyer } = x
          const username = buyer ? buyer : "Unknown"
          const conditionsArray = [title, partNo, sku, username]
          return conditionsArray.some((j) =>
            j
              ? j.toLowerCase().includes(soldItemsSearchTerm.toLowerCase())
              : false
          )
        })
      )
    }
  }, [soldItemsSearchTerm, soldItems])

  return (
    <div className={Styles.wrapper}>
      {/* Main Content Card */}
      <div className={Styles.contentCard}>
        <div className={Styles.toolbarSection}>
          <Toolbar
            changeSearchTerm={changeSearchTerm}
            searchTerm={soldItemsSearchTerm}
            items={soldItems}
            ebayListings={ebayListings}
            setToggleSummaryModal={setToggleSummaryModal}
            timeFilter={timeFilter}
            setTimeFilter={setTimeFilter}
          />
        </div>
        
        <div className={Styles.tableSection}>
          <SoldTable
            updateItem={updateItem}
            soldItems={itemsToShow}
            ebayListings={ebayListings}
            getShippingLabels={getShippingLabels}
            returnInventoryItem={returnInventoryItem}
            user={user}
          />
        </div>
      </div>

      {/* Bottom Padding */}
      <div className={Styles.bottomPadding}></div>

      {/* Modal */}
      {toggleSummaryModal && (
        <SoldSummaryModal
          soldItems={soldItems}
          setToggleSummaryModal={setToggleSummaryModal}
        />
      )}
    </div>
  )
}

export default SoldItems
