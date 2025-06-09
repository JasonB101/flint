/**
 * WebSocket Progress Emitter for eBay Sync
 * Provides real-time progress updates to connected clients
 */

class SocketProgressEmitter {
  constructor(io, userId) {
    this.io = io
    this.userId = userId.toString()
    this.startTime = Date.now()
  }

  /**
   * Emit progress update to user's room
   */
  emit(step, progress, detail = null, error = null) {
    const data = {
      active: true,
      step,
      progress,
      detail,
      error,
      startTime: this.startTime,
      timestamp: new Date().toISOString(),
      userId: this.userId
    }

    // Emit to user's specific room
    this.io.to(this.userId).emit('sync-progress', data)
    
    // Also emit broadcast as fallback
    this.io.emit('sync-progress-broadcast', data)
  }

  /**
   * Emit completion event
   */
  complete(success = true, error = null, data = null) {
    const completionData = {
      active: false,
      completed: true,
      success,
      error,
      data,
      startTime: this.startTime,
      duration: Date.now() - this.startTime,
      timestamp: new Date().toISOString(),
      userId: this.userId
    }

    // Emit to user's specific room
    this.io.to(this.userId).emit('sync-progress', completionData)
    
    // Also emit broadcast as fallback
    this.io.emit('sync-progress-broadcast', completionData)
  }

  /**
   * Quick helper methods for common steps
   */
  starting() {
    this.emit('starting', 0, 'Initializing eBay sync...')
  }

  fetchingShipping(count = null) {
    this.emit('fetching shipping', 15, count ? `Retrieved ${count} transactions` : 'Fetching shipping data...')
  }

  fetchingEbayData() {
    this.emit('fetching eBay data', 30, 'Getting sales and listings...')
  }

  fetchingSales(count = null) {
    this.emit('fetching eBay data', 40, count ? `Retrieved ${count} completed sales` : 'Fetching completed sales...')
  }

  fetchingListings(current = null, total = null) {
    let detail = 'Fetching active listings...'
    if (current && total) {
      detail = `Page ${current}/${total}, retrieving listings...`
    }
    this.emit('fetching eBay data', 50, detail)
  }

  processingInventory(count = null) {
    this.emit('processing inventory', 70, count ? `Updating ${count} sold items...` : 'Processing inventory updates...')
  }

  verifyingData() {
    this.emit('verifying data', 85, 'Verifying inventory information...')
  }

  finalizing() {
    this.emit('finalizing', 95, 'Finalizing sync process...')
  }
}

module.exports = SocketProgressEmitter 