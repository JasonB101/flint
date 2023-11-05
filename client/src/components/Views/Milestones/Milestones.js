import React, { useEffect, useState } from "react";
import Styles from "./Milestones.module.scss";
import CreateReport from "./CreateReport";
import DisplayCongrats from "../../Notifications/DisplayCongrats/DisplayCongrats"

const Milestones = (props) => {
    const {items, checkNewScores} = props
    const report = CreateReport(items, true, 2023) //Manually set to this year
    const [prepObject, changePrepObject] = useState({
        day:{
            listed: {}, //Entry that has 'listed' in competition array
            sold: {}, //Entry that has 'sold' in competition array
            pulled: {}, //Entry that has 'pulled' in competition array
            sales: {}, //Entry that has 'sales' in competition array
            spent: {}
        },
        week:{
            listed: {}, //Entry that has 'listed' in competition array
            sold: {}, //Entry that has 'sold' in competition array
            pulled: {}, //Entry that has 'pulled' in competition array
            sales: {}, //Entry that has 'sales' in competition array
            spent: {}
        },
        month:{
            listed: {}, //Entry that has 'listed' in competition array
            sold: {}, //Entry that has 'sold' in competition array
            pulled: {}, //Entry that has 'pulled' in competition array
            sales: {}, //Entry that has 'sales' in competition array
            spent: {}
        },

    })
    
        
    

    useEffect(() => {
        let tempObject = {...prepObject}
        for (let category in report){
            for (let date in report[category]){
                let competitions = report[category][date]['competition']
                competitions.forEach(winningStat => {
                    let newObject = report[category][date]
                    newObject.dateTitle = date
                    tempObject[category][winningStat] = newObject
                })
            }
        }

  if (tempObject.day.sold.sold) {
    checkNewScores(tempObject);
  }
               console.log(JSON.stringify(tempObject))
        changePrepObject(tempObject)

    }, [])

    
    let content = (
        <div className={Styles.wrapper}>
      <h1>Milestones</h1>
      <div className={Styles.stats_wrapper}>
        <div className={Styles['sub-section']}>
          <h4>Day</h4>
          <ul>
            <li className={Styles['list-item']}>
              <span>Purchased: <strong>{prepObject.day.pulled.pulled}</strong></span>
              <span>{prepObject.day.pulled.dateTitle}</span>
            </li>
            <li className={Styles['list-item']}>
              <span>Sold: <strong>{prepObject.day.sold.sold}</strong></span>
              <span>{prepObject.day.sold.dateTitle}</span>
            </li>
            <li className={Styles['list-item']}>
              <span>Profit: <strong>{formatCurrency(prepObject.day.sales.sales)}</strong></span>
              <span>{prepObject.day.sales.dateTitle}</span>
            </li>
            <li className={Styles['list-item']}>
              <span>Spent: <strong>{formatCurrency(prepObject.day.spent.spent)}</strong></span>
              <span>{prepObject.day.spent.dateTitle}</span>
            </li>
            <li className={Styles['list-item']}>
              <span>Listed: <strong>{prepObject.day.listed.listed}</strong></span>
              <span>{prepObject.day.listed.dateTitle}</span>
            </li>
          </ul>
        </div>

        <div className={Styles['sub-section']}>
          <h4>Week</h4>
          <ul>
            <li className={Styles['list-item']}>
              <span>Purchased: <strong>{prepObject.week.pulled.pulled}</strong></span>
              <span>{prepObject.week.pulled.dateTitle}</span>
            </li>
            <li className={Styles['list-item']}>
              <span>Sold: <strong>{prepObject.week.sold.sold}</strong></span>
              <span>{prepObject.week.sold.dateTitle}</span>
            </li>
            <li className={Styles['list-item']}>
              <span>Profit: <strong>{formatCurrency(prepObject.week.sales.sales)}</strong></span>
              <span>{prepObject.week.sales.dateTitle}</span>
            </li>
            <li className={Styles['list-item']}>
              <span>Spent: <strong>{formatCurrency(prepObject.week.spent.spent)}</strong></span>
              <span>{prepObject.week.spent.dateTitle}</span>
            </li>
            <li className={Styles['list-item']}>
              <span>Listed: <strong>{prepObject.week.listed.listed}</strong></span>
              <span>{prepObject.week.listed.dateTitle}</span>
            </li>
          </ul>
        </div>

        <div className={Styles['sub-section']}>
          <h4>Month</h4>
          <ul>
            <li className={Styles['list-item']}>
              <span>Purchased: <strong>{prepObject.month.pulled.pulled}</strong></span>
              <span>{prepObject.month.pulled.dateTitle}</span>
            </li>
            <li className={Styles['list-item']}>
              <span>Sold: <strong>{prepObject.month.sold.sold}</strong></span>
              <span>{prepObject.month.sold.dateTitle}</span>
            </li>
            <li className={Styles['list-item']}>
              <span>Profit: <strong>{formatCurrency(prepObject.month.sales.sales)}</strong></span>
              <span>{prepObject.month.sales.dateTitle}</span>
            </li>
            <li className={Styles['list-item']}>
              <span>Spent: <strong>{formatCurrency(prepObject.month.spent.spent)}</strong></span>
              <span>{prepObject.month.spent.dateTitle}</span>
            </li>
            <li className={Styles['list-item']}>
              <span>Listed: <strong>{prepObject.month.listed.listed}</strong></span>
              <span>{prepObject.month.listed.dateTitle}</span>
            </li>
          </ul>
        </div>
      </div>
      <DisplayCongrats/>
    </div>
      );
      
      function formatCurrency(amount = 0) {
        return amount.toLocaleString("en-US", { style: "currency", currency: "USD" });
      }

return content
}

export default Milestones