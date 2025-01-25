import React, { useState } from "react";
import Styles from "./ItemReturnModal.module.scss";

const ItemReturnModal = ({ onClose, onSubmit, itemObject }) => {
  const {
    title,
    sku,
    ebayId,
    dateSold,
    priceSold,
    buyer,
    orderId,
    expectedProfit,
    shippingCost,
    additionalCosts = [],
  } = itemObject;

  const [itemObjectReturnValues, setItemObjectReturnValues] = useState({
    listed: true,
    ebayId: "",
    dateListed: "",
    expectedProfit: 0,
    additionalCosts: [],
    shippingCost: 0,
    priceSold: 0,
    shipped: false,
    sold: false,
    status: "active", // or "waste"
    buyer: "",
    dateSold: "",
    ebayFees: 0,
    orderId: "",
    profit: 0,
    roi: 0,
    trackingNumber: "0",
    daysListed: 0,
    listingAgent: "member",
  });

  return (
    <div className={Styles.modal}>
      <div className={Styles.modalContent}>
        <button className={Styles.closeButton} onClick={onClose}>
          &times;
        </button>
        <div className={Styles.contentWrapper}>
          <h2 className={Styles.title}>Item Return Details</h2>
            <p><strong>Title:</strong> {title}</p>
          <div className={Styles.infoSection}>
            <p><strong>SKU:</strong> {sku}</p>
            <p><strong>Buyer:</strong> {buyer || "N/A"}</p>
            <p><strong>Price Sold:</strong> ${priceSold || "0.00"}</p>
            <p><strong>Date Sold:</strong> {dateSold || "N/A"}</p>
            <p><strong>eBay ID:</strong> {ebayId || "N/A"}</p>
            <p><strong>Order ID:</strong> {orderId || "N/A"}</p>
          </div>
          <div className={Styles.actionSection}>
            <button
              className={Styles.submitButton}
              onClick={() => onSubmit({itemObjectReturnValues})}
            >
              Submit
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ItemReturnModal;
