const mongoose = require('mongoose')
const connectDB = require('./config/db')

// Import models
const InventoryItem = require('./models/inventoryItem')
const Return = require('./models/return')

/**
 * Migration script to backfill inventory items with return data
 * Only processes items that have corresponding return records (processed items)
 * Leaves unprocessed items (no return records) untouched
 * 
 * IMPORTANT: This script will ONLY add 'returnShippingCost' entries to additionalCosts
 * It will NOT touch refunds or any other existing additionalCosts entries
 */

async function migrateInventoryFromReturns(options = {}) {
  const {
    dryRun = true,
    userId = null,
    batchSize = 100,
    verbose = false
  } = options

  try {
         console.log('🔄 Starting inventory migration from returns database...')
     console.log('⚠️  IMPORTANT: This script will ONLY add returnShippingCost to additionalCosts - it will NOT touch refunds!')
     console.log(`📋 Options: dryRun=${dryRun}, userId=${userId || 'ALL'}, batchSize=${batchSize}`)
    
    // Build query filter
    const returnFilter = userId ? { userId } : {}
    
    // Get all returns with populated inventory items
    console.log('📦 Fetching returns with inventory items...')
    const returns = await Return.find(returnFilter)
      .populate('inventoryItemId')
      .lean()
    
    console.log(`📊 Found ${returns.length} returns to process`)
    
    const stats = {
      totalReturns: returns.length,
      itemsProcessed: 0,
      itemsSkipped: 0,
      itemsUpdated: 0,
      errors: 0,
      details: []
    }
    
    // Group returns by inventory item ID to handle multiple returns per item
    const returnsByItem = {}
    for (const returnRecord of returns) {
      if (!returnRecord.inventoryItemId) {
        if (verbose) console.log(`⚠️ Skipping return ${returnRecord.ebayReturnId} - no linked inventory item`)
        stats.itemsSkipped++
        continue
      }
      
      const itemId = returnRecord.inventoryItemId._id || returnRecord.inventoryItemId
      if (!returnsByItem[itemId]) {
        returnsByItem[itemId] = []
      }
      returnsByItem[itemId].push(returnRecord)
    }
    
    console.log(`📋 Processing ${Object.keys(returnsByItem).length} unique inventory items...`)
    
    // Process each inventory item
    let processedCount = 0
    for (const [itemId, itemReturns] of Object.entries(returnsByItem)) {
      try {
        // Get the inventory item (use the populated one from first return)
        const inventoryItem = itemReturns[0].inventoryItemId._id ? 
          itemReturns[0].inventoryItemId : 
          await InventoryItem.findById(itemId)
        
        if (!inventoryItem) {
          console.log(`❌ Could not find inventory item ${itemId}`)
          stats.errors++
          continue
        }
        
        // Analyze what fields need to be updated
        const analysis = analyzeInventoryItem(inventoryItem, itemReturns)
        
                 if (verbose || !dryRun) {
           console.log(`\n📦 Item: ${inventoryItem.sku || inventoryItem._id} (${itemReturns.length} returns)`)
           console.log(`   Current status: ${inventoryItem.status}`)
           console.log(`   Missing fields: ${analysis.missingFields.join(', ') || 'none'}`)
           console.log(`   Updates needed: ${analysis.needsUpdate ? 'YES' : 'NO'}`)
           
           // Show additionalCosts details if being updated
           if (analysis.updates.additionalCosts) {
             const currentCount = (inventoryItem.additionalCosts || []).length
             const newCount = analysis.updates.additionalCosts.length
             console.log(`   additionalCosts: ${currentCount} -> ${newCount} items (adding returnShippingCost ONLY)`)
           }
         }
        
        stats.itemsProcessed++
        
        if (analysis.needsUpdate) {
          if (!dryRun) {
            // Apply the updates
            await InventoryItem.findByIdAndUpdate(itemId, analysis.updates)
            console.log(`   ✅ Updated inventory item`)
          } else {
            console.log(`   🔍 Would update: ${Object.keys(analysis.updates).join(', ')}`)
          }
          stats.itemsUpdated++
        } else {
          stats.itemsSkipped++
          if (verbose) {
            console.log(`   ⏭️ Skipped - no updates needed`)
          }
        }
        
        stats.details.push({
          itemId: inventoryItem._id,
          sku: inventoryItem.sku,
          returnCount: itemReturns.length,
          missingFields: analysis.missingFields,
          needsUpdate: analysis.needsUpdate,
          updatedFields: analysis.needsUpdate ? Object.keys(analysis.updates) : []
        })
        
        processedCount++
        
        // Progress indicator
        if (processedCount % batchSize === 0) {
          console.log(`   Progress: ${processedCount}/${Object.keys(returnsByItem).length} items processed`)
        }
        
      } catch (error) {
        console.error(`❌ Error processing item ${itemId}:`, error.message)
        stats.errors++
      }
    }
    
    // Final statistics
    console.log('\n📊 Migration Results:')
    console.log(`   Total returns: ${stats.totalReturns}`)
    console.log(`   Items processed: ${stats.itemsProcessed}`)
    console.log(`   Items updated: ${stats.itemsUpdated}`)
    console.log(`   Items skipped: ${stats.itemsSkipped}`)
    console.log(`   Errors: ${stats.errors}`)
    
    if (dryRun) {
      console.log('\n🔍 This was a DRY RUN - no changes were made')
      console.log('Run with --apply to make actual changes')
    }
    
    return stats
    
  } catch (error) {
    console.error('❌ Migration failed:', error)
    throw error
  }
}

