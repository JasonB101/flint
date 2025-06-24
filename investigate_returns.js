const mongoose = require('mongoose');
const InventoryItem = require('./models/inventoryItem');

// Connect to MongoDB using hard-coded connection string
mongoose.connect('mongodb+srv://jadmin:Wtf10101@cluster1.6bbc3.mongodb.net/heroku_jp04p0x6?retryWrites=true&w=majority', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function investigateReturns() {
  console.log('🔍 Investigating ALL items with return shipping costs...\n');
  
  try {
    // Find ALL items with returnShippingCost, regardless of status
    const allReturns = await InventoryItem.find({
      additionalCosts: {
        $elemMatch: {
          title: "returnShippingCost",
          amount: { $gt: 0 }
        }
      }
    }).sort({ updatedAt: -1 });
    
    console.log(`📦 Found ${allReturns.length} total items with return shipping costs\n`);
    
    if (allReturns.length === 0) {
      console.log('❌ No items found with return shipping costs');
      return;
    }
    
    // Group by status and listed status
    const statusBreakdown = {};
    const listedBreakdown = {};
    const monthBreakdown = {};
    
    allReturns.forEach(item => {
      // Status breakdown
      const status = item.status || 'undefined';
      statusBreakdown[status] = (statusBreakdown[status] || 0) + 1;
      
      // Listed breakdown
      const listed = item.listed ? 'listed' : 'not listed';
      listedBreakdown[listed] = (listedBreakdown[listed] || 0) + 1;
      
      // Date breakdown (using updatedAt)
      if (item.updatedAt) {
        const month = item.updatedAt.toISOString().slice(0, 7); // YYYY-MM format
        monthBreakdown[month] = (monthBreakdown[month] || 0) + 1;
      }
      
      // Show details for each item
      const returnCost = item.additionalCosts.find(cost => cost.title === "returnShippingCost")?.amount || 0;
      const dateInfo = item.updatedAt ? item.updatedAt.toISOString().slice(0, 10) : 'No date';
      
      console.log(`SKU: ${item.sku} | Status: ${item.status} | Listed: ${item.listed} | Return: $${returnCost} | Updated: ${dateInfo}`);
    });
    
    console.log('\n📊 BREAKDOWN BY STATUS:');
    Object.entries(statusBreakdown).forEach(([status, count]) => {
      console.log(`   ${status}: ${count} items`);
    });
    
    console.log('\n📊 BREAKDOWN BY LISTED STATUS:');
    Object.entries(listedBreakdown).forEach(([listed, count]) => {
      console.log(`   ${listed}: ${count} items`);
    });
    
    console.log('\n📊 BREAKDOWN BY MONTH (updatedAt):');
    Object.entries(monthBreakdown).sort().forEach(([month, count]) => {
      console.log(`   ${month}: ${count} items`);
    });
    
    console.log('\n🔍 CURRENT BACKFILL CRITERIA (listed=true AND status=active):');
    const currentCriteria = allReturns.filter(item => item.listed === true && item.status === 'active');
    console.log(`   Would find: ${currentCriteria.length} items`);
    
    console.log('\n💡 SUGGESTED BROADER CRITERIA:');
    console.log('   Option 1: All items with return costs (no status filter)');
    console.log('   Option 2: Items with return costs + any status');
    console.log('   Option 3: Items with return costs + (active OR sold status)');
    
  } catch (error) {
    console.error('❌ Error during investigation:', error);
  } finally {
    mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
}

investigateReturns(); 