const mongoose = require('mongoose');
const InventoryItem = require('./models/inventoryItem');
const Notification = require('./models/notification');
const User = require('./models/user');

// Connect to MongoDB using hard-coded connection string
mongoose.connect('mongodb+srv://jadmin:Wtf10101@cluster1.6bbc3.mongodb.net/heroku_jp04p0x6?retryWrites=true&w=majority', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function backfillAutomaticReturnNotifications() {
  console.log('🔍 Starting backfill of automatic return notifications (ALL historical returns)...');
  
  try {
    // Find all inventory items that have been automatically returned
    // Criteria: 
    // 1. Has additionalCosts with returnShippingCost
    // 2. automaticReturn flag is true (explicitly marked as automatic)
    // 3. This is now the definitive way to identify automatic returns
    
    const automaticReturns = await InventoryItem.find({
      additionalCosts: {
        $elemMatch: {
          title: "returnShippingCost",
          amount: { $gt: 0 }
        }
      },
      automaticReturn: true // Explicitly marked as automatic return
    }).sort({ updatedAt: -1 }); // Newest first
    
    console.log(`📦 Found ${automaticReturns.length} items with automatic returns (ALL TIME)`);
    
    if (automaticReturns.length === 0) {
      console.log('✅ No automatic returns found to process');
      return;
    }
    
    let notificationsCreated = 0;
    let notificationsSkipped = 0;
    
    for (const item of automaticReturns) {
      try {
        const { userId, sku, title, additionalCosts = [], expectedProfit } = item;
        
        // Get return shipping cost
        const returnShippingCost = additionalCosts.find(cost => cost.title === "returnShippingCost")?.amount || 0;
        const originalShippingCost = additionalCosts.find(cost => cost.title === "shippingCost")?.amount || 0;
        
        // Check if notification already exists for this item
        const existingNotification = await Notification.findOne({
          userId: userId,
          type: 'automaticReturn',
          'data.sku': sku
        });
        
        if (existingNotification) {
          console.log(`⏭️  Notification already exists for SKU: ${sku}`);
          notificationsSkipped++;
          continue;
        }
        
        // Check user's notification settings
        const user = await User.findById(userId).select('notificationSettings');
        const notificationSettings = user?.notificationSettings || { automaticReturns: true };
        
        if (!notificationSettings.automaticReturns) {
          console.log(`🔕 User ${userId} has automatic return notifications disabled - skipping SKU: ${sku}`);
          notificationsSkipped++;
          continue;
        }
        
                 // Estimate when this return might have happened
         // Try to use meaningful dates if available, otherwise use a reasonable estimate
         let estimatedReturnDate = new Date();
         
         // If item has a dateSold, use that as basis (return likely happened after sale)
         if (item.dateSold) {
           estimatedReturnDate = new Date(item.dateSold);
           // Add random 7-30 days after sale date for return processing
           estimatedReturnDate.setDate(estimatedReturnDate.getDate() + Math.floor(Math.random() * 23) + 7);
         } else {
           // Fallback: set to sometime in the past (1-60 days ago)
           estimatedReturnDate.setDate(estimatedReturnDate.getDate() - Math.floor(Math.random() * 60) - 1);
         }
        
        // Create notification
        const notification = new Notification({
          userId: userId,
          type: 'automaticReturn',
          data: {
            sku: sku,
            orderId: item.orderId || `HISTORICAL-${sku}`,
            originalSalePrice: returnShippingCost + originalShippingCost + expectedProfit, // Rough estimate
            returnShippingCost: returnShippingCost,
            buyer: 'Historical Return', // We don't have buyer info for historical data
            itemTitle: title || `SKU: ${sku}`,
            newExpectedProfit: expectedProfit,
            message: `Historical return processed for SKU ${sku} - Item restored to active listing`
          },
          isViewed: false, // Leave as unread so they appear in notification modal
          date: estimatedReturnDate
        });
        
        await notification.save();
        console.log(`✅ Created notification for SKU: ${sku} (Return cost: $${returnShippingCost})`);
        notificationsCreated++;
        
      } catch (error) {
        console.error(`❌ Error processing item ${item.sku}:`, error.message);
      }
    }
    
    console.log('\n📊 Backfill Summary:');
    console.log(`   ✅ Notifications Created: ${notificationsCreated}`);
    console.log(`   ⏭️  Notifications Skipped: ${notificationsSkipped}`);
    console.log(`   📦 Total Items Processed: ${automaticReturns.length}`);
    
    if (notificationsCreated > 0) {
      console.log('\n🎉 Backfill completed successfully!');
      console.log('💡 Historical notifications have been marked as "unread" and will appear in your notification modal.');
      console.log('💡 You can now see your automatic return history in the notifications modal.');
    }
    
  } catch (error) {
    console.error('❌ Error during backfill:', error);
  } finally {
    mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

// Add command line options
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run') || args.includes('-d');

if (dryRun) {
  console.log('🧪 DRY RUN MODE - No notifications will be created');
  // Modify the function to not actually create notifications
  backfillAutomaticReturnNotificationsDryRun();
} else {
  backfillAutomaticReturnNotifications();
}

async function backfillAutomaticReturnNotificationsDryRun() {
  console.log('🔍 Starting DRY RUN of automatic return notifications backfill (ALL historical returns)...');
  
  try {
    const automaticReturns = await InventoryItem.find({
      additionalCosts: {
        $elemMatch: {
          title: "returnShippingCost",
          amount: { $gt: 0 }
        }
      },
      automaticReturn: true // Explicitly marked as automatic return
    }).sort({ updatedAt: -1 }); // Newest first
    
    console.log(`📦 Found ${automaticReturns.length} items with automatic returns (ALL TIME)`);
    
    if (automaticReturns.length === 0) {
      console.log('✅ No automatic returns found to process');
      return;
    }
    
    let wouldCreate = 0;
    let wouldSkip = 0;
    
    for (const item of automaticReturns) {
      const { userId, sku, additionalCosts = [] } = item;
      const returnShippingCost = additionalCosts.find(cost => cost.title === "returnShippingCost")?.amount || 0;
      
      // Check if notification already exists
      const existingNotification = await Notification.findOne({
        userId: userId,
        type: 'automaticReturn',
        'data.sku': sku
      });
      
      if (existingNotification) {
        console.log(`⏭️  Would skip (already exists) SKU: ${sku}`);
        wouldSkip++;
      } else {
        // Check user settings
        const user = await User.findById(userId).select('notificationSettings');
        const notificationSettings = user?.notificationSettings || { automaticReturns: true };
        
        if (!notificationSettings.automaticReturns) {
          console.log(`🔕 Would skip (user disabled) SKU: ${sku}`);
          wouldSkip++;
        } else {
          console.log(`✅ Would create notification for SKU: ${sku} (Return cost: $${returnShippingCost})`);
          wouldCreate++;
        }
      }
    }
    
    console.log('\n📊 DRY RUN Summary:');
    console.log(`   ✅ Would Create: ${wouldCreate} notifications`);
    console.log(`   ⏭️  Would Skip: ${wouldSkip} notifications`);
    console.log(`   📦 Total Items: ${automaticReturns.length}`);
    console.log('\n💡 Run without --dry-run flag to actually create the notifications');
    
  } catch (error) {
    console.error('❌ Error during dry run:', error);
  } finally {
    mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
} 