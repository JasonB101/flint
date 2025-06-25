import React from "react"
import Styles from "./ReturnsSummaryModal.module.scss"

const ReturnsSummaryModal = ({ returnedItems, setToggleSummaryModal }) => {
  // Calculate summary statistics
  const totalReturns = returnedItems.length
  const automaticReturns = returnedItems.filter(item => item.automaticReturn).length
  const manualReturns = totalReturns - automaticReturns
  
  const totalReturnCosts = returnedItems.reduce((sum, item) => {
    const returnCost = item.additionalCosts?.find(cost => cost.title === "returnShippingCost")?.amount || 0
    return sum + returnCost
  }, 0)
  
  const avgReturnCost = totalReturns > 0 ? totalReturnCosts / totalReturns : 0
  
  const reListedCount = returnedItems.filter(item => item.listed && item.status === "active").length
  const wasteCount = returnedItems.filter(item => item.status === "waste").length
  const completedCount = returnedItems.filter(item => item.status === "completed").length
  
  // Top returned items by cost
  const topReturnsByCost = returnedItems
    .map(item => ({
      ...item,
      returnCost: item.additionalCosts?.find(cost => cost.title === "returnShippingCost")?.amount || 0
    }))
    .sort((a, b) => b.returnCost - a.returnCost)
    .slice(0, 5)

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value)
  }

  return (
    <div className={Styles.modalOverlay} onClick={() => setToggleSummaryModal(false)}>
      <div className={Styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={Styles.modalHeader}>
          <h2>Returns Summary</h2>
          <button 
            className={Styles.closeButton}
            onClick={() => setToggleSummaryModal(false)}
          >
            ×
          </button>
        </div>
        
        <div className={Styles.modalContent}>
          <div className={Styles.summaryGrid}>
            <div className={Styles.statCard}>
              <h3>Total Returns</h3>
              <p className={Styles.statValue}>{totalReturns}</p>
            </div>
            
            <div className={Styles.statCard}>
              <h3>Automatic Returns</h3>
              <p className={Styles.statValue}>{automaticReturns}</p>
              <span className={Styles.percentage}>
                {totalReturns > 0 ? Math.round((automaticReturns / totalReturns) * 100) : 0}%
              </span>
            </div>
            
            <div className={Styles.statCard}>
              <h3>Manual Returns</h3>
              <p className={Styles.statValue}>{manualReturns}</p>
              <span className={Styles.percentage}>
                {totalReturns > 0 ? Math.round((manualReturns / totalReturns) * 100) : 0}%
              </span>
            </div>
            
            <div className={Styles.statCard}>
              <h3>Total Return Costs</h3>
              <p className={Styles.statValue}>{formatCurrency(totalReturnCosts)}</p>
            </div>
            
            <div className={Styles.statCard}>
              <h3>Average Return Cost</h3>
              <p className={Styles.statValue}>{formatCurrency(avgReturnCost)}</p>
            </div>
            
            <div className={Styles.statCard}>
              <h3>Successfully Re-listed</h3>
              <p className={Styles.statValue}>{reListedCount}</p>
              <span className={Styles.percentage}>
                {totalReturns > 0 ? Math.round((reListedCount / totalReturns) * 100) : 0}%
              </span>
            </div>
          </div>
          
          {topReturnsByCost.length > 0 && (
            <div className={Styles.topReturns}>
              <h3>Top Returns by Cost</h3>
              <div className={Styles.returnsList}>
                {topReturnsByCost.map((item, index) => (
                  <div key={item._id} className={Styles.returnItem}>
                    <span className={Styles.rank}>#{index + 1}</span>
                    <span className={Styles.sku}>SKU: {item.sku}</span>
                    <span className={Styles.title}>{item.title?.slice(0, 50)}...</span>
                    <span className={Styles.cost}>{formatCurrency(item.returnCost)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ReturnsSummaryModal 