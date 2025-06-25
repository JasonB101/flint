const mongoose = require('mongoose')
const connectDB = require('../config/db')
const User = require('../models/user')
const { getEbayListings } = require('./ebayMethods/ebayApi')
const { smartProcessReturns, determineReturnProcessing, getUnprocessedReturns } = require('./returnService')

/**
 * Return Processor
 * Uses eBay return status and shipping cost data to intelligently determine
 * whether returns should be processed as waste or re-listed items
 */
class ReturnProcessor {
  constructor() {
    this.user = null
    this.activeListings = []
  }

  async initialize(userId) {
    console.log('🔧 Initializing Return Processor...')
    
    // Connect to MongoDB
    connectDB()
    await new Promise(resolve => setTimeout(resolve, 1000)) // Wait for connection
    console.log('✅ Connected to MongoDB')

    // Get user data
    this.user = await User.findById(userId)
    if (!this.user) {
      throw new Error(`User not found: ${userId}`)
    }
    console.log(`👤 User: ${this.user.email}`)

    // Fetch active eBay listings
    console.log('📡 Fetching active eBay listings...')
    try {
      const listings = await getEbayListings(this.user.ebayToken)
      this.activeListings = listings || []
      console.log(`📋 Found ${this.activeListings.length} active listings`)
    } catch (error) {
      console.warn('⚠️ Could not fetch active listings:', error.message)
      this.activeListings = []
    }
  }

  /**
   * Analyze all unprocessed returns and show recommendations
   */
  async analyzeReturns() {
    console.log('\n🔍 Analyzing unprocessed returns...')
    
    const unprocessedReturns = await getUnprocessedReturns(this.user._id)
    console.log(`📦 Found ${unprocessedReturns.length} unprocessed returns`)
    
    if (unprocessedReturns.length === 0) {
      console.log('🎉 No unprocessed returns found!')
      return
    }

    console.log('\n📊 Return Analysis:')
    console.log('===================')

    const summary = { RELIST: 0, WASTE: 0, MANUAL_REVIEW: 0 }

    for (const returnItem of unprocessedReturns) {
      const recommendation = determineReturnProcessing(returnItem, this.activeListings)
      summary[recommendation.action]++

      console.log(`\n📋 ${returnItem.ebayReturnId} | ${returnItem.sku || 'No SKU'} | ${returnItem.returnStatus || 'No Status'}`)
      console.log(`   💡 Recommendation: ${recommendation.action} (${recommendation.confidence}% confidence)`)
      console.log(`   💰 Refund: $${returnItem.refundAmount || 0} | Shipping: $${returnItem.returnShippingCost || 0}`)
      console.log(`   📝 Reasoning: ${recommendation.reasoning.join(', ')}`)
      
      if (recommendation.autoProcessable) {
        console.log(`   🤖 Auto-processable: YES`)
      } else {
        console.log(`   👤 Manual review required`)
      }
    }

    console.log('\n📈 Summary:')
    console.log(`   🔄 Recommended for re-list: ${summary.RELIST}`)
    console.log(`   🗑️  Recommended for waste: ${summary.WASTE}`)
    console.log(`   👤 Requires manual review: ${summary.MANUAL_REVIEW}`)
  }

  /**
   * Process returns with smart logic
   */
  async processReturns(options = {}) {
    const {
      dryRun = false,
      minConfidence = 80,
      autoProcessWaste = true,
      autoProcessRelist = true
    } = options

    console.log('\n🤖 Starting return processing...')
    console.log(`📋 Mode: ${dryRun ? 'DRY RUN' : 'LIVE PROCESSING'}`)
    console.log(`🎯 Min confidence: ${minConfidence}%`)
    console.log(`🔄 Auto-process re-lists: ${autoProcessRelist ? 'YES' : 'NO'}`)
    console.log(`🗑️ Auto-process waste: ${autoProcessWaste ? 'YES' : 'NO'}`)

    const results = await smartProcessReturns(this.user._id, this.activeListings, {
      dryRun,
      minConfidence,
      autoProcessWaste,
      autoProcessRelist
    })

    console.log('\n✅ Processing complete!')
    return results
  }

