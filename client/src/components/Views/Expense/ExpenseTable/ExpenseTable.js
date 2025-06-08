import React, { useEffect } from "react"
import Styles from "./ExpenseTable.module.scss"
import { Table } from "react-bootstrap"
import $ from "jquery"
import ExpenseOptions from "./ExpenseOptions/ExpenseOptions"

const ExpenseTable = (props) => {
  const { expenses, deleteExpense, onEditExpense } = props
  const currencyFormatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  })

  useEffect(() => {
    applySortingToDOM()
  }, [expenses])

  const expenseList = expenses.map((x) => populateRow(x))

  function applySortingToDOM() {
    //borrowed from stackoverflow added some sugar
    $("th").click(function () {
      var table = $(this).parents("table").eq(0)
      var rows = table
        .find("tr:gt(0)")
        .toArray()
        .sort(comparer($(this).index()))
      this.asc = !this.asc
      if (!this.asc) {
        rows = rows.reverse()
      }
      for (var i = 0; i < rows.length; i++) {
        table.append(rows[i])
      }
    })
    function comparer(index) {
      return function (a, b) {
        var valA = getCellValue(a, index),
          valB = getCellValue(b, index)
        if (String(valA).includes("/")) {
          valA = dateToTime(valA)
          valB = dateToTime(valB)
        }
        //Strips commas and dollar sign off of numbers.
        valA = valA.replace(/\$|%|,/g, "")
        valB = valB.replace(/\$|%|,/g, "")

        function dateToTime(value) {
          return String(new Date(value).getTime())
        }
        return $.isNumeric(valA) && $.isNumeric(valB)
          ? valA - valB
          : valA.toString().localeCompare(valB.toString())
      }
    }
    function getCellValue(row, index) {
      return $(row).children("td").eq(index).text()
    }
  }

  function populateRow(expenseObject) {
    const { title, date, _id, amount, category } = expenseObject
    return (
      <tr key={_id}>
        <td className={Styles["titleTd"]}>
          <span className={Styles["expense-options"]}>
            <ExpenseOptions 
              deleteExpense={deleteExpense} 
              expenseId={_id} 
              onEdit={onEditExpense}
              expense={expenseObject}
            />
          </span>{" "}
          {title}
        </td>
        <td className={Styles["categoryTd"]}>
          <span>{category || 'Other'}</span>
        </td>
        <td>{date}</td>
        <td>{currencyFormatter.format(amount)}</td>
      </tr>
    )
  }
  return (
    <div className={Styles.wrapper}>
      {expenses.length === 0 ? (
        <div className={Styles.emptyState}>
          <div className={Styles.emptyIcon}>📋</div>
          <h3>No expenses found</h3>
          <p>Start by adding your first expense using the button above</p>
        </div>
      ) : (
        <Table striped bordered responsive hover>
          <thead>
            <tr>
              <th>Title</th>
              <th>Category</th>
              <th>Date of Expense</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody className={Styles.expenseList}>{expenseList}</tbody>
        </Table>
      )}
    </div>
  )
}

export default ExpenseTable
