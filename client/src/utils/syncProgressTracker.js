/**
 * eBay Sync Progress Tracker
 * 
 * Usage:
 * import { syncProgressTracker } from './utils/syncProgressTracker'
 * 
 * // Start monitoring sync progress
 * const unsubscribe = syncProgressTracker.subscribe((status) => {
 *   console.log('Sync status:', status)
 *   if (status.active) {
 *     updateProgressBar(status.progress)
 *     showStep(status.step)
 *   } else {
 *     hideProgressBar()
 *   }
 * })
 * 
 * // Stop monitoring
 * unsubscribe()
 */

class SyncProgressTracker {
  constructor() {
    this.subscribers = []
    this.pollInterval = null
    this.isPolling = false
  }

  // Subscribe to sync progress updates
  subscribe(callback) {
    this.subscribers.push(callback)
    
    // Start polling if this is the first subscriber
    if (this.subscribers.length === 1) {
      this.startPolling()
    }

    // Return unsubscribe function
    return () => {
      this.subscribers = this.subscribers.filter(sub => sub !== callback)
      
      // Stop polling if no more subscribers
      if (this.subscribers.length === 0) {
        this.stopPolling()
      }
    }
  }

  // Start polling the sync status endpoint
  startPolling() {
    if (this.isPolling) return

    this.isPolling = true
    this.pollInterval = setInterval(async () => {
      try {
        const response = await fetch('/api/ebay/sync-status', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}` // Adjust based on your auth
          }
        })

        if (response.ok) {
          const status = await response.json()
          this.notifySubscribers(status)
          
          // If sync completed, do one final poll after a short delay
          if (status.active === false && this.wasActive) {
            setTimeout(() => this.checkForCompletion(), 1000)
          }
          
          this.wasActive = status.active
        }
      } catch (error) {
        console.error('Failed to check sync status:', error)
        this.notifySubscribers({ 
          active: false, 
          error: 'Failed to check sync status' 
        })
      }
    }, 2000) // Poll every 2 seconds
  }

  // Stop polling
  stopPolling() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval)
      this.pollInterval = null
    }
    this.isPolling = false
  }

  // Notify all subscribers of status change
  notifySubscribers(status) {
    this.subscribers.forEach(callback => {
      try {
        callback(status)
      } catch (error) {
        console.error('Error in sync progress callback:', error)
      }
    })
  }

  // Check if sync completed
  async checkForCompletion() {
    try {
      const response = await fetch('/api/ebay/sync-status', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      if (response.ok) {
        const status = await response.json()
        this.notifySubscribers(status)
      }
    } catch (error) {
      console.error('Failed final sync check:', error)
    }
  }

  // Manually trigger a sync check (useful for testing)
  async checkNow() {
    try {
      const response = await fetch('/api/ebay/sync-status', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      if (response.ok) {
        const status = await response.json()
        this.notifySubscribers(status)
        return status
      }
    } catch (error) {
      console.error('Failed to check sync status:', error)
      return { active: false, error: error.message }
    }
  }
}

// Create singleton instance
export const syncProgressTracker = new SyncProgressTracker()

// Helper function to start eBay sync and automatically track progress
export async function startEbaySyncWithProgress(onProgress) {
  try {
    // Subscribe to progress updates
    const unsubscribe = syncProgressTracker.subscribe(onProgress)
    
    // Start the sync
    const response = await fetch('/api/ebay/getebay', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    })

    if (response.ok) {
      const result = await response.json()
      
      // Unsubscribe after a delay to catch final status
      setTimeout(unsubscribe, 5000)
      
      return result
    } else {
      unsubscribe()
      throw new Error(`Sync failed: ${response.statusText}`)
    }
  } catch (error) {
    console.error('eBay sync error:', error)
    throw error
  }
}

// Progress step descriptions for better UX
export const SYNC_STEP_DESCRIPTIONS = {
  'starting': 'Initializing sync...',
  'fetching shipping': 'Getting shipping data...',
  'fetching eBay data': 'Downloading eBay listings...',
  'processing inventory': 'Processing sales data...',
  'verifying data': 'Verifying information...',
  'finalizing': 'Finalizing sync...'
}

// Progress step icons (you can customize these)
export const SYNC_STEP_ICONS = {
  'starting': '🚀',
  'fetching shipping': '📦',
  'fetching eBay data': '📊',
  'processing inventory': '⚙️',
  'verifying data': '✅',
  'finalizing': '🎉'
} 