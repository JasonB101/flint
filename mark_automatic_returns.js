const mongoose = require('mongoose');
const InventoryItem = require('./models/inventoryItem');
const path = require("path");

// Load environment variables
require("dotenv").config({
  path: path.join(__dirname, ".env"),
});

// Connect to MongoDB using environment variable
mongoose.connect(process.env.MONGO_ATLAS_CLUSTER1, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function markAutomaticReturns() {
  console.log('🏷️  Updating existing items to mark automatic vs manual returns...\n');
  
  try {
    // Find all items with return shipping costs
    const allReturns = await InventoryItem.find({
      additionalCosts: {
        $elemMatch: {
          title: "returnShippingCost",
          amount: { $gt: 0 }
        }
      }
    });
    
    console.log(`📦 Found ${allReturns.length} items with return shipping costs\n`);
    
    let automaticCount = 0;
    let manualCount = 0;
    
    for (const item of allReturns) {
      const returnCost = item.additionalCosts.find(cost => cost.title === "returnShippingCost")?.amount || 0;
      
      // Logic: If item is currently listed=true AND status=active, it was likely automatic
      // All others (completed, waste, etc.) were likely manual
      const isAutomatic = item.listed === true && item.status === 'active';
      
      // Update the item with the automaticReturn flag
      await InventoryItem.findByIdAndUpdate(item._id, {
        automaticReturn: isAutomatic
      });
      
      if (isAutomatic) {
        automaticCount++;
        console.log(`✅ SKU ${item.sku}: Marked as AUTOMATIC return ($${returnCost})`);
      } else {
        manualCount++;
        console.log(`📝 SKU ${item.sku}: Marked as MANUAL return ($${returnCost}) - Status: ${item.status}`);
      }
    }
    
    console.log('\n📊 SUMMARY:');
    console.log(`   ✅ Automatic returns: ${automaticCount} items`);
    console.log(`   📝 Manual returns: ${manualCount} items`);
    console.log(`   📦 Total processed: ${allReturns.length} items`);
    
    console.log('\n🎉 All items have been updated with automaticReturn flags!');
    console.log('💡 Now the backfill script will only find items with automaticReturn: true');
    
  } catch (error) {
    console.error('❌ Error updating items:', error);
  } finally {
    mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
}

markAutomaticReturns(); 