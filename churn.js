const ChurnSettings = require("./models/churnSettings.js")
const User = require("./models/user.js")
const InventoryItem = require("./models/inventoryItem.js")
const connectDB = require("./config/db.js")
const relistItem = require("./lib/relist/relistItem.js")

const churn = async () => {
  console.log("Starting churn process...")
  await connectDB()
  const allUsersChurnSettings = await ChurnSettings.find({ churnEnabled: true })

  const userIds = allUsersChurnSettings.map((settings) => settings.userId)
  const users = await User.find({ _id: { $in: userIds } })
  const userMap = new Map(users.map((user) => [user._id.toString(), user]))

  const relistPromises = allUsersChurnSettings.map(async (churnSettings) => {
    const user = userMap.get(churnSettings.userId.toString())
    if (user) {
      return relistItems(user, churnSettings)
    }
  })

  await Promise.all(relistPromises)
  return "Churn process completed."
}

async function relistItems(user, churnSettings) {
  const itemsToReList = await getItemsToReList(churnSettings)
  const relistItemPromises = itemsToReList.map(async (item) => {
    try {
      const relistedItem = await relistItem(item, user, churnSettings)
      if (relistedItem.success) {
        console.log(`Item ${relistedItem.sku} was successfully relisted`)
      } else {
        console.log(
          `Item ${item.sku} failed to relist`,
          relistedItem.message
        )
      }
    } catch (e) {
      console.log(e)
    }
  })

  await Promise.all(relistItemPromises)
}

async function getItemsToReList(churnSettings) {
  const { userId, quantityToReList } = churnSettings
  const getItemsToReList = await InventoryItem.aggregate([
    {
      $match: {
        listed: true,
        userId: userId,
      },
    },
    {
      $addFields: {
        oldestDate: {
          $ifNull: [
            {
              $dateFromString: {
                dateString: "$dateReListed",
                format: "%m/%d/%Y",
              },
            },
            {
              $dateFromString: {
                dateString: "$dateListed",
                format: "%m/%d/%Y",
              },
            },
          ],
        },
      },
    },
    {
      $sort: { oldestDate: 1 },
    },
    {
      $limit: +quantityToReList,
    },
  ])

  return getItemsToReList
}

churn()
  .then((message) => {
    console.log(message)
    process.exit(0)
  })
  .catch((error) => {
    console.error("Churn process failed:", error)
    process.exit(1)
  })
