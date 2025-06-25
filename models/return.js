const mongoose = require("mongoose")
const { Schema } = mongoose

const returnSchema = new Schema({
  // Reference to the inventory item
  inventoryItemId: {
    type: Schema.Types.ObjectId,
    ref: "InventoryItem",
    required: true,
    index: true
  },
  
  // Basic return identification
  ebayReturnId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  
  // Return status and reason
  returnStatus: String, // CLOSED, OPEN, etc.
  returnReason: String, // DEFECTIVE_ITEM, NOT_AS_DESCRIBED, etc.
  buyerComments: String,
  sellerComments: String,
  
  // Dates
  creationDate: Date,
  lastModifiedDate: Date,
  closeDate: Date,
  
  // Order information
  orderId: String,
  itemId: String, // eBay item ID
  transactionId: String,
  sku: String,
  itemTitle: String,
  itemPrice: Number,
  itemPriceCurrency: String,
  returnQuantity: {
    type: Number,
    default: 1
  },
  originalSaleDate: Date,
  transactionDate: Date,
  
  // Return reason details
  reasonType: String, // SNAD, REMORSE, etc.
  
  // Financial information
  refundAmount: Number,
  refundCurrency: String,
  refundStatus: String, // SUCCESS, PENDING, FAILED, COMPLETED
  refundDate: Date,
  sellerRefundAmount: Number,
  returnShippingCost: Number,
  
  // Shipping and tracking
  trackingNumber: String,
  carrierUsed: String,
  trackingStatus: String, // IN_TRANSIT, DELIVERED, etc.
  shipDate: Date,
  deliveryDate: Date,
  
  // Buyer information
  buyerLoginName: String,
  buyerUserId: String,
  
  // Sync information
  lastSync: {
    type: Date,
    default: Date.now
  },
  
  // Store minimal debugging data (not full eBay response)
  rawEbayData: {
    returnId: String,
    lastApiCall: Date,
    hasDetailData: Boolean,
    hasSummaryData: Boolean,
    extractedSuccessfully: {
      buyerComments: Boolean,
      refundInfo: Boolean,
      trackingInfo: Boolean,
      shippingCost: Boolean,
      linkingData: Boolean
    }
  },
  
  // Data version for migration tracking
  dataVersion: {
    type: String,
    default: '2.3'
  },
  
  // User reference for data isolation
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true
  },
  
  // Auto-processing flag
  autoProcessed: {
    type: Boolean,
    default: false,
    index: true
  },
  
  // Optional: Status history for tracking changes
  statusHistory: [
    {
      status: String,
      date: { type: Date, default: Date.now }
    }
  ],
}, {
  timestamps: true
})

// Compound index for efficient queries
returnSchema.index({ userId: 1, inventoryItemId: 1 })
returnSchema.index({ userId: 1, ebayReturnId: 1 })
returnSchema.index({ userId: 1, creationDate: -1 })

module.exports = mongoose.model("Return", returnSchema) 