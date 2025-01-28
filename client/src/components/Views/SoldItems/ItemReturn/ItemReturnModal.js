import React, { useEffect, useState } from "react"
import Styles from "./ItemReturnModal.module.scss"
import updateAdditionalCosts from "./updateAdditionalCost"
import figureExpectedProfit from "../../../../lib/figureExpectedProfit"

const ItemReturnModal = ({
  onClose,
  onSubmit,
  itemObject,
  ebayListings,
  getShippingLabels,
  user
}) => {
  let {
    title,
    sku,
    ebayId,
    dateSold,
    priceSold,
    buyer,
    orderId,
    listedPrice,
    purchasePrice,
    shippingCost,
    additionalCosts = [],
  } = itemObject

  const { averageShippingCost, ebayFeePercent } = user

  const ebayListing = ebayListings.find((x) => x.SKU === sku)
  if (ebayListing) ebayId = ebayListing.ItemID

  const [itemObjectReturnValues, setItemObjectReturnValues] = useState({
    listed: true,
    ebayId: ebayId,
    dateListed: "",
    expectedProfit: 0,
    additionalCosts,
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
  })

  const [inputs, setInputs] = useState({
    isRelisted: Boolean(ebayListing),
    returnShippingCost: 0,
    refundAmount: 100,
  })

  const [combinedAdditionalCost, setCombinedAdditionalCost] =
    useState(additionalCosts)
  useEffect(() => {
    fetchAndSetReturnShippingCost()
  }, [orderId])

  useEffect(() => {
    const updatedAdditionalCosts = updateAdditionalCosts(
      additionalCosts,
      inputs.returnShippingCost,
      shippingCost
    )

    setCombinedAdditionalCost(updatedAdditionalCosts)
  }, [inputs.returnShippingCost, additionalCosts, shippingCost])

  let newExpectedProfit = figureExpectedProfit(listedPrice, purchasePrice, combinedAdditionalCost, averageShippingCost, ebayFeePercent)

  async function fetchAndSetReturnShippingCost() {
    try {
      const labels = await getShippingLabels(orderId)

      const totalReturnShippingCost = labels
        .filter((label) => label.transactionMemo === "Return shipping label")
        .reduce(
          (total, label) => total + parseFloat(label.amount.value || 0),
          0
        )

      setInputs((prev) => ({
        ...prev,
        returnShippingCost: totalReturnShippingCost,
      }))
    } catch (error) {
      console.error("Error fetching shipping labels:", error)
    }
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target

    setInputs((prevState) => ({
      ...prevState,
      [name]: type === "checkbox" ? checked : value,
    }))
  }

  return (
    <div className={Styles.modal}>
      <div className={Styles.modalContent}>
        <button className={Styles.closeButton} onClick={onClose}>
          &times;
        </button>
        <div className={Styles.contentWrapper}>
          <h2 className={Styles.title}>Item Return Details</h2>
          <p>
            <strong>Title:</strong> {title}
          </p>
          <div className={Styles.infoSection}>
            <p>
              <strong>SKU:</strong> {sku}
            </p>
            <p>
              <strong>Buyer:</strong> {buyer || "N/A"}
            </p>
            <p>
              <strong>Price Sold:</strong> ${priceSold || "0.00"}
            </p>
            <p>
              <strong>Date Sold:</strong> {dateSold || "N/A"}
            </p>
            <p>
              <strong>eBay ID:</strong> {ebayId || "N/A"}
            </p>
            <p>
              <strong>Order ID:</strong> {orderId || "N/A"}
            </p>
          </div>
          <div className={Styles.moneyInfo}>
            <div className={Styles.additionalCosts}>
              <h5>Additional Costs</h5>
              <div className={Styles.additionalCostsInputs}>
                <div className={Styles.additionalCostItem}>
                  <label htmlFor="returnShippingCost">Return Shipping</label>
                  <input
                    id="returnShippingCost"
                    type="number"
                    value={inputs.returnShippingCost}
                    onChange={(e) =>
                      setInputs((prev) => ({
                        ...prev,
                        returnShippingCost: parseFloat(e.target.value) || 0,
                      }))
                    }
                  />
                </div>
                <div className={Styles.additionalCostItem}>
                  <label>Shipping Cost</label>
                  <p>{shippingCost.toFixed(2)}</p>
                </div>
              </div>
            </div>
          <div className={Styles.expectedProfitWrapper}>
          <p>
              <strong>Listed Price:</strong> ${listedPrice}
            </p>
            <p>
              <strong>Expected Profit:</strong> ${newExpectedProfit}
            </p>
          </div>
          </div>
          <div className={Styles.actionSection}>
            <div className={Styles.mainToggle}>
              <label className={Styles.switch}>
                <input
                  type="checkbox"
                  name="isRelisted"
                  checked={inputs.isRelisted}
                  onChange={handleChange}
                />
                <span className={Styles.slider}></span>
              </label>
              <h5>{inputs.isRelisted ? "Relisted" : "Waste"}</h5>
            </div>

            <div className="spacer"></div>
            <button
              className={Styles.submitButton}
              onClick={() => onSubmit({ itemObjectReturnValues })}
            >
              Submit
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ItemReturnModal
