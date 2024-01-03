import React, { useEffect, useState } from "react"
import Styles from "./PartHunter.module.scss"
import { useParams } from "react-router-dom"

const PartHunter = (props) => {
  const { getActiveListings } = props
  const { keyword = "" } = useParams()
  const [searchTerm, changeSearchTerm] = useState(keyword)
  const [listings, setListings] = useState([])
  const [sortOption, setSortOption] = useState("newest")

  useEffect(() => {
    if (keyword !== "") setListings(getActiveListings(keyword))
  }, [keyword])

  const handleSearch = async () => {
    const activeListings = await getActiveListings(searchTerm)
    setListings(activeListings.filter(x => x.condition ? x.condition.toLowerCase() === "used" : false))
  }

  const handleRemoveItem = (itemId) => {
    // Filter out the item with the specified itemId
    const updatedListings = listings.filter((item) => item.itemId !== itemId)
    setListings(updatedListings)
  }

  const handleSortChange = (e) => {
    setSortOption(e.target.value)
  }

  const sortedListings = [...listings].sort((a, b) => {
    switch (sortOption) {
      case "newest":
        return new Date(b.listedOn) - new Date(a.listedOn)
      case "oldest":
        return new Date(a.listedOn) - new Date(b.listedOn)
      case "highest":
        return b.price - a.price
      case "lowest":
        return a.price - b.price
      default:
        return 0
    }
  })

  const listingInfo = listings.reduce(
    (info, item) => {
      info.sum += +item.price
      info.highest = +item.price > info.highest ? +item.price : info.highest
      info.lowest =
        +item.price < info.lowest || info.lowest === 0
          ? +item.price
          : info.lowest
      return info
    },
    { sum: 0, highest: 0, lowest: 0 }
  )

  listingInfo.average =
    listings.length > 0 ? Math.floor(listingInfo.sum / listings.length) : 0

  const parsedListings = (
    <div className={Styles["listings"]}>
      {sortedListings.map((item) => (
        <div key={item.itemId} className={Styles.itemContainer}>
          <div
            className={Styles.removeButton}
            onClick={() => handleRemoveItem(item.itemId)}
          >
            X
          </div>
          <div className={Styles.imageContainer}>
            <img src={item.galleryURL} alt="Item Image" />
          </div>
          <div className={Styles.detailsContainer}>
            <h4>{item.title}</h4>
            <h5 style={{ color: "#26303f" }}>${item.price}</h5>
            <p>{item.location}</p>
            <p>Shipping: {item.shippingType}</p>
            <p>{item.listedOn}</p>
          </div>
          <div className="spacer"></div>
          <a href={item.viewItemURL} target="_blank" rel="noopener noreferrer">
            View Item
          </a>
        </div>
      ))}
    </div>
  )

  let content = (
    <div className={Styles.wrapper}>
      <h1>Part Hunter</h1>
      <div className={Styles.searchContainer}>
        <input
          onChange={(e) => changeSearchTerm(e.target.value)}
          type="text"
          value={searchTerm}
          placeholder={"Search eBay"}
        />
        <button onClick={handleSearch}>Search</button>
        <select value={sortOption} onChange={handleSortChange}>
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
          <option value="highest">Highest Price</option>
          <option value="lowest">Lowest Price</option>
        </select>
      </div>
      <div className={Styles["listingInfo"]}>
        <p>{`Average: $${listingInfo.average}`}</p>
        <p>{`Highest: $${listingInfo.highest}`}</p>
        <p>{`Lowest: $${listingInfo.lowest}`}</p>
        <p>{`Quantity: ${listings.length}`}</p>
      </div>
      <div className={Styles["searchList"]}>{parsedListings}</div>
    </div>
  )

  return content
}

export default PartHunter
