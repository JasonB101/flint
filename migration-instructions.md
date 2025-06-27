# Inventory Migration from Returns Database

This script migrates missing fields from your returns database back to your inventory items.

## Usage

### 1. Dry Run (Recommended First)
See what would be changed without making actual changes:

```bash
node migrate-inventory-from-returns.js
```

### 2. Verbose Dry Run
Get detailed output about what would be changed:

```bash
node migrate-inventory-from-returns.js --verbose
```

### 3. Apply Changes
Actually perform the migration:

```bash
node migrate-inventory-from-returns.js --apply
```

### 4. Apply with Verbose Output
Apply changes with detailed logging:

```bash
node migrate-inventory-from-returns.js --apply --verbose
```

### 5. Migrate Specific User Only
Process only one user's data:

```bash
node migrate-inventory-from-returns.js --userId=YOUR_USER_ID --apply
```

### 6. Save Migration Report
Save detailed results to a JSON file:

```bash
node migrate-inventory-from-returns.js --apply --save-report
```

## Options

- `--apply` - Actually make changes (without this, it's a dry run)
- `--verbose` - Show detailed output for each item processed
- `--userId=ID` - Process only items for specific user ID
- `--batchSize=100` - Process items in batches (default: 100)
- `--save-report` - Save detailed migration report to JSON file

## What Gets Updated

The script checks and updates these fields based on your returns data:

1. **returnCount** - Set to actual number of returns for the item
2. **hasActiveReturn** - Set based on whether any returns are still open
3. **returnDate** - Set to date of most recent return
4. **lastReturnedOrder** - Set to order ID of most recent return
5. **automaticReturn** - Set to true (indicates item has been processed)
6. **additionalCosts** - **ONLY** adds `returnShippingCost` entries (does NOT touch refunds or any other existing entries)

⚠️ **IMPORTANT**: The script will never modify existing `additionalCosts` entries or add refund entries. It only appends `returnShippingCost` entries when missing.

## Safety Features

- **Dry run by default** - Won't make changes unless you use `--apply`
- **Only processes items with returns** - Unprocessed items are left alone
- **Detailed logging** - Shows exactly what will be changed
- **Error handling** - Continues processing if individual items fail
- **Progress tracking** - Shows progress for large datasets

## Example Output

```
🔄 Starting inventory migration from returns database...
📋 Options: dryRun=true, userId=ALL, batchSize=100
📦 Fetching returns with inventory items...
📊 Found 1,245 returns to process
📋 Processing 892 unique inventory items...

📦 Item: SKU-12345 (2 returns)
   Current status: sold
   Missing fields: returnCount, hasActiveReturn, returnDate
   Updates needed: YES
   🔍 Would update: returnCount, hasActiveReturn, returnDate

📊 Migration Results:
   Total returns: 1,245
   Items processed: 892
   Items updated: 623
   Items skipped: 269
   Errors: 0

🔍 This was a DRY RUN - no changes were made
Run with --apply to make actual changes
```

## Recommended Workflow

1. **Start with a dry run**: `node migrate-inventory-from-returns.js --verbose`
2. **Review the output** to make sure it looks correct
3. **Test on one user**: `node migrate-inventory-from-returns.js --userId=YOUR_USER_ID --apply --verbose`
4. **Apply to all users**: `node migrate-inventory-from-returns.js --apply --save-report`
5. **Keep the report** for your records 