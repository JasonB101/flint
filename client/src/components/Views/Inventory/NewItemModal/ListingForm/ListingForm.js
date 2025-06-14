import React, { useState, useEffect } from "react"
import { Modal, Form, Button, Col } from "react-bootstrap"
import categories from "../../../../../lib/ebayCategoryInfo"
import Label from "./Label/Label"
import Styles from "./ListingForm.module.scss"
import { getLabelFromTitle } from "./Label/getLabelDetails"
import ActiveListingsModal from "./ActiveListingsModal/ActiveListingsModal"
import CompatibilityModal from "./CompatibilityModal/CompatibilityModal"
import ConfirmModal from "../../../../ConfirmModal/ConfirmModal"
import figureExpectedProfit from "../../../../../lib/figureExpectedProfit"
import createLinkItemData from "../../../../../lib/createLinkItemData"
const ListingForm = (props) => {
  const {
    toggleModal,
    submitNewItem,
    itemForm,
    items,
    averageShippingCost,
    getActiveListings,
    getCompatibility,
    ebayFeePercent,
    ebayListings,
    getEbayListing,
  } = props

  const [showConfirm, setShowConfirm] = useState(false)
  const [itemToBeLinked, setItemToBeLinked] = useState(false)

  const { categoryName, partNo, sku, purchasePrice } = itemForm
  const autoFill = categories.find((x) => x.category === categoryName) || {
    title: "",
    description: "",
  }
  const { title: autoTitle, description: autoDescription } = autoFill

  const [inputForm, setInput] = useState({
    title: `${autoTitle || ""} ${partNo}`,
    partNo,
    sku: sku,
    brand: "",
    listedPrice: "",
    dateListed: new Date().toLocaleDateString(),
    conditionId: 3000,
    conditionDescription: "",
    acceptOfferHigh: "",
    declineOfferLow: "",
    shippingService: "USPSPriority",
    description: `${autoDescription || ""}`,
    location: "",
    year: "",
    model: "",
  })

  const [activeListingsData, changeActiveListingsData] = useState({
    showActiveListingsModal: false,
    showCompatibilityModal: false,
    compatibilityEnabled: false,
    activeListings: [],
    compatibilityList: [],
  })

  useEffect(() => {
    if (ebayListings.some((x) => x.SKU === itemForm.sku)) {
      handleListingWithSkuExists()
    }
  }, [ebayListings, itemForm.sku])

  useEffect(() => {
    if (partNo !== "N/A") {
      const existingItems = items
        .filter((x) => x.partNo === partNo)
        .sort((a, b) => {
          const getTimeWithListedPrice = (item) => {
            const dateSold = new Date(item.dateSold ?? 0).getTime()
            const datePurchased = new Date(item.datePurchased).getTime()
            return Math.max(
              dateSold + item.listedPrice,
              datePurchased + item.listedPrice
            )
          }

          return getTimeWithListedPrice(b) - getTimeWithListedPrice(a) // Compare in descending order
        })

      if (existingItems.length > 0) {
        const existing = existingItems[0]
        const {
          title,
          brand = "",
          shippingService = "USPSPriority",
          listedPrice,
          location = "",
        } = existing
        let labelDetails = getLabelFromTitle(title)
        let { year, model } = labelDetails
        let acceptOfferHigh = (+listedPrice - 9.99).toFixed(2)
        let declineOfferLow = (+listedPrice - 19.99).toFixed(2)
        setInput((prevInputForm) => ({
          ...prevInputForm,
          title,
          brand,
          shippingService,
          listedPrice: listedPrice,
          acceptOfferHigh,
          declineOfferLow,
          location,
          year,
          model,
        }))
      }
    }
  }, [items, partNo])

  const expectedProfit = figureExpectedProfit(
    inputForm.listedPrice,
    purchasePrice,
    [], // additionalCosts, cleaning parts service etc...
    averageShippingCost,
    ebayFeePercent
  )

  // useEffect(() => {
  //   // Fetch active listings when the component mounts and when partNo changes
  //   const fetchActiveListings = async () => {
  //     try {
  //       const activeListingsData = (await getActiveListings(partNo)) || []
  //       const activeIds = activeListingsData.map((x) => x.itemId)
  //       const compatibilityList = await getCompatibility(activeIds, partNo)

  //       changeActiveListingsData((prevActiveListings) => {
  //         return {
  //           ...prevActiveListings,
  //           activeListings: activeListingsData,
  //           compatibilityList: compatibilityList,
  //           compatibilityEnabled: compatibilityList.length > 0,
  //         }
  //       })
  //     } catch (error) {
  //       console.error("Error fetching active listings:", error.message)
  //     }
  //   }
  //   if (partNo !== "N/A" && partNo !== "") {
  //     fetchActiveListings()
  //   }
  // }, [partNo])

  function handleListingWithSkuExists() {
    setShowConfirm(true)
  }

  const handleConfirmResult = async (result) => {
    //If an ebay listing exists with the SKU provided
    if (result) {
      setItemToBeLinked(true)
      const ebayItem = ebayListings.find((x) => x.SKU === itemForm.sku)
      const ebayItemId = ebayItem.ItemID
      const listingInfo = await createLinkItemData(ebayItemId, getEbayListing)
      setInput((prevInputForm) => ({
        ...prevInputForm,
        ...listingInfo,
      }))
    }
    // Hide the modal regardless of the result
    setShowConfirm(false)
  }

  const openActiveListingsModal = () => {
    changeActiveListingsData((prev) => {
      return {
        ...prev,
        showActiveListingsModal: true,
      }
    })
  }
  const closeActiveListingsModal = () => {
    changeActiveListingsData((prev) => {
      return {
        ...prev,
        showActiveListingsModal: false,
      }
    })
  }
  const openCompatibilityModal = () => {
    changeActiveListingsData((prev) => {
      return {
        ...prev,
        showCompatibilityModal: true,
      }
    })
  }
  const closeCompatibilityModal = () => {
    changeActiveListingsData((prev) => {
      return {
        ...prev,
        showCompatibilityModal: false,
      }
    })
  }

  const handleCompatibilityEnabled = (e) => {
    let setToTrue =
      !activeListingsData.compatibilityEnabled &&
      activeListingsData.compatibilityList.length > 0
        ? true
        : false
    changeActiveListingsData((prev) => {
      return {
        ...prev,
        compatibilityEnabled: setToTrue,
      }
    })
  }
  const handleChange = ({ target }) => {
    const { name, value } = target
    const updateForm = {
      ...inputForm,
      [name]: value.trimLeft(),
    }
    if (name === "listedPrice") {
      updateForm.acceptOfferHigh = (+value - 9.99).toFixed(2)
      updateForm.declineOfferLow = (+value - 19.99).toFixed(2)
    }
    if (name === "title") {
      let labelDetails = getLabelFromTitle(value)
      let { year, model } = labelDetails

      updateForm.year = year
      updateForm.model = model
    }
    setInput(updateForm)
  }

  const handleSelect = (e) => {
    const condition = e.target.value
    switch (condition) {
      case "Used":
        setInput({
          ...inputForm,
          conditionId: 3000,
        })
        break
      case "For Parts":
        setInput({
          ...inputForm,
          conditionId: 7000,
        })
        break
      case "New":
        setInput({
          ...inputForm,
          conditionId: 1000,
        })
        break
      default:
    }
  }

  const handleShippingSelect = (e) => {
    setInput({
      ...inputForm,
      shippingService: e.target.value,
    })
  }

  function printLabel() {
    window.frames["pdfView"].print()
  }

  async function saveChanges(e) {
    e.preventDefault()
    let compatibilityList = activeListingsData.compatibilityEnabled
      ? activeListingsData.compatibilityList
      : []
    let ebayForm = {
      ...inputForm,
      compatibilities: compatibilityList,
    }
    try {
      const successfullyListed = await submitNewItem({
        ...itemForm,
        ...ebayForm,
      })
      if (successfullyListed.success === true) {
        toggleModal(false)
      } else {
       throw new Error(successfullyListed.message)
      }
    } catch (e) {
      alert(e.message)
    }
  }

  return (
    <Form onSubmit={saveChanges}>
      <Form.Row>
        <Form.Group as={Col} controlId="formGridTitle">
          <Form.Label>Title</Form.Label>
          <Form.Control
            required
            value={inputForm.title}
            maxLength="80"
            name="title"
            onChange={handleChange}
            placeholder=""
          />
        </Form.Group>
      </Form.Row>
      <Form.Label>Money</Form.Label>
      <div className={Styles.formRowCustom}>
        <div className={Styles.formGroupCustom}>
          <Form.Control
            required
            value={inputForm.listedPrice}
            name="listedPrice"
            onChange={handleChange}
            placeholder="List Price"
          />
        </div>

        <div className={Styles.formGroupCustom}>
          <Form.Control
            value={inputForm.acceptOfferHigh}
            name="acceptOfferHigh"
            onChange={handleChange}
            placeholder="Accepted Offer"
          />
        </div>

        <div className={Styles.formGroupCustom}>
          <Form.Control
            value={inputForm.declineOfferLow}
            name="declineOfferLow"
            onChange={handleChange}
            placeholder="Declined Offer"
          />
        </div>

        <span className={Styles["expected-profit-label"]}>
          ${expectedProfit}
        </span>
      </div>
      <Form.Row>
        <Form.Group as={Col} className="text-center">
          <Button
            className={Styles.listingFormButton}
            variant="primary"
            onClick={openActiveListingsModal}
          >
            View Active Listings
          </Button>
        </Form.Group>
        <div className={Styles.mainToggle}>
          <label className={Styles.switch}>
            <input
              type="checkbox"
              name="compatibilityEnabled"
              checked={activeListingsData.compatibilityEnabled}
              onChange={handleCompatibilityEnabled}
            />
            <span className={Styles.slider}></span>
          </label>
          <span>Compatibility</span>
        </div>
        <Form.Group as={Col} className="text-center">
          <Button
            className={Styles.listingFormButton}
            variant="primary"
            onClick={openCompatibilityModal}
          >
            Edit Compatibility
          </Button>
        </Form.Group>
      </Form.Row>
      <Form.Row>
        <Form.Group as={Col} controlId="formGridDescription">
          <Form.Label>Item Description</Form.Label>
          <Form.Control
            as="textarea"
            rows="6"
            value={inputForm.description}
            name="description"
            onChange={handleChange}
            placeholder="Item Specifics"
          />
        </Form.Group>
      </Form.Row>

      <Form.Label>Manufacturer</Form.Label>
      <Form.Row>
        <Form.Group as={Col} controlId="formGridBrand">
          <Form.Control
            value={inputForm.brand}
            name="brand"
            onChange={handleChange}
            placeholder="Brand"
          />
        </Form.Group>
        <Form.Group as={Col} controlId="formGridPartNo">
          <Form.Control
            value={inputForm.partNo}
            name="partNo"
            onChange={handleChange}
            placeholder="Part Number"
          />
        </Form.Group>
      </Form.Row>
      <Form.Label>Shipping Service</Form.Label>
      <Form.Row>
        <Form.Group md={8} as={Col} controlId="formGridConditionId">
          <Form.Control
            as="select"
            name="conditionId"
            onChange={handleShippingSelect}
          >
            <option>USPSPriority</option>
            <option>USPSFirstClass</option>
            <option>UPSGround</option>
          </Form.Control>
        </Form.Group>
      </Form.Row>
      <Form.Label>Condition</Form.Label>
      <Form.Row>
        <Form.Group md={4} as={Col} controlId="formGridConditionId">
          <Form.Control as="select" name="conditionId" onChange={handleSelect}>
            <option>Used</option>
            <option>For Parts</option>
            <option>New</option>
          </Form.Control>
        </Form.Group>
        <Form.Group as={Col} controlId="formGridConditionDescription">
          <Form.Control
            value={inputForm.conditionDescription}
            name="conditionDescription"
            onChange={handleChange}
            placeholder="eg. 'Used, but in working condition'"
          />
        </Form.Group>
      </Form.Row>
      <Form.Row>
        <Form.Group as={Col} controlId="formGridLocation">
          <Form.Label>Stock Location</Form.Label>
          <Form.Control
            value={inputForm.location}
            name="location"
            onChange={handleChange}
            placeholder="Section A, Shelf 1"
          />
        </Form.Group>
      </Form.Row>

      <Modal.Footer className={Styles["footer"]}>
        <i
          onClick={printLabel}
          className={`${Styles["printIcon"]} material-icons`}
        >
          print
        </i>
        <Form.Control
          className={`${Styles["labelInput"]} ${Styles["labelYearInput"]}`}
          value={inputForm.year}
          name="year"
          onChange={handleChange}
          placeholder="Year"
        />
        <Form.Control
          className={`${Styles["labelInput"]} ${Styles["labelModelInput"]}`}
          value={inputForm.model}
          name="model"
          onChange={handleChange}
          placeholder="Model"
        />

        <Button onClick={() => toggleModal(false)} variant="secondary">
          Close
        </Button>
        <Button type="submit" variant="primary">
          {itemToBeLinked ? "Link Item" : "List Item"}
        </Button>

        <Label
          labelInfo={{
            sku: inputForm.sku,
            year: inputForm.year,
            model: inputForm.model,
          }}
        />
      </Modal.Footer>
      {activeListingsData.showActiveListingsModal && (
        <ActiveListingsModal
          closeActiveListingsModal={closeActiveListingsModal}
          activeListings={activeListingsData.activeListings}
        />
      )}
      {activeListingsData.showCompatibilityModal && (
        <CompatibilityModal
          closeCompatibilityModal={closeCompatibilityModal}
          compatibilityList={activeListingsData.compatibilityList}
          changeActiveListingsData={changeActiveListingsData}
        />
      )}
      {showConfirm && (
        <ConfirmModal
          question="An eBay listing was found with this SKU, would you like to link with it?"
          onResult={handleConfirmResult}
        />
      )}
    </Form>
  )
}

export default ListingForm
