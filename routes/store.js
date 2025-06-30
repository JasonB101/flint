const express = require("express")
const storeRouter = express.Router()
const { getStore, getUser, get90DaySales } = require('../lib/ebayMethods/ebayApi')
const User = require('../models/user')

// Helper function to get user object (same pattern as ebay.js)
async function getUserObject(userId) {
  const userInfo = await User.findById(userId)
  if (!userInfo) {
    throw new Error(`User not found with ID: ${userId}`)
  }
  return userInfo.toObject()
}

// GET store information
storeRouter.get("/", async (req, res) => {
  try {
    const userId = req.auth._id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required"
      });
    }
    
    console.log(`🏪 Fetching store information for user ${userId}`);
    
    let userObject;
    let ebayAuthToken;
    
    try {
      // Get user object using same pattern as other eBay routes
      userObject = await getUserObject(userId);
      ebayAuthToken = userObject.ebayToken;
    } catch (userError) {
      console.error(`❌ User lookup failed for ID ${userId}:`, userError.message);
      return res.status(401).json({
        success: false,
        message: "User authentication invalid. Please log in again.",
        needsReauth: true
      });
    }

    if (!ebayAuthToken) {
      console.warn(`⚠️ No eBay auth token found for user ${userId}`);
      return res.status(400).json({ 
        success: false, 
        message: "eBay authentication token not found. Please connect your eBay account." 
      });
    }
    
    // Call eBay APIs in parallel for better performance
    // Note: 90-day sales requires OAuth token, others use auth token
    const promises = [
      getStore(ebayAuthToken),
      getUser(ebayAuthToken)
    ];
    
    // Add 90-day sales if OAuth token is available
    if (userObject.ebayOAuth) {
      promises.push(get90DaySales(userObject.ebayOAuth));
    }
    
    const results = await Promise.allSettled(promises);
    
    // Process store data
    const storeResult = results[0];
    let storeData = null;
    if (storeResult.status === 'fulfilled' && storeResult.value.success) {
      storeData = storeResult.value.store;
      console.log(`✅ Successfully retrieved store data: ${storeData.name || 'Unknown Store'}`);
    } else {
      console.log(`❌ Failed to retrieve store data: ${storeResult.status === 'fulfilled' ? storeResult.value.message : storeResult.reason}`);
    }
    
    // Process user data
    const userResult = results[1];
    let userData = null;
    if (userResult.status === 'fulfilled' && userResult.value.success) {
      userData = userResult.value.user;
      console.log(`✅ Successfully retrieved user data: ${userData.userId || 'Unknown User'}`);
    } else {
      console.log(`❌ Failed to retrieve user data: ${userResult.status === 'fulfilled' ? userResult.value.message : userResult.reason}`);
    }
    
    // Process 90-day sales data (if OAuth token was available)
    let salesData = null;
    if (userObject.ebayOAuth && results.length > 2) {
      const salesResult = results[2];
      if (salesResult.status === 'fulfilled' && salesResult.value.success) {
        salesData = {
          totalSales: salesResult.value.totalSales,
          transactionCount: salesResult.value.transactionCount,
          dateRange: salesResult.value.dateRange
        };
        console.log(`✅ Successfully retrieved 90-day sales: $${salesData.totalSales.toFixed(2)} from ${salesData.transactionCount} transactions`);
      } else {
        console.log(`❌ Failed to retrieve 90-day sales data: ${salesResult.status === 'fulfilled' ? (salesResult.value.error || 'Unknown error') : salesResult.reason}`);
      }
    }
    
    // Determine seller level using fee percentage as primary indicator
    let sellerLevel = 'Standard';
    if (userData) {
      const ebayFeePercent = userObject.ebayFeePercent || 0.1;
      const transactionPercent = parseFloat(userData.transactionPercent) || 0;
      const positiveFeedbackPercent = parseFloat(userData.positiveFeedbackPercent) || 0;
      
      console.log(`📊 Seller Analysis:
        - eBay Fee Percent: ${(ebayFeePercent * 100).toFixed(1)}%
        - Transaction Percent: ${transactionPercent}%
        - Positive Feedback: ${positiveFeedbackPercent}%
        - Good Standing: ${userData.goodStanding}
        - Top Rated: ${userData.topRatedSeller}
        - Guarantee Level: ${userData.sellerGuaranteeLevel}`);
      
      // Determine seller level based on fee structure (most reliable indicator)
      if (userData.topRatedSeller) {
        sellerLevel = 'Top Rated Plus';
      } else if (ebayFeePercent > 0.13) { // 13%+ indicates Below Standard penalties
        sellerLevel = 'Below Standard';
        console.log(`🚨 Below Standard detected: Fee ${(ebayFeePercent * 100).toFixed(1)}% exceeds standard rates`);
      } else if (userData.sellerGuaranteeLevel === 'Eligible') {
        sellerLevel = 'Above Standard';
      } else if (userData.sellerGuaranteeLevel === 'Premium') {
        sellerLevel = 'Top Rated';
      } else if (userData.sellerGuaranteeLevel === 'NotEligible') {
        // For NotEligible, use business type and performance
        if (userData.sellerBusinessType === 'Commercial' && 
            transactionPercent >= 98 && positiveFeedbackPercent >= 99) {
          sellerLevel = 'Commercial Seller';
        } else if (transactionPercent >= 98 && positiveFeedbackPercent >= 99) {
          sellerLevel = 'Above Standard';
        } else {
          sellerLevel = 'Standard';
        }
      }
      
      // Add seller level to userData
      userData.sellerLevel = sellerLevel;
      console.log(`🎯 Final Seller Level: ${sellerLevel}`);
    }
    
    // Combine all data including database info
    const combinedData = {
      store: storeData,
      seller: userData,
      sales: salesData,
      account: {
        ebayFeePercent: userObject.ebayFeePercent || 0.1,
        averageShippingCost: userObject.averageShippingCost || 14,
        syncedWithEbay: userObject.syncedWithEbay || false,
        userDescriptionTemplate: userObject.userDescriptionTemplate || null
      }
    };
    
    // Return success if we got at least some data
    if (storeData || userData) {
      res.status(200).json({ 
        success: true, 
        data: combinedData
      });
    } else {
      res.status(400).json({ 
        success: false, 
        message: "Failed to retrieve both store and user information from eBay" 
      });
    }
  } catch (error) {
    console.error("Error in GET /store:", error);
    res.status(500).json({ 
      success: false, 
      error: "Failed to fetch store information",
      message: error.message 
    });
  }
});

module.exports = storeRouter 