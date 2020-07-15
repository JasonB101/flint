import React from "react";
import { NavLink } from "react-router-dom";
import Styles from "./NavBar.module.scss";
import Menu from "./Menu/Menu";

const NavBar = (props) => {

    const navMenu = {
        reports: {
            title: "Reports",
            subMenu: [
                <NavLink
                    key="sales"
                    to="/reports/sales"
                    activeStyle={{
                        backgroundColor: "#353a42"
                    }}>Sales<div className="spacer"></div>
                </NavLink>,
                <NavLink
                    key="sold"
                    to="/reports/solditems"
                    activeStyle={{
                        backgroundColor: "#353a42"
                    }}>Sold Items<div className="spacer"></div>
                </NavLink>,
                <NavLink
                    key="milestones"
                    to="/reports/milestones"
                    activeStyle={{
                        backgroundColor: "#353a42"
                    }}>Milestones<div className="spacer"></div>
                </NavLink>
            ]
        },

    }

    return (
        <div className={Styles.wrapper}>
            <NavLink to="/inventory"
                activeStyle={{
                    backgroundColor: "#353a42"
                }}>Inventory</NavLink>
            <NavLink to="/expenses"
                activeStyle={{
                    backgroundColor: "#353a42"
                }}>Expenses</NavLink>
            <Menu id="reports" {...navMenu.reports} />
        </div>
    );
}

export default NavBar;