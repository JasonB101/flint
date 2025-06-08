import React, { useState, useEffect } from "react";
import Styles from "./Inventory.module.scss";
import InventoryTable from "./InventoryTable/InventoryTable"
import NewItemModal from "./NewItemModal/NewItemModal";
import LinkItemModal from "./InventoryTable/LinkItemModal/LinkItemModal";
import Toolbar from "./Toolbar/Toolbar"

const Inventory = (props) => {

    const { items, ebayListings, getEbayListing, submitNewItem, newListings, editInventoryItem, linkItem, user: {averageShippingCost, ebayFeePercent}, getActiveListings, getCompatibility } = props;
    const [inventoryList] = useState(items.filter(x => x.listed))
    const [itemsToShow, filterItems] = useState(inventoryList);
    const [showNewItemModal, toggleNewItemModal] = useState(false);


    const nextSku = items.reduce((highest, x) => {
        if (+x.sku > highest) {
            highest = +x.sku
        }
        return highest;
    }, 0) + 1;

    

    // After this inventoryId is cleared, the link Modal will close.
    const [inventoryId, setInventoryId] = useState("");

    const [inventorySearchTerm, changeSearchTerm] = useState("");

    function openLinkModal(id, sku) {
        setInventoryId({id, sku});
    }

    useEffect(() => {
        if (inventorySearchTerm === "") {
            filterItems(inventoryList)
        } else {
            filterItems(inventoryList.filter(x => {
                const { title, partNo, sku } = x;
                const conditionsArray = [title, partNo, sku];
                return conditionsArray.some(j => j.toLowerCase().includes(inventorySearchTerm.toLowerCase()));
            }))
        }


    }, [inventorySearchTerm, inventoryList]);
    const formatCurrency = (value) => {
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
        }).format(value);
    };

    return (
        <div className={Styles.wrapper}>


            {/* Main Content Card */}
            <div className={Styles.contentCard}>
                <div className={Styles.toolbarSection}>
                    <Toolbar 
                        changeSearchTerm={changeSearchTerm}
                        searchTerm={inventorySearchTerm}
                        toggleModal={toggleNewItemModal}
                        items={items} 
                    />
                </div>
                
                <div className={Styles.tableSection}>
                    <InventoryTable 
                        editInventoryItem={editInventoryItem} 
                        openLinkModal={openLinkModal} 
                        ebayListings={ebayListings} 
                        inventoryList={itemsToShow} 
                    />
                </div>
            </div>

            {/* Bottom Padding */}
            <div className={Styles.bottomPadding}></div>

            {/* Modals */}
            {/* {inventoryId && <LinkItemModal inventoryId={inventoryId}
                linkItem={linkItem}
                newListings={newListings}
                setInventoryId={setInventoryId} />} */}
            {showNewItemModal && (
                <NewItemModal 
                    getEbayListing={getEbayListing} 
                    items={items} 
                    nextSku={nextSku} 
                    submitNewItem={submitNewItem} 
                    toggleModal={toggleNewItemModal} 
                    averageShippingCost={averageShippingCost} 
                    ebayFeePercent={ebayFeePercent} 
                    getActiveListings={getActiveListings} 
                    getCompatibility={getCompatibility} 
                    ebayListings={ebayListings} 
                />
            )}
        </div>
    );
}



export default Inventory;