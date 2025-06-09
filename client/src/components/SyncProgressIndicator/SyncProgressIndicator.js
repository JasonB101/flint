import React, { useState, useEffect } from 'react'
import { SYNC_STEP_DESCRIPTIONS, SYNC_STEP_ICONS } from '../../utils/syncProgressTracker'
import Styles from './SyncProgressIndicator.module.scss'

/**
 * Reusable eBay Sync Progress Indicator
 * 
 * Usage:
 * <SyncProgressIndicator onComplete={(result) => handleSyncComplete(result)} />
 */
const SyncProgressIndicator = ({ onComplete, onError }) => {
  const [syncStatus, setSyncStatus] = useState({ active: false })

  useEffect(() => {
    // Listen for sync progress events from the Store
    const handleSyncProgress = (event) => {
      const status = event.detail
      
      setSyncStatus(prevStatus => {
        // If sync is completing, keep component active to show completion state
        if ((!status.active || status.completed) && prevStatus.active && !prevStatus.completed) {
          // Notify parent component
          if (status.error) {
            onError?.(status.error)
          } else {
            onComplete?.(status)
          }
          
                  // Keep component visible but mark as completed
        const completionStatus = {
          ...status,
          active: true,  // Keep active to show completion state
          completed: true,
          progress: 100  // Ensure completion shows 100%
        }
          
          // Auto-hide after 3 seconds
          setTimeout(() => {
            setSyncStatus({ active: false, completed: false })
          }, 3000)
          
          return completionStatus
        }
        
        return status
      })
    }

    // Add event listener
    window.addEventListener('ebay-sync-progress', handleSyncProgress)

    // Cleanup on unmount
    return () => {
      window.removeEventListener('ebay-sync-progress', handleSyncProgress)
    }
  }, [onComplete, onError])

  // Don't render anything if sync is not active
  if (!syncStatus.active) {
    return null
  }

  const stepDescription = SYNC_STEP_DESCRIPTIONS[syncStatus.step] || syncStatus.step || 'Processing...'
  const progress = syncStatus.progress || 0

  return (
    <div className={Styles.syncProgress}>
      <div className={Styles.header}>
        <div className={Styles.icon}>⏳</div>
        <div className={Styles.title}>
          {syncStatus.completed ? 'eBay Sync Complete!' : 'Syncing with eBay...'}
        </div>
      </div>

      <div className={Styles.progressContainer}>
        <div className={Styles.progressBar}>
          <div 
            className={Styles.progressFill}
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className={Styles.progressText}>
          {progress}%
        </div>
      </div>

      <div className={Styles.stepDescription}>
        {syncStatus.detail || stepDescription}
      </div>
    </div>
  )
}

export default SyncProgressIndicator 