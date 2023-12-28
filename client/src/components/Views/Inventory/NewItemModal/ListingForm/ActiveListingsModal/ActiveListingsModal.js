import React from 'react'
import Styles from './ActiveListingsModal.module.scss' // Import your SCSS file for styling

const ActiveListingsModal = ({ activeListings, closeActiveListingsModal }) => {
  if (activeListings.length > 0) {
    activeListings.sort((a, b) => dateToTime(b.listedOn) - dateToTime(a.listedOn))
  }
  const listingInfo = activeListings.reduce((info, item) => {
      info.sum += +item.price
      info.highest = +item.price > info.highest ? +item.price : info.highest
      info.lowest = +item.price < info.lowest || info.lowest === 0 ? +item.price : info.lowest
      return info
  }, {sum: 0, highest: 0, lowest: 0})

  listingInfo.average = activeListings.length > 0 ? Math.floor(listingInfo.sum / activeListings.length) : 0

  return (
    <div className={Styles.modal}>
      <div className={Styles.modalContent}>
        <div className={Styles.modalHeader}>
          <div className='spacer'></div>
          <span className={Styles.closeModal} onClick={closeActiveListingsModal}>
            &times;
          </span>
          
        </div>
        <div className={Styles['listingInfo']}>
            <p>{`Average: $${listingInfo.average}`}</p>
            <p>{`Highest: $${listingInfo.highest}`}</p>
            <p>{`Lowest: $${listingInfo.lowest}`}</p>
            <p>{`Quantity: ${activeListings.length}`}</p>
          </div>
        <div className={Styles.modalBody}>
          {activeListings.map((item) => (
            <div key={item.itemId} className={Styles.itemContainer}>
              <div className={Styles.imageContainer}>
                <img src={item.galleryURL} alt="Item Image" />
              </div>
              <div className={Styles.detailsContainer}>
                <p>{item.title}</p>
                <p>${item.price}</p>
                <p>{item.location}</p>
                <p>Shipping: {item.shippingType}</p>
                <p>{item.listedOn}</p>
                {/* Add more information as needed */}
                <a
                  href={item.viewItemURL}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View Item
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function dateToTime(value) {
  return String(new Date(value).getTime())
}
export default ActiveListingsModal