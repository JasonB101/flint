# Automatic Return Notifications Backfill Script

This script allows you to populate your notification system with automatic return data from the last 30 days, so you can see recent automatic returns in your notification modal.

## What it does

The script searches your database for inventory items that have been automatically returned in the last 30 days (identified by having `returnShippingCost` in their `additionalCosts` array and recent update timestamps) and creates notifications for them.

## How to use

### 1. First, run a dry run to see what would be created:

```bash
node backfill_automatic_return_notifications.js --dry-run
```

This will show you:
- How many historical automatic returns were found
- Which SKUs would get notifications
- Which would be skipped (already have notifications or user has disabled automatic return notifications)
- No actual notifications will be created

### 2. If the dry run looks good, run the actual backfill:

```bash
node backfill_automatic_return_notifications.js
```

This will:
- Create notifications for automatic returns from the last 30 days  
- Mark them as "viewed" so they don't overwhelm your notification panel
- Show a summary of what was created

## Features

- **Safe**: Won't create duplicate notifications for the same SKU
- **Respects user settings**: Only creates notifications for users who have automatic return notifications enabled
- **Non-disruptive**: Historical notifications are marked as "viewed" so they don't clutter your active notifications
- **Recent focus**: Only processes returns from the last 30 days for relevance
- **Intelligent dating**: Uses sale dates when available to estimate when returns likely happened
- **Comprehensive logging**: Shows exactly what's happening at each step

## What gets created

Each historical notification includes:
- ↩️ Icon to identify it as a return
- SKU and item title
- Return shipping cost
- Estimated original sale price
- Order ID (or "HISTORICAL-{SKU}" if not available)
- Message indicating it was a historical return

## Example output

```
🔍 Starting backfill of automatic return notifications (last 30 days)...
📦 Found 15 items with automatic returns from the last 30 days
✅ Created notification for SKU: ABC123 (Return cost: $12.50)
✅ Created notification for SKU: DEF456 (Return cost: $8.75)
⏭️  Notification already exists for SKU: GHI789
🔕 User has automatic return notifications disabled - skipping SKU: JKL012

📊 Backfill Summary:
   ✅ Notifications Created: 13
   ⏭️  Notifications Skipped: 2
   📦 Total Items Processed: 15

🎉 Backfill completed successfully!
💡 Historical notifications have been marked as "viewed" to avoid overwhelming your notification panel.
💡 You can now see your automatic return history in the notifications modal.
```

## Important Notes

1. **Environment Variables**: Make sure your `.env` file is in the same directory as the script with your `MONGODB_URI`
2. **Backup**: Consider backing up your notifications collection before running (though the script only adds new data)
3. **User Settings**: Users who have disabled automatic return notifications won't get historical notifications
4. **One-time Use**: Running the script multiple times won't create duplicates - it checks for existing notifications

## Viewing Historical Notifications

After running the script:
1. Click the bell icon in your app
2. You'll see your historical automatic returns in the notification modal
3. They'll be marked as "viewed" but you can still see all the details
4. Click on any notification to see the return details

This gives you a complete view of all automatic returns from the last 30 days that have been processed in your system! 🎉 