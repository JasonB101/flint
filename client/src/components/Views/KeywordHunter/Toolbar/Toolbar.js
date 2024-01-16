import React from "react"
import { Button } from "react-bootstrap"
import Styles from "./Toolbar.module.scss"

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
})

const Toolbar = (props) => {
  const { toggleModal, keywordsHunted } = props

  return (
    <div className={Styles.wrapper}>
      <h5>
        Hunting
        <span></span>
      </h5>
      <h5>
        Listings Value
        <span>
          <span ></span>
        </span>
      </h5>
      <h5>
        Inventory Cost
        <span></span>
      </h5>

      <div className="spacer"></div>
      <Button onClick={() => toggleModal(true)}>Search Sold Items</Button>
    </div>
  )
}

export default Toolbar
