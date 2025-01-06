const express = require("express");
const expenseRouter = express.Router();
const Expense = require("../models/expense");

expenseRouter.post("/addExpense", (req, res, next) => {
    const userId = req.auth._id;
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
    const expenses = Expense.find({userId: req.auth._id}, (err, expenses) => {
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

expenseRouter.delete("/:id", (req, res, next) => {
    const userId = req.auth._id;
    Expense.findOneAndDelete({ _id: req.params.id, userId: userId }, (err, expense) => {
      if (err) {
        console.log(err);
        return res.status(500).send({success: false});
      }
      if (!expense) {
        return res.status(404).send({
          success: false,
          message: "Expense not found or does not belong to this user",
        });
      }
      return res.send({ success: true });
    });
  });

module.exports = expenseRouter;