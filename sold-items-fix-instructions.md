# Fix Sold Items with Returns

This script identifies and fixes inventory items that are incorrectly showing as "sold" when they've been returned and shouldn't appear in your sold items table.

## The Problem

Items can incorrectly show as sold in these scenarios:
1. **Returned as waste** - Item was sold, then returned and marked as waste, but still shows `sold: true`
2. **Returned and re-listed** - Item was sold, returned, and re-listed for sale, but still shows as sold from original sale
3. **Historical data** - Older items that were returned before the current return processing logic was implemented

## Usage

### 1. Analyze (Dry Run)
See what items have issues without making changes:

```bash
node fix-sold-items-with-returns.js --verbose
```

### 2. Fix Issues
Actually fix the identified problems:

```bash
node fix-sold-items-with-returns.js --apply --verbose
```

### 3. Analyze Specific User
Process only one user's data:

```bash
node fix-sold-items-with-returns.js --userId=YOUR_USER_ID --verbose
```

### 4. Save Detailed Report
Save analysis results to a JSON file:

```bash
node fix-sold-items-with-returns.js --apply --save-report
```

## What the Script Does

### Analysis Logic
The script categorizes sold items with returns into:

1. **SHOULD_NOT_BE_SOLD** (Will be fixed)
   - Items with status = 'waste' (returned and not resaleable)
   - Items with status = 'active' and listed = true (returned and re-listed)
   - Items returned after sale date with high confidence they were NOT resold

2. **CORRECTLY_SOLD** (No changes needed)
   - Items returned before sale date (unusual but valid)
   - Items returned and then legitimately resold (high confidence)

3. **INVESTIGATE** (Manual review needed)
   - Items with unusual status combinations
   - Items missing critical data (sale dates, etc.)
   - **Ambiguous resale cases** (low confidence in resale analysis)
   - **Critical concerns** (same order ID as return, timing issues, etc.)

### Conservative Approach
The script errs on the side of caution to prevent incorrectly marking legitimate resales as unsold:
- **Multi-factor resale detection**: Checks order ID, buyer, timing, eBay listing ID
- **Low confidence flagging**: Ambiguous cases require manual investigation
- **Same order ID protection**: Never auto-marks items with same order ID as return

### Fixes Applied
For items that should not be sold:
- Sets `sold: false`
- Sets `shipped: false`
- For waste items: Clears sale data (price, date, buyer, etc.)

## Example Output

```
🔍 Analyzing sold items with returns...
📋 Options: dryRun=true, userId=ALL
📦 Fetching items marked as sold...
📊 Found 1,234 items marked as sold

📦 Item 15972 (waste)
   Returns: 1
   Sale Date: 2/15/2024
   Order ID: 123456789
   Buyer: john_doe
   Price Sold: $45.00
   Analysis: SHOULD_NOT_BE_SOLD
   Reason: Item status is waste - returned and not resaleable
   Return 1: Created 2024-02-20T10:30:00.000Z, Status CLOSED, Order 123456789
   🔍 Would fix - set sold=false

📦 Item 15834 (completed)
   Returns: 1
   Sale Date: 3/10/2024
   Order ID: 987654321
   Buyer: buyer123
   Price Sold: $125.00
   Analysis: CORRECTLY_SOLD
   Reason: Item was returned but then resold (confidence: 85%) - Different order ID from returned order, Different buyer from original return, Sale date 15 days after return
   Return 1: Created 2024-02-24T14:22:00.000Z, Status CLOSED, Order 111222333
   ✅ Correctly shows as sold

📦 Item 16180 (completed)
   Returns: 1
   Sale Date: 3/20/2024
   Order ID: 555666777
   Buyer: same_buyer
   Price Sold: $650.00
   Analysis: INVESTIGATE
   Reason: Uncertain if this is a resale (confidence: 25%) - MANUAL REVIEW REQUIRED: Same buyer as original return - could be same sale, Same order ID as returned order - likely the original sale
   Return 1: Created 2024-03-25T09:15:00.000Z, Status CLOSED, Order 555666777

📊 Analysis Results:
   Total sold items: 1,234
   Items with returns: 89
   Correctly sold: 1,167
   Incorrectly marked as sold: 23
   Need investigation: 5
   Fixed: 0
   Errors: 0

🔍 This was a DRY RUN - no changes were made
Run with --apply to make actual changes
```

## Options

- `--apply` - Actually make changes (without this, it's a dry run)
- `--verbose` - Show detailed output for each item processed
- `--userId=ID` - Process only items for specific user ID
- `--save-report` - Save detailed analysis report to JSON file

## Safety Features

- **Dry run by default** - Won't make changes unless you use `--apply`
- **Conservative logic** - Only fixes clear cases, flags ambiguous ones for manual review
- **Detailed logging** - Shows exactly what will be changed and why
- **Error handling** - Continues processing if individual items fail

## Recommended Workflow

1. **Analyze first**: `node fix-sold-items-with-returns.js --verbose`
2. **Review the output** to understand what issues exist
3. **Test on one user**: `node fix-sold-items-with-returns.js --userId=YOUR_USER_ID --apply --verbose`
4. **Apply to all**: `node fix-sold-items-with-returns.js --apply --save-report`
5. **Review investigation items** manually if any are flagged

## After Running This

Once you fix the sold items issues, your sold items table will only show:
- ✅ Items that were sold and never returned
- ✅ Items that were returned but then resold
- ❌ Won't show items that were returned as waste
- ❌ Won't show items that were returned and re-listed (but not resold) 