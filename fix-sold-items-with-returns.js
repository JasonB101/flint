const mongoose = require('mongoose')
const connectDB = require('./config/db')

// Import models
const InventoryItem = require('./models/inventoryItem')
const Return = require('./models/return')

/**
 * Script to identify and fix inventory items that show as "sold" but have been returned
 * and should not appear in the sold items table
 */

async function fixSoldItemsWithReturns(options = {}) {
  const {
    dryRun = true,
    userId = null,
    verbose = false
  } = options

  try {
    console.log('🔍 Analyzing sold items with returns...')
    console.log(`📋 Options: dryRun=${dryRun}, userId=${userId || 'ALL'}`)
    
    // Build query filter
    const filter = userId ? { userId } : {}
    
    // Get all inventory items that are marked as sold
    console.log('📦 Fetching items marked as sold...')
    const soldItems = await InventoryItem.find({
      ...filter,
      sold: true
    }).lean()
    
    console.log(`📊 Found ${soldItems.length} items marked as sold`)
    
    const stats = {
      totalSoldItems: soldItems.length,
      itemsWithReturns: 0,
      incorrectlySold: 0,
      correctlySold: 0,
      needsInvestigation: 0,
      fixed: 0,
      errors: 0,
      details: []
    }
    
    // Check each sold item for returns
    for (const item of soldItems) {
      try {
        // Get returns for this item
        const returns = await Return.find({
          inventoryItemId: item._id,
          userId: item.userId
        }).lean()
        
        if (returns.length === 0) {
          // No returns - this is correctly sold
          stats.correctlySold++
          continue
        }
        
        stats.itemsWithReturns++
        
        // Analyze the return situation
        const analysis = analyzeItemWithReturns(item, returns)
        
                 if (verbose) {
           console.log(`\n📦 Item ${item.sku} (${item.status})`)
           console.log(`   Returns: ${returns.length}`)
           console.log(`   Sale Date: ${item.dateSold || 'N/A'}`)
           console.log(`   Order ID: ${item.orderId || 'N/A'}`)
           console.log(`   Buyer: ${item.buyer || 'N/A'}`)
           console.log(`   Price Sold: $${item.priceSold || 'N/A'}`)
           console.log(`   Analysis: ${analysis.recommendation}`)
           console.log(`   Reason: ${analysis.reason}`)
           
           // Show return details for context
           returns.forEach((ret, idx) => {
             console.log(`   Return ${idx + 1}: Created ${ret.creationDate}, Status ${ret.returnStatus}, Order ${ret.orderId || 'N/A'}`)
           })
         }
        
                 // Categorize the item
         if (analysis.shouldBeSold === false) {
           stats.incorrectlySold++
          
          if (!dryRun) {
            // Fix the item
            const updates = {
              sold: false,
              shipped: false
            }
            
            // Clear sale data if item is waste or returned without resale
            if (item.status === 'waste' || analysis.clearSaleData) {
              updates.priceSold = null
              updates.dateSold = null
              updates.ebayFees = null
              updates.trackingNumber = null
              updates.buyer = null
              updates.daysListed = null
              updates.orderId = null
              updates.shippingCost = null
              updates.roi = null
              updates.profit = null
            }
            
            await InventoryItem.findByIdAndUpdate(item._id, updates)
            stats.fixed++
            
            if (verbose) {
              console.log(`   ✅ Fixed - set sold=false`)
            }
          } else {
            if (verbose) {
              console.log(`   🔍 Would fix - set sold=false`)
            }
          }
        } else if (analysis.shouldBeSold === true) {
          stats.correctlySold++
        } else {
          stats.needsInvestigation++
        }
        
        stats.details.push({
          itemId: item._id,
          sku: item.sku,
          status: item.status,
          returnCount: returns.length,
          analysis: analysis,
          currentlySold: item.sold
        })
        
      } catch (error) {
        console.error(`❌ Error processing item ${item.sku}:`, error.message)
        stats.errors++
      }
    }
    
    // Final statistics
    console.log('\n📊 Analysis Results:')
    console.log(`   Total sold items: ${stats.totalSoldItems}`)
    console.log(`   Items with returns: ${stats.itemsWithReturns}`)
    console.log(`   Correctly sold: ${stats.correctlySold}`)
    console.log(`   Incorrectly marked as sold: ${stats.incorrectlySold}`)
    console.log(`   Need investigation: ${stats.needsInvestigation}`)
    console.log(`   Fixed: ${stats.fixed}`)
    console.log(`   Errors: ${stats.errors}`)
    
    if (dryRun) {
      console.log('\n🔍 This was a DRY RUN - no changes were made')
      console.log('Run with --apply to make actual changes')
    }
    
    // Show items that need investigation
    if (stats.needsInvestigation > 0) {
      console.log('\n⚠️ Items needing manual investigation:')
      const investigationItems = stats.details.filter(d => d.analysis.shouldBeSold === null)
      investigationItems.forEach(item => {
        console.log(`   ${item.sku} (${item.status}) - ${item.analysis.reason}`)
      })
    }
    
    return stats
    
  } catch (error) {
    console.error('❌ Analysis failed:', error)
    throw error
  }
}

