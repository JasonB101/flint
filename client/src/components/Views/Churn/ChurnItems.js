import React from "react"
import Styles from "./Churn.module.scss"
import getDaysInBetween from "../../../lib/getDaysBetween";


const ChurnItems = ({ items }) => {
 

  return <div className={Styles["churnItemsWrapper"]}>
{items.map((item) => {
        const daysInInventory = getDaysInBetween(new Date(item.datePurchased), new Date());
        return (
          <div key={item._id} className={Styles.churnItem}>
            <h3>{item.title}</h3>
            <p>Listed Price: ${item.listedPrice.toFixed(2)}</p>
            <p>Expected Profit: ${item.expectedProfit.toFixed(2)}</p>
            <p>SKU: {item.sku}</p>
            <p>Days in Inventory: {daysInInventory} days</p>
            <p>Date Re-Listed: {item.dateReListed} </p>
            <div className={Styles.buttonContainer}>
            <button
              type="button"
              onClick={() =>
                window.open(
                  `https://www.ebay.com/itm/${item.ebayId}`,
                  "_blank"
                )
              }
            >View Listing</button>
            </div>
          </div>
        );
      })}
  </div>
}

export default ChurnItems
