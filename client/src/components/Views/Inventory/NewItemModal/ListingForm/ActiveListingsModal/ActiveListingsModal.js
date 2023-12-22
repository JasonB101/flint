import React from 'react'
import Styles from './ActiveListingsModal.module.scss' // Import your SCSS file for styling

const ActiveListingsModal = ({ activeListings, closeActiveListingsModal }) => {

  return (
    <div className={Styles.modal}>
      <div className={Styles.modalContent}>
        <div className={Styles.modalHeader}>
          <h2>eBay Listings</h2>
          <span className={Styles.closeModal} onClick={closeActiveListingsModal}>
            &times;
          </span>
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

export default ActiveListingsModal