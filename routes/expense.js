const express = require("express");
const expenseRouter = express.Router();
const Expense = require("../models/expense");

expenseRouter.post("/addExpense", (req, res, next) => {
    const userId = req.user._id;
    const newExpense = new Expense({
        ...req.body,
        userId
    })

    newExpense.save((err, expense) => {
        if (err) {
            console.log(err);
            return res.status(500).send({success: false, error: err})
        }
        if (expense){
            return res.send({success: true, expense})
        }
        return res.status(500).send({success: false})
    })
})

expenseRouter.get("/", (req, res, next) => {
    const expenses = Expense.find({userId: req.user._id}, (err, expenses) => {
        if (err){
            console.log(err)
            return res.status(500).send([])
        }
        if (expenses) {
            return res.send(expenses)
        }
        return res.send([])
    });
})
module.exports = expenseRouter;