  /**
   * Show return processing statistics
   */
  async showStats() {
    const unprocessedReturns = await getUnprocessedReturns(this.user._id)
    
    console.log('\n📊 Return Processing Statistics:')
    console.log('================================')
    console.log(`Total unprocessed returns: ${unprocessedReturns.length}`)
    
    const statusCounts = {}
    const shippingCostDistribution = { withCost: 0, withoutCost: 0 }
    
    for (const returnItem of unprocessedReturns) {
      // Count by status
      const status = returnItem.returnStatus || 'UNKNOWN'
      statusCounts[status] = (statusCounts[status] || 0) + 1
      
      // Count shipping cost distribution
      if (returnItem.returnShippingCost && returnItem.returnShippingCost > 0) {
        shippingCostDistribution.withCost++
      } else {
        shippingCostDistribution.withoutCost++
      }
    }
    
    console.log('\nBy Return Status:')
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`   ${status}: ${count}`)
    })
    
    console.log('\nShipping Cost Analysis:')
    console.log(`   With return shipping cost: ${shippingCostDistribution.withCost}`)
    console.log(`   Without return shipping cost: ${shippingCostDistribution.withoutCost}`)
    
    if (statusCounts.CLOSED) {
      const closedWithoutShipping = unprocessedReturns.filter(r => 
        r.returnStatus === 'CLOSED' && (!r.returnShippingCost || r.returnShippingCost === 0)
      ).length
      
      console.log(`\n🎯 Key Insight: ${closedWithoutShipping} CLOSED returns have no shipping cost`)
      console.log(`   These are likely waste items (buyer refunded but kept item)`)
    }
  }

  async close() {
    await mongoose.connection.close()
    console.log('🔌 Database connection closed')
  }
}

// Command line interface
async function main() {
  const args = process.argv.slice(2)
  const command = args[0]
  const userId = args[1]

  if (!userId) {
    console.error('❌ Usage: node lib/returnProcessor.js <command> <userId>')
    console.error('Commands:')
    console.error('  analyze <userId>           - Analyze returns and show recommendations')
    console.error('  stats <userId>             - Show return processing statistics')  
    console.error('  process <userId> [options] - Process returns with smart logic')
    console.error('')
    console.error('Process options:')
    console.error('  --dry-run                  - Show what would be processed without making changes')
    console.error('  --confidence=80            - Minimum confidence level (default: 80)')
    console.error('  --no-waste                 - Disable auto-processing of waste items')
    console.error('  --no-relist                - Disable auto-processing of re-list items')
    console.error('')
    console.error('Examples:')
    console.error('  node lib/returnProcessor.js analyze 507f1f77bcf86cd799439011')
    console.error('  node lib/returnProcessor.js process 507f1f77bcf86cd799439011 --dry-run')
    console.error('  node lib/returnProcessor.js process 507f1f77bcf86cd799439011 --confidence=90 --no-waste')
    process.exit(1)
  }

  const processor = new ReturnProcessor()

  try {
    await processor.initialize(userId)

    switch (command) {
      case 'analyze':
        await processor.analyzeReturns()
        break

      case 'stats':
        await processor.showStats()
        break

      case 'process':
        const options = {
          dryRun: args.includes('--dry-run'),
          autoProcessWaste: !args.includes('--no-waste'),
          autoProcessRelist: !args.includes('--no-relist')
        }

        // Parse confidence level
        const confidenceArg = args.find(arg => arg.startsWith('--confidence='))
        if (confidenceArg) {
          options.minConfidence = parseInt(confidenceArg.split('=')[1])
        }

        await processor.processReturns(options)
        break

      default:
        console.error(`❌ Unknown command: ${command}`)
        process.exit(1)
    }

  } catch (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  } finally {
    await processor.close()
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('💥 Fatal error:', error)
    process.exit(1)
  })
}

module.exports = { ReturnProcessor } 