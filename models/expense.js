const mongoose = require("mongoose")
const Schema = mongoose.Schema

const expenseSchema = new Schema({
   date: String,
   title: String,
   amount: Number,
   category: {
       type: String,
       required: true,
       enum: ['Travel', 'Food', 'Shipping', 'Equipment', 'Software', 'Legal', 'Environmental', 'Core', 'Waste', 'Taxes', 'Other'],
       default: 'Other'
   },
   userId: {
    type: Schema.Types.ObjectId, 
    ref: 'User',
    required: true,
},
})

module.exports = mongoose.model("Expense", expenseSchema)
