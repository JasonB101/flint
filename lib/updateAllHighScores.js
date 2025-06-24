const Milestones = require('../models/milestones'); // Import your Milestone model
const Notification = require('../models/notification'); // Import your Notification model

// Function to update all high scores in the milestone and create/save notifications
async function updateAllHighScores(userId, newScores) {
  try {
    let milestone = await findOrCreateMilestone(userId);
    let updated = false;

    // Loop through categories (day, week, month)
    for (const category of Object.keys(newScores)) {
      // Check if the newScores for this category are empty
      if (Object.keys(newScores[category]).length === 0) {
        continue; // Skip empty newScores entries
      }

      // Loop through stat types (listed, sold, pulled, sales, spent)
      for (const statType of Object.keys(newScores[category])) {
        const newStat = newScores[category][statType];
        const prepStat = milestone.scores[category][statType];

        if (isNewHighScore(newStat, prepStat, statType)) {
          milestone.scores[category][statType] = newStat;
          await createAndSaveNotification(userId, category, statType, newStat);
          updated = true;
        }
      }
    }

    if (updated) {
      await saveMilestone(milestone);
      console.log(`Milestone updated for User ${userId}`);
    } else {
      console.log(`No new high scores found for User ${userId}`);
    }
  } catch (error) {
    console.log(`Error updating milestone: ${error.stack}`);
  }
}

// Function to find or create a milestone document for the user
async function findOrCreateMilestone(userId) {
  try {
    let milestone = await Milestones.findOne({ userId: userId });
    if (!milestone) {
      milestone = new Milestones({
        userId,
        scores: {
          day: {},
          week: {},
          month: {},
        },
      });
      await milestone.save(); // Save the newly created milestone
    }
    return milestone;
  } catch (error) {
    console.error(`Error finding or creating milestone: ${error.message}`);
    throw error; // Rethrow the error to be handled in the calling function
  }
}

// Function to check if the new score is a new high score
function isNewHighScore(newStat, currentStat, statType) {
  try {
    // If there's no current stat, this is automatically a new high score
    if (!currentStat) {
      return true;
    }

    // Get the actual numeric values to compare
    const newValue = parseFloat(newStat[statType]) || 0;
    const currentValue = parseFloat(currentStat[statType]) || 0;
    
    // New score is a high score if it's greater than the current score
    return newValue > currentValue;
  } catch (error) {
    console.error(`Error checking for new high score: ${error.message}`);
    return false; // Return false to indicate an error occurred
  }
}

// Function to create and save a notification for a new high score
async function createAndSaveNotification(userId, category, statType, newStat) {
  try {
    // Check user's notification settings before creating notification
    const User = require('../models/user');
    const user = await User.findById(userId).select('notificationSettings');
    
    // Default to enabled if no settings exist
    const notificationSettings = user?.notificationSettings || { milestones: true };
    
    // Only create notification if user has milestones enabled
    if (!notificationSettings.milestones) {
      console.log(`Milestone notification skipped for User ${userId} - disabled in settings`);
      return;
    }

    // Create a notification
    const notification = new Notification({
      userId: userId,
      data: {
        category: category,
        type: statType,
        dateTitle: newStat['dateTitle'],
        value: newStat[statType],
        message: "Milestone!" // Simple message that doesn't give away details
      },
      type: 'newMilestone',
      isViewed: false, // You can set this to false initially
    });

    // Save the notification
    await notification.save();

    console.log(`Notification created for User ${userId} - New High Score: ${JSON.stringify(newStat)}`);
  } catch (error) {
    console.error(`Error creating notification: ${error.message}`);
  }
}

// Function to save the milestone document
async function saveMilestone(milestone) {
  await milestone.save();
}

module.exports = {updateAllHighScores};
