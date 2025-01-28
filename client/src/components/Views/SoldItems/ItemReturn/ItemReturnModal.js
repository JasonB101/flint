import React, { useEffect, useState } from "react"
import Styles from "./ItemReturnModal.module.scss"
import updateAdditionalCosts from "./updateAdditionalCost"
import figureExpectedProfit from "../../../../lib/figureExpectedProfit"
import itemReListed from "./itemReListed"
import itemIsWaste from "./itemIsWaste"

const ItemReturnModal = ({
  onClose,
  onSubmit,
  itemObject,
  ebayListings,
  getShippingLabels,
  user,
}) => {
  let {
    _id: itemId,
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
    dateListed,
    additionalCosts = [],
  } = itemObject

  const { averageShippingCost, ebayFeePercent } = user

  const ebayListing = ebayListings.find((x) => x.SKU === sku)
  if (ebayListing) {
    const {
      ItemID: newEbayId,
      ListingDetails: { StartTime },
    } = ebayListing
    dateListed = new Date(StartTime).toLocaleDateString()
    ebayId = newEbayId
  }
  const [submitEnabled, setSubmitEnabled] = useState(false)

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

  let newExpectedProfit = inputs.isRelisted
    ? figureExpectedProfit(
        listedPrice,
        purchasePrice,
        combinedAdditionalCost,
        averageShippingCost,
        ebayFeePercent
      )
    : +(
        0 -
        +purchasePrice -
        combinedAdditionalCost.reduce((acc, cost) => acc + cost.amount, 0)
      ).toFixed(2)

  const itemReturnValues = {
    itemId: itemId,
    ebayId: ebayId,
    dateListed,
    expectedProfit: newExpectedProfit,
    additionalCosts: combinedAdditionalCost,
    roi: Math.floor((purchasePrice / newExpectedProfit) * 100),
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target

    setInputs((prevState) => ({
      ...prevState,
      [name]: type === "checkbox" ? checked : value,
    }))
  }

  const prepareAndSubmitChanges = () => {
    let updates = inputs.isRelisted
      ? itemReListed(itemReturnValues)
      : itemIsWaste(itemReturnValues)
    if (ebayListing && !inputs.isRelisted) {
      //end listing
    }
    onSubmit(updates)
  }
  async function fetchAndSetReturnShippingCost() {
    try {
      const labels = await getShippingLabels(orderId)

      const returnLabels = labels.filter(
        (label) => label.transactionMemo === "Return shipping label"
      )

      if (returnLabels.length > 0) {
        const latestLabel = returnLabels.reduce((latest, current) => {
          const latestDate = new Date(latest.date)
          const currentDate = new Date(current.date)
          return currentDate > latestDate ? current : latest
        })

        const returnShippingCost = parseFloat(latestLabel.amount.value || 0)

        setInputs((prev) => ({
          ...prev,
          returnShippingCost,
        }))
      }
    } catch (error) {
      console.error("Error fetching shipping labels:", error)
    }
    setSubmitEnabled(true)
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
                <strong>Purchase Price</strong> ${purchasePrice}
              </p>
              <p>
                <strong>Expected Profit:</strong> $
                {itemReturnValues.expectedProfit}
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
              disabled={!submitEnabled}
              onClick={prepareAndSubmitChanges}
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
