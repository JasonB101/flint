import React from "react"
import { NavLink } from "react-router-dom"
import Styles from "./NavBar.module.scss"
import Menu from "./Menu/Menu"

const NavBar = ({fname}) => {
  const navMenu = {
    items: {
      title: "Items",
      subMenu: [
        <NavLink
          key="inventory"
          to="/inventory"
          activeStyle={{
            backgroundColor: "#353a42",
          }}
        >
          Inventory<div className="spacer"></div>
        </NavLink>,
        <NavLink
          key="sold"
          to="/reports/solditems"
          activeStyle={{
            backgroundColor: "#353a42",
          }}
        >
          Sold<div className="spacer"></div>
        </NavLink>,
        <NavLink
          key="returns"
          to="/reports/returns"
          activeStyle={{
            backgroundColor: "#353a42",
          }}
        >
          Returns<div className="spacer"></div>
        </NavLink>,
      ],
    },
    reports: {
      title: "Reports",
      subMenu: [
        <NavLink
          key="sales"
          to="/reports/sales"
          activeStyle={{
            backgroundColor: "#353a42",
          }}
        >
          Sales<div className="spacer"></div>
        </NavLink>,
        <NavLink
          key="sourcing"
          to="/reports/sourcing"
          activeStyle={{
            backgroundColor: "#353a42",
          }}
        >
          Sourcing<div className="spacer"></div>
        </NavLink>,
        <NavLink
          key="listing"
          to="/reports/listing"
          activeStyle={{
            backgroundColor: "#353a42",
          }}
        >
          Listing<div className="spacer"></div>
        </NavLink>,
        <NavLink
          key="milestones"
          to="/reports/milestones"
          activeStyle={{
            backgroundColor: "#353a42",
          }}
        >
          Milestones<div className="spacer"></div>
        </NavLink>,
        <NavLink
          key="overview"
          to="/reports/overview"
          activeStyle={{
            backgroundColor: "#353a42",
          }}
        >
          Overview<div className="spacer"></div>
        </NavLink>,
      ],
    },
    tools: {
      title: "Tools",
      subMenu: [
        <NavLink
          key="churn"
          to="/churn"
          activeStyle={{
            backgroundColor: "#353a42",
          }}
        >
          Churn<div className="spacer"></div>
        </NavLink>,
        <NavLink
          key="carparthunter"
          to="/car-parthunter"
          activeStyle={{
            backgroundColor: "#353a42",
          }}
        >
          Part Hunter<div className="spacer"></div>
        </NavLink>,
        <NavLink
          key="parthunter"
          to="/parthunter"
          activeStyle={{
            backgroundColor: "#353a42",
          }}
        >
          eBay Hunter
        </NavLink>,
      ],
    },
  }

  return (
    <div className={Styles.wrapper}>
      <Menu id="items" {...navMenu.items} />
      <NavLink
        to="/expenses"
        activeStyle={{
          backgroundColor: "#353a42",
        }}
      >
        Expenses
      </NavLink>
      <Menu id="reports" {...navMenu.reports} />
      <Menu id="tools" {...navMenu.tools} />
      <div className="spacer"></div>
    </div>
  )
}

export default NavBar
