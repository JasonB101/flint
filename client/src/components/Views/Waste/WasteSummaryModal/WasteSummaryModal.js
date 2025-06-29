import React from "react"
import Styles from "./WasteSummaryModal.module.scss"

const WasteSummaryModal = ({ wasteItems, setToggleSummaryModal }) => {
  const closeModal = () => {
    setToggleSummaryModal(false)
  }

  // Calculate summary statistics
  const calculateSummary = () => {
    const totalItems = wasteItems.length
    const totalLoss = wasteItems.reduce((sum, item) => {
      return sum + Math.abs(item.profit || item.purchasePrice || 0)
    }, 0)
    const totalCost = wasteItems.reduce((sum, item) => sum + (item.purchasePrice || 0), 0)
    const totalAdditionalCosts = wasteItems.reduce((sum, item) => {
      const itemAdditionalCosts = Array.isArray(item.additionalCosts) 
        ? item.additionalCosts.reduce((costSum, cost) => costSum + (cost.amount || 0), 0)
        : (item.additionalCosts || 0)
      return sum + itemAdditionalCosts
    }, 0)
    
    // Categorize by reason
    const reasons = {
      returns: wasteItems.filter(item => item.returnDate || item.lastReturnedOrder).length,
      cancellations: wasteItems.filter(item => item.ebayCancelReason).length,
      automatic: wasteItems.filter(item => item.automaticReturn).length,
      manual: wasteItems.filter(item => 
        !item.returnDate && !item.lastReturnedOrder && !item.ebayCancelReason && !item.automaticReturn
      ).length
    }

    return {
      totalItems,
      totalLoss,
      totalCost,
      totalAdditionalCosts,
      avgLoss: totalItems > 0 ? totalLoss / totalItems : 0,
      avgCost: totalItems > 0 ? totalCost / totalItems : 0,
      reasons
    }
  }

  const summary = calculateSummary()

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value)
  }

  return (
    <div className={Styles.modalOverlay} onClick={closeModal}>
      <div className={Styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={Styles.header}>
          <h2>Waste Items Summary</h2>
          <button className={Styles.closeButton} onClick={closeModal}>
            ×
          </button>
        </div>
        
        <div className={Styles.summaryGrid}>
          <div className={Styles.summaryCard}>
            <div className={Styles.cardHeader}>
              <h3>📊 Overview</h3>
            </div>
            <div className={Styles.cardContent}>
              <div className={Styles.stat}>
                <span className={Styles.label}>Total Items Wasted:</span>
                <span className={Styles.value}>{summary.totalItems.toLocaleString()}</span>
              </div>
              <div className={Styles.stat}>
                <span className={Styles.label}>Total Loss:</span>
                <span className={`${Styles.value} ${Styles.loss}`}>{formatCurrency(summary.totalLoss)}</span>
              </div>
              <div className={Styles.stat}>
                <span className={Styles.label}>Average Loss:</span>
                <span className={`${Styles.value} ${Styles.loss}`}>{formatCurrency(summary.avgLoss)}</span>
              </div>
            </div>
          </div>

          <div className={Styles.summaryCard}>
            <div className={Styles.cardHeader}>
              <h3>💰 Cost Breakdown</h3>
            </div>
            <div className={Styles.cardContent}>
              <div className={Styles.stat}>
                <span className={Styles.label}>Total Purchase Cost:</span>
                <span className={Styles.value}>{formatCurrency(summary.totalCost)}</span>
              </div>
              <div className={Styles.stat}>
                <span className={Styles.label}>Additional Costs:</span>
                <span className={Styles.value}>{formatCurrency(summary.totalAdditionalCosts)}</span>
              </div>
              <div className={Styles.stat}>
                <span className={Styles.label}>Average Purchase Cost:</span>
                <span className={Styles.value}>{formatCurrency(summary.avgCost)}</span>
              </div>
            </div>
          </div>

          <div className={Styles.summaryCard}>
            <div className={Styles.cardHeader}>
              <h3>🔍 Waste Reasons</h3>
            </div>
            <div className={Styles.cardContent}>
              <div className={Styles.stat}>
                <span className={Styles.label}>Returns/Refunds:</span>
                <span className={Styles.value}>{summary.reasons.returns}</span>
              </div>
              <div className={Styles.stat}>
                <span className={Styles.label}>Cancellations:</span>
                <span className={Styles.value}>{summary.reasons.cancellations}</span>
              </div>
              <div className={Styles.stat}>
                <span className={Styles.label}>Automatic:</span>
                <span className={Styles.value}>{summary.reasons.automatic}</span>
              </div>
              <div className={Styles.stat}>
                <span className={Styles.label}>Manual:</span>
                <span className={Styles.value}>{summary.reasons.manual}</span>
              </div>
            </div>
          </div>
        </div>

        <div className={Styles.footer}>
          <button className={Styles.actionButton} onClick={closeModal}>
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

export default WasteSummaryModal 