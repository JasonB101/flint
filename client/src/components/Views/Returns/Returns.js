import React, { useEffect, useState } from "react"
import Styles from "./Returns.module.scss"
import ReturnsTable from "./ReturnsTable/ReturnsTable"
import Toolbar from "./Toolbar/Toolbar"
import ReturnsSummaryModal from "./ReturnsSummaryModal/ReturnsSummaryModal"

const Returns = (props) => {
  const {
    updateItem,
    items,
    ebayListings,
    getShippingLabels,
    returnInventoryItem,
    user,
  } = props
  const [returnsSearchTerm, changeSearchTerm] = useState("")
  const [timeFilter, setTimeFilter] = useState("thisyear") // "6months", "12months", "thisyear", "all"
  const [returnedItems, setReturnedItems] = useState([])
  const [itemsToShow, filterItems] = useState([])
  const [toggleSummaryModal, setToggleSummaryModal] = useState(false)

  // Filter items for returns - items that have returnShippingCost in additionalCosts
  useEffect(() => {
    const allReturnedItems = items.filter((item) => {
      return item.additionalCosts && 
             item.additionalCosts.some(cost => 
               cost.title === "returnShippingCost" && cost.amount > 0
             )
    })
    
    const now = new Date()
    let filteredByTime = allReturnedItems
    
    if (timeFilter === "6months") {
      const sixMonthsAgo = new Date()
      sixMonthsAgo.setMonth(now.getMonth() - 6)
      filteredByTime = allReturnedItems.filter(item => {
        const updateDate = new Date(item.updatedAt || item.dateSold)
        return updateDate >= sixMonthsAgo
      })
    } else if (timeFilter === "12months") {
      const twelveMonthsAgo = new Date()
      twelveMonthsAgo.setFullYear(now.getFullYear() - 1)
      filteredByTime = allReturnedItems.filter(item => {
        const updateDate = new Date(item.updatedAt || item.dateSold)
        return updateDate >= twelveMonthsAgo
      })
    } else if (timeFilter === "thisyear") {
      const yearStart = new Date(now.getFullYear(), 0, 1) // January 1st of current year
      filteredByTime = allReturnedItems.filter(item => {
        const updateDate = new Date(item.updatedAt || item.dateSold)
        return updateDate >= yearStart
      })
    }
    
    setReturnedItems(filteredByTime)
  }, [items, timeFilter])

  // Filter by search term
  useEffect(() => {
    if (returnsSearchTerm === "") {
      filterItems(returnedItems)
    } else {
      filterItems(
        returnedItems.filter((x) => {
          const { title, partNo, sku, buyer } = x
          const username = buyer ? buyer : "Unknown"
          const conditionsArray = [title, partNo, sku, username]
          return conditionsArray.some((j) =>
            j
              ? j.toLowerCase().includes(returnsSearchTerm.toLowerCase())
              : false
          )
        })
      )
    }
  }, [returnsSearchTerm, returnedItems])

  return (
    <div className={Styles.wrapper}>
      {/* Main Content Card */}
      <div className={Styles.contentCard}>
        <div className={Styles.toolbarSection}>
          <Toolbar
            changeSearchTerm={changeSearchTerm}
            searchTerm={returnsSearchTerm}
            items={returnedItems}
            ebayListings={ebayListings}
            setToggleSummaryModal={setToggleSummaryModal}
            timeFilter={timeFilter}
            setTimeFilter={setTimeFilter}
          />
        </div>
        
        <div className={Styles.tableSection}>
          <ReturnsTable
            updateItem={updateItem}
            returnedItems={itemsToShow}
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
        <ReturnsSummaryModal
          returnedItems={returnedItems}
          setToggleSummaryModal={setToggleSummaryModal}
        />
      )}
    </div>
  )
}

export default Returns 