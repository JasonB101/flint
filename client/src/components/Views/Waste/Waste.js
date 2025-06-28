import React, { useEffect, useState, useContext } from "react"
import Styles from "./Waste.module.scss"
import WasteTable from "./WasteTable/WasteTable"
import Toolbar from "./Toolbar/Toolbar"
import WasteSummaryModal from "./WasteSummaryModal/WasteSummaryModal"
import { storeContext } from "../../../Store"

const Waste = (props) => {
  const {
    updateItem,
    items,
    user,
  } = props
  
  const { getWasteItems } = useContext(storeContext)
  
  const [wasteSearchTerm, changeSearchTerm] = useState("")
  const [timeFilter, setTimeFilter] = useState("thisyear") // "6months", "12months", "thisyear", "all"
  const [wasteItems, setWasteItems] = useState([])
  const [itemsToShow, filterItems] = useState([])
  const [toggleSummaryModal, setToggleSummaryModal] = useState(false)

  // Load waste items on component mount
  useEffect(() => {
    loadWasteItems()
  }, [])

  const loadWasteItems = async () => {
    if (user?.token) {
      try {
        const fetchedWasteItems = await getWasteItems()
        applyTimeFilter(fetchedWasteItems)
      } catch (error) {
        console.error("Error loading waste items:", error)
        // Fallback to filtering from all items
        const fallbackWasteItems = items.filter((x) => x.status === "waste")
        applyTimeFilter(fallbackWasteItems)
      }
    }
  }

  // Apply time filter to waste items
  const applyTimeFilter = (allWasteItems) => {
    console.log(`🗑️ Applying time filter "${timeFilter}" to ${allWasteItems.length} waste items`)
    
    const now = new Date()
    let filteredByTime = allWasteItems
    
    if (timeFilter === "6months") {
      const sixMonthsAgo = new Date()
      sixMonthsAgo.setMonth(now.getMonth() - 6)
      filteredByTime = allWasteItems.filter(item => {
        // Include items without dateWasted (legacy items) OR items within timeframe
        if (!item.dateWasted) return true // Include legacy waste items
        const wasteDate = new Date(item.dateWasted)
        return wasteDate >= sixMonthsAgo
      })
    } else if (timeFilter === "12months") {
      const twelveMonthsAgo = new Date()
      twelveMonthsAgo.setFullYear(now.getFullYear() - 1)
      filteredByTime = allWasteItems.filter(item => {
        // Include items without dateWasted (legacy items) OR items within timeframe
        if (!item.dateWasted) return true // Include legacy waste items
        const wasteDate = new Date(item.dateWasted)
        return wasteDate >= twelveMonthsAgo
      })
    } else if (timeFilter === "thisyear") {
      const yearStart = new Date(now.getFullYear(), 0, 1) // January 1st of current year
      filteredByTime = allWasteItems.filter(item => {
        // Include items without dateWasted (legacy items) OR items within timeframe
        if (!item.dateWasted) return true // Include legacy waste items
        const wasteDate = new Date(item.dateWasted)
        return wasteDate >= yearStart
      })
    }
    // "all" timeFilter shows everything (no filtering needed)
    
    console.log(`🗑️ After time filtering: ${filteredByTime.length} waste items`)
    setWasteItems(filteredByTime)
  }

  // Re-apply time filter when timeFilter changes
  useEffect(() => {
    if (wasteItems.length > 0) {
      applyTimeFilter(wasteItems)
    } else {
      // If no waste items loaded yet, try loading them again
      loadWasteItems()
    }
  }, [timeFilter])

  // Also listen for changes in items array (for real-time updates)
  useEffect(() => {
    const allWasteItems = items.filter((x) => x.status === "waste")
    if (allWasteItems.length !== wasteItems.length) {
      applyTimeFilter(allWasteItems)
    }
  }, [items])

  // Filter by search term
  useEffect(() => {
    console.log(`🔍 Applying search filter "${wasteSearchTerm}" to ${wasteItems.length} waste items`)
    
    if (wasteSearchTerm === "") {
      filterItems(wasteItems)
      console.log(`🔍 No search term - showing all ${wasteItems.length} items`)
    } else {
      const searchFiltered = wasteItems.filter((x) => {
        const { title, partNo, sku, buyer } = x
        const username = buyer ? buyer : "Unknown"
        const conditionsArray = [title, partNo, sku, username]
        return conditionsArray.some((j) =>
          j
            ? j.toLowerCase().includes(wasteSearchTerm.toLowerCase())
            : false
        )
      })
      filterItems(searchFiltered)
      console.log(`🔍 Search filtered: ${searchFiltered.length} items match "${wasteSearchTerm}"`)
    }
  }, [wasteSearchTerm, wasteItems])

  // Delete waste item function (reuses the same endpoint as inventory)
  const deleteWasteItem = async (itemId) => {
    try {
      const response = await fetch(`/api/inventoryItems/${itemId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      })
      
      if (response.ok) {
        console.log(`✅ Successfully deleted waste item ${itemId}`)
        // Refresh the waste items list
        loadWasteItems()
        // Also trigger a refresh in the parent component if needed
        if (props.loadItems) {
          props.loadItems()
        }
      } else {
        const errorData = await response.json()
        console.error("Failed to delete waste item:", errorData.message)
        alert(`Failed to delete item: ${errorData.message}`)
      }
    } catch (error) {
      console.error("Error deleting waste item:", error)
      alert("Error deleting item. Please try again.")
    }
  }

  return (
    <div className={Styles.wrapper}>
      {/* Main Content Card */}
      <div className={Styles.contentCard}>
        <div className={Styles.toolbarSection}>
          <Toolbar
            changeSearchTerm={changeSearchTerm}
            searchTerm={wasteSearchTerm}
            items={wasteItems}
            setToggleSummaryModal={setToggleSummaryModal}
            timeFilter={timeFilter}
            setTimeFilter={setTimeFilter}
          />
        </div>
        
        <div className={Styles.tableSection}>
          <WasteTable
            updateItem={updateItem}
            wasteItems={itemsToShow}
            user={user}
            deleteWasteItem={deleteWasteItem}
          />
          {/* Debug info */}
          <div style={{ padding: '10px', fontSize: '12px', color: '#666' }}>
            Debug: Showing {itemsToShow.length} waste items to table
          </div>
        </div>
      </div>

      {/* Bottom Padding */}
      <div className={Styles.bottomPadding}></div>

      {/* Modal */}
      {toggleSummaryModal && (
        <WasteSummaryModal
          wasteItems={wasteItems}
          setToggleSummaryModal={setToggleSummaryModal}
        />
      )}
    </div>
  )
}

export default Waste 