/**
 * Analyze an item with returns to determine if it should be marked as sold
 * @param {Object} item - Inventory item
 * @param {Array} returns - Array of return records
 * @returns {Object} Analysis result
 */
function analyzeItemWithReturns(item, returns) {
  const analysis = {
    shouldBeSold: null, // true, false, or null (needs investigation)
    recommendation: '',
    reason: '',
    clearSaleData: false
  }
  
  // Sort returns by creation date (newest first)
  const sortedReturns = returns.sort((a, b) => new Date(b.creationDate) - new Date(a.creationDate))
  const latestReturn = sortedReturns[0]
  
  // Check current item status
  const status = item.status
  
  // Case 1: Item is marked as waste
  if (status === 'waste') {
    analysis.shouldBeSold = false
    analysis.recommendation = 'SHOULD_NOT_BE_SOLD'
    analysis.reason = 'Item status is waste - returned and not resaleable'
    analysis.clearSaleData = true
    return analysis
  }
  
  // Case 2: Item is active (re-listed)
  if (status === 'active') {
    // Check if this was returned and re-listed
    if (item.listed) {
      analysis.shouldBeSold = false
      analysis.recommendation = 'SHOULD_NOT_BE_SOLD'
      analysis.reason = 'Item returned and re-listed - should not show as sold'
      analysis.clearSaleData = true
    } else {
      analysis.shouldBeSold = null
      analysis.recommendation = 'INVESTIGATE'
      analysis.reason = 'Item is active but not listed - check manually'
    }
    return analysis
  }
  
  // Case 3: Item shows as completed/sold
  if (status === 'completed') {
    // Check if there's a return that happened after the sale
    const saleDate = item.dateSold ? new Date(item.dateSold) : null
    
    if (saleDate) {
      // Check if any returns happened after this sale date
      const returnsAfterSale = sortedReturns.filter(ret => {
        if (!ret.creationDate) return false
        const returnDate = new Date(ret.creationDate)
        return returnDate > saleDate
      })
      
             if (returnsAfterSale.length > 0) {
         // There was a return after the sale - check if item was resold
         const resaleAnalysis = checkForSubsequentSale(item, returnsAfterSale[0], returns)
         
         if (resaleAnalysis.isResale) {
           analysis.shouldBeSold = true
           analysis.recommendation = 'CORRECTLY_SOLD'
           analysis.reason = `Item was returned but then resold (confidence: ${resaleAnalysis.confidence}%) - ${resaleAnalysis.reasons.join(', ')}`
         } else if (resaleAnalysis.confidence < 30 || resaleAnalysis.concerns.some(c => c.includes('Same order ID'))) {
           // Conservative approach: flag for manual review if confidence is low or critical concerns exist
           analysis.shouldBeSold = null
           analysis.recommendation = 'INVESTIGATE'
           analysis.reason = `Uncertain if this is a resale (confidence: ${resaleAnalysis.confidence}%) - MANUAL REVIEW REQUIRED: ${resaleAnalysis.concerns.join(', ')}`
         } else {
           analysis.shouldBeSold = false
           analysis.recommendation = 'SHOULD_NOT_BE_SOLD'
           analysis.reason = `Item was returned and not resold (confidence: ${resaleAnalysis.confidence}%) - ${resaleAnalysis.concerns.join(', ')}`
           analysis.clearSaleData = true
         }
      } else {
        // No returns after sale date - check if return happened before sale (unusual but possible)
        analysis.shouldBeSold = true
        analysis.recommendation = 'CORRECTLY_SOLD'
        analysis.reason = 'Returns occurred before sale date - item correctly shows as sold'
      }
    } else {
      // No sale date available - this is problematic
      analysis.shouldBeSold = null
      analysis.recommendation = 'INVESTIGATE'
      analysis.reason = 'No sale date but marked as sold and has returns - manual investigation needed'
    }
    return analysis
  }
  
  // Case 4: Other statuses
  analysis.shouldBeSold = null
  analysis.recommendation = 'INVESTIGATE'
  analysis.reason = `Unusual status '${status}' with returns - manual investigation needed`
  
  return analysis
}

/**
 * Check if an item was resold after a return
 * Uses multiple indicators to determine if current sale data represents a legitimate resale
 * @param {Object} item - Inventory item
 * @param {Object} returnRecord - Return record
 * @param {Array} allReturns - All return records for this item
 * @returns {Object} Analysis of whether this is a legitimate resale
 */
