
const express = require("express")
const keywordHunterRouter = express.Router()// POST route to update milestones
// keywordHunterRouter.post("/updateMilestones", async (req, res, next) => {
//   try {
//     const userId = req.auth._id
//     const newScores = req.body // Assuming you send the new scores in the request body

//     // Call the function to update all high scores
//     await updateAllHighScores(userId, newScores)

//     res.status(200).send({ success: true, message: "Milestones updated successfully" })
//   } catch (error) {
//     console.error(error)
//     res.status(500).send({ success: false, error: "Failed to update Milestones" })
//   }
// })

module.exports = keywordHunterRouter