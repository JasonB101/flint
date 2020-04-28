const mongoose = require("mongoose")
const Schema = mongoose.Schema

const expenseSchema = new Schema({
   date: String,
   title: String,
   amount: Number,
   userId: {
    type: Schema.Types.ObjectId, 
    ref: 'User',
    required: true,
},
})

module.exports = mongoose.model("Expense", expenseSchema)