function checkForSubsequentSale(item, returnRecord, allReturns = []) {
  const analysis = {
    isResale: false,
    confidence: 0,
    reasons: [],
    concerns: []
  }
  
  if (!item.dateSold || !returnRecord.creationDate) {
    analysis.concerns.push('Missing sale date or return date')
    return analysis
  }
  
  const saleDate = new Date(item.dateSold)
  const returnDate = new Date(returnRecord.creationDate)
  const daysDifference = (saleDate - returnDate) / (1000 * 60 * 60 * 24)
  
  // Check 1: Sale date timing
  if (daysDifference > 1) {
    analysis.confidence += 20
    analysis.reasons.push(`Sale date ${Math.round(daysDifference)} days after return`)
  } else if (daysDifference < -1) {
    // Sale happened before return - this is the original sale, not a resale
    analysis.concerns.push('Sale date is before return date - this is the original returned sale')
    return analysis
  } else {
    analysis.concerns.push('Sale date too close to return date - questionable timing')
  }
  
  // Check 2: Order ID comparison
  if (returnRecord.orderId && item.orderId) {
    if (returnRecord.orderId !== item.orderId) {
      analysis.confidence += 30
      analysis.reasons.push('Different order ID from returned order')
    } else {
      analysis.concerns.push('Same order ID as returned order - likely the original sale')
      analysis.confidence -= 20
    }
  }
  
  // Check 3: Buyer comparison
  if (returnRecord.buyerLoginName && item.buyer) {
    if (returnRecord.buyerLoginName !== item.buyer) {
      analysis.confidence += 25
      analysis.reasons.push('Different buyer from original return')
    } else {
      analysis.concerns.push('Same buyer as original return - could be same sale')
      analysis.confidence -= 10
    }
  }
  
     // Check 4: Skip price comparison - price level doesn't matter for logic
  
  // Check 5: Multiple returns analysis
  if (allReturns.length > 1) {
    // Sort returns by date
    const sortedReturns = allReturns.sort((a, b) => new Date(a.creationDate) - new Date(b.creationDate))
    const latestReturn = sortedReturns[sortedReturns.length - 1]
    const latestReturnDate = new Date(latestReturn.creationDate)
    
    // If sale is after the latest return, more likely to be a resale
    const daysSinceLatestReturn = (saleDate - latestReturnDate) / (1000 * 60 * 60 * 24)
    if (daysSinceLatestReturn > 1) {
      analysis.confidence += 15
      analysis.reasons.push(`Sale ${Math.round(daysSinceLatestReturn)} days after latest return`)
    } else {
      analysis.concerns.push('Sale date close to latest return')
    }
    
    // Check if any return happened AFTER this sale (big red flag)
    const returnsAfterSale = allReturns.filter(ret => {
      if (!ret.creationDate) return false
      return new Date(ret.creationDate) > saleDate
    })
    
    if (returnsAfterSale.length > 0) {
      analysis.confidence -= 40
      analysis.concerns.push(`${returnsAfterSale.length} return(s) occurred AFTER this sale date`)
    }
  }
  
  // Check 6: eBay Item ID (resales often have different eBay IDs)
  if (returnRecord.itemId && item.ebayId) {
    if (returnRecord.itemId !== item.ebayId) {
      analysis.confidence += 20
      analysis.reasons.push('Different eBay Item ID from returned listing')
    } else {
      analysis.concerns.push('Same eBay Item ID as returned listing')
      analysis.confidence -= 15
    }
  }
  
  // Final determination
  analysis.isResale = analysis.confidence >= 50 && analysis.concerns.length === 0
  
  // Override for high confidence with minor concerns
  if (analysis.confidence >= 70 && !analysis.concerns.some(c => c.includes('Same order ID'))) {
    analysis.isResale = true
  }
  
  return analysis
}

// CLI execution
async function main() {
  const args = process.argv.slice(2)
  const options = {
    dryRun: !args.includes('--apply'),
    verbose: args.includes('--verbose'),
    userId: null
  }
  
  // Parse userId if provided
  const userIdArg = args.find(arg => arg.startsWith('--userId='))
  if (userIdArg) {
    options.userId = userIdArg.split('=')[1]
  }
  
  try {
    // Connect to MongoDB
    connectDB()
    // Give connection a moment to establish
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Run analysis
    const stats = await fixSoldItemsWithReturns(options)
    
    // Optionally save results to file
    if (args.includes('--save-report')) {
      const fs = require('fs')
      const reportPath = `sold-items-analysis-${new Date().toISOString().split('T')[0]}.json`
      fs.writeFileSync(reportPath, JSON.stringify(stats, null, 2))
      console.log(`📝 Report saved to ${reportPath}`)
    }
    
  } catch (error) {
    console.error('❌ Analysis failed:', error)
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

module.exports = { fixSoldItemsWithReturns, analyzeItemWithReturns } 