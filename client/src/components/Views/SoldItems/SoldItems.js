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
  const [soldItems] = useState(items.filter((x) => x.sold === true))
  const [itemsToShow, filterItems] = useState(soldItems)
  const [toggleSummaryModal, setToggleSummaryModal] = useState(false)

  useEffect(() => {
    console.log("useEffect")
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
            setToggleSummaryModal={setToggleSummaryModal}
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