/**
 * Analyze an inventory item to determine what fields need to be updated
 * @param {Object} inventoryItem - Inventory item document
 * @param {Array} itemReturns - Array of return records for this item
 * @returns {Object} Analysis results with updates needed
 */
function analyzeInventoryItem(inventoryItem, itemReturns) {
  const analysis = {
    needsUpdate: false,
    missingFields: [],
    updates: {},
    returnData: {
      totalReturns: itemReturns.length,
      hasActiveReturn: false,
      latestReturn: null,
      totalRefundAmount: 0,
      totalReturnShippingCost: 0
    }
  }
  
  // Calculate return statistics
  for (const returnRecord of itemReturns) {
    analysis.returnData.totalRefundAmount += (returnRecord.refundAmount || 0)
    analysis.returnData.totalReturnShippingCost += (returnRecord.returnShippingCost || 0)
    
    // Check for active returns
    if (['OPEN', 'RETURN_REQUESTED', 'ITEM_READY_TO_SHIP', 'ITEM_SHIPPED'].includes(returnRecord.returnStatus)) {
      analysis.returnData.hasActiveReturn = true
    }
    
    // Find latest return
    if (!analysis.returnData.latestReturn || new Date(returnRecord.creationDate) > new Date(analysis.returnData.latestReturn.creationDate)) {
      analysis.returnData.latestReturn = returnRecord
    }
  }
  
  // Check field 1: returnCount
  if (!inventoryItem.returnCount || inventoryItem.returnCount !== itemReturns.length) {
    analysis.missingFields.push('returnCount')
    analysis.updates.returnCount = itemReturns.length
    analysis.needsUpdate = true
  }
  
  // Check field 2: hasActiveReturn
  if (inventoryItem.hasActiveReturn !== analysis.returnData.hasActiveReturn) {
    analysis.missingFields.push('hasActiveReturn')
    analysis.updates.hasActiveReturn = analysis.returnData.hasActiveReturn
    analysis.needsUpdate = true
  }
  
  // Check field 3: returnDate (from latest return)
  if (analysis.returnData.latestReturn && !inventoryItem.returnDate) {
    analysis.missingFields.push('returnDate')
    analysis.updates.returnDate = new Date(analysis.returnData.latestReturn.creationDate).toISOString().split('T')[0]
    analysis.needsUpdate = true
  }
  
  // Check field 4: lastReturnedOrder (from latest return)
  if (analysis.returnData.latestReturn && analysis.returnData.latestReturn.orderId && !inventoryItem.lastReturnedOrder) {
    analysis.missingFields.push('lastReturnedOrder')
    analysis.updates.lastReturnedOrder = analysis.returnData.latestReturn.orderId
    analysis.needsUpdate = true
  }
  
  // Check field 5: automaticReturn flag
  if (inventoryItem.automaticReturn === undefined) {
    analysis.missingFields.push('automaticReturn')
    // Set based on whether returns exist - if they have returns, they've been processed
    analysis.updates.automaticReturn = true
    analysis.needsUpdate = true
  }
  
  // Check field 6: ONLY returnShippingCost in additionalCosts (DO NOT TOUCH REFUNDS)
  const currentAdditionalCosts = inventoryItem.additionalCosts || []
  const hasReturnShippingCost = currentAdditionalCosts.some(cost => cost.title === 'returnShippingCost')
  
  // ONLY add return shipping cost if missing and we have data - DO NOT TOUCH REFUNDS
  if (!hasReturnShippingCost && analysis.returnData.totalReturnShippingCost > 0) {
    const newAdditionalCosts = [...currentAdditionalCosts]
    newAdditionalCosts.push({
      title: 'returnShippingCost',
      amount: analysis.returnData.totalReturnShippingCost,
      date: analysis.returnData.latestReturn ? new Date(analysis.returnData.latestReturn.creationDate) : new Date()
    })
    analysis.updates.additionalCosts = newAdditionalCosts
    analysis.missingFields.push('returnShippingCost in additionalCosts')
    analysis.needsUpdate = true
  }
  
  return analysis
}

// CLI execution
async function main() {
  const args = process.argv.slice(2)
  const options = {
    dryRun: !args.includes('--apply'),
    verbose: args.includes('--verbose'),
    userId: null,
    batchSize: 100
  }
  
  // Parse userId if provided
  const userIdArg = args.find(arg => arg.startsWith('--userId='))
  if (userIdArg) {
    options.userId = userIdArg.split('=')[1]
  }
  
  // Parse batch size if provided
  const batchSizeArg = args.find(arg => arg.startsWith('--batchSize='))
  if (batchSizeArg) {
    options.batchSize = parseInt(batchSizeArg.split('=')[1])
  }
  
  try {
    // Connect to MongoDB
    connectDB()
    // Give connection a moment to establish
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Run migration
    const stats = await migrateInventoryFromReturns(options)
    
    // Optionally save results to file
    if (args.includes('--save-report')) {
      const fs = require('fs')
      const reportPath = `migration-report-${new Date().toISOString().split('T')[0]}.json`
      fs.writeFileSync(reportPath, JSON.stringify(stats, null, 2))
      console.log(`📝 Report saved to ${reportPath}`)
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  } finally {
    await mongoose.disconnect()
    console.log('👋 Disconnected from MongoDB')
  }
}

// Export for use as module or run directly
if (require.main === module) {
  main()
}

module.exports = { migrateInventoryFromReturns, analyzeInventoryItem } 