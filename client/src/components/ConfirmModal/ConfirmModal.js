import React from 'react'
import Styles from './ConfirmModal.module.scss'

const ConfirmModal = ({ question, onResult }) => {
    // Handle Yes button click
    const handleYes = () => {
      onResult(true);
    };
  
    // Handle Cancel button click
    const handleCancel = () => {
      onResult(false);
    };
  
    return (
      <div className={Styles.confirmModalWrapper}>
        <div className={Styles.modalContent}>
          <p className={Styles.question}>{question}</p>
          
          <div className={Styles.buttonContainer}>
            <button 
              className={Styles.yesButton} 
              onMouseUp={handleYes}
            >
              Yes
            </button>
            
            <button 
              className={Styles.cancelButton} 
              onClick={handleCancel}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    )
  }

export default ConfirmModal