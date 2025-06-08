const mongoose = require('mongoose');
const Expense = require('./models/expense');
require('dotenv').config();

// Connect to MongoDB using the same config as your app
mongoose.set('strictQuery', false);
mongoose.connect(process.env.MONGO_ATLAS_CLUSTER1, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

const categorizeExpense = (title) => {
    const titleLower = title.toLowerCase();
    
    // Environmental fees (187 occurrences)
    if (titleLower.includes('enviro')) {
        return 'Environmental';
    }
    
    // Taxes (83 occurrences)
    if (titleLower.includes('tax')) {
        return 'Taxes';
    }
    
    // Travel & Transportation
    if (titleLower.includes('gas') || 
        titleLower.includes('fuel') || 
        titleLower.includes('hotel') ||
        titleLower.includes('motel') ||
        titleLower.includes('travel') ||
        titleLower.includes('mileage') ||
        titleLower.includes('parking')) {
        return 'Travel';
    }
    
    // Food
    if (titleLower.includes('restaurant') ||
        titleLower.includes('food') ||
        titleLower.includes('lunch') ||
        titleLower.includes('dinner') ||
        titleLower.includes('breakfast') ||
        titleLower.includes('meal') ||
        titleLower.includes('mcdonald') ||
        titleLower.includes('subway') ||
        titleLower.includes('pizza') ||
        titleLower.includes('cafe') ||
        titleLower.includes('coffee')) {
        return 'Food';
    }
    
    // Shipping supplies
    if (titleLower.includes('air pillow') ||
        titleLower.includes('tape') ||
        titleLower.includes('box') ||
        titleLower.includes('packaging') ||
        titleLower.includes('shipping') ||
        titleLower.includes('bubble') ||
        titleLower.includes('envelope') ||
        titleLower.includes('label')) {
        return 'Shipping';
    }
    
    // Equipment & Tools
    if (titleLower.includes('socket') ||
        titleLower.includes('drill') ||
        titleLower.includes('tool') ||
        titleLower.includes('shelving') ||
        titleLower.includes('equipment') ||
        titleLower.includes('wrench') ||
        titleLower.includes('screwdriver') ||
        titleLower.includes('hammer') ||
        titleLower.includes('saw') ||
        titleLower.includes('workbench')) {
        return 'Equipment';
    }
    
    // Software & Technology
    if (titleLower.includes('ebay') ||
        titleLower.includes('software') ||
        titleLower.includes('computer') ||
        titleLower.includes('laptop') ||
        titleLower.includes('printer') ||
        titleLower.includes('subscription') ||
        titleLower.includes('app') ||
        titleLower.includes('license')) {
        return 'Software';
    }
    
    // Legal & Business
    if (titleLower.includes('llc') ||
        titleLower.includes('dba') ||
        titleLower.includes('registration') ||
        titleLower.includes('license') ||
        titleLower.includes('permit') ||
        titleLower.includes('legal') ||
        titleLower.includes('attorney') ||
        titleLower.includes('filing')) {
        return 'Legal';
    }
    
    // Core charges
    if (titleLower.includes('core')) {
        return 'Core';
    }
    
    // Waste items (including auto parts that didn't work out)
    if (titleLower.includes('waste') ||
        titleLower.includes('scrap') ||
        titleLower.includes('junk') ||
        titleLower.includes('broken') ||
        titleLower.includes('damaged') ||
        titleLower.includes('unusable') ||
        titleLower.includes('bad') ||
        titleLower.includes('return') ||
        // Auto parts that were purchased but thrown away/never listed
        titleLower.includes('alternator') ||
        titleLower.includes('starter') ||
        titleLower.includes('battery') ||
        titleLower.includes('engine') ||
        titleLower.includes('transmission') ||
        titleLower.includes('radiator') ||
        titleLower.includes('brake') ||
        titleLower.includes('clutch') ||
        titleLower.includes('muffler') ||
        titleLower.includes('catalytic') ||
        titleLower.includes('exhaust')) {
        return 'Waste';
    }
    
    // Default to Other for unmatched items
    return 'Other';
};

const migrateExpenses = async () => {
    try {
        console.log('🔄 Starting expense category migration...');
        
        // Find all expenses without a category
        const expenses = await Expense.find({ category: { $exists: false } });
        console.log(`📊 Found ${expenses.length} expenses to migrate`);
        
        let updateCount = 0;
        const categoryStats = {};
        
        for (let expense of expenses) {
            const category = categorizeExpense(expense.title);
            
            // Track category statistics
            categoryStats[category] = (categoryStats[category] || 0) + 1;
            
            // Update the expense
            await Expense.findByIdAndUpdate(expense._id, { category });
            updateCount++;
            
            if (updateCount % 50 === 0) {
                console.log(`✅ Updated ${updateCount}/${expenses.length} expenses...`);
            }
        }
        
        console.log('\n🎉 Migration completed successfully!');
        console.log('\n📈 Category breakdown:');
        Object.entries(categoryStats)
            .sort(([,a], [,b]) => b - a)
            .forEach(([category, count]) => {
                console.log(`   ${category}: ${count} expenses`);
            });
        
        console.log(`\n✨ Successfully updated ${updateCount} expenses with categories!`);
        
    } catch (error) {
        console.error('❌ Migration failed:', error);
    } finally {
        mongoose.connection.close();
    }
};

// Run the migration
migrateExpenses(); 