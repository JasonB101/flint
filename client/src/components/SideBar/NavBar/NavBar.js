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
                    to="/reports/sold"
                    activeStyle={{
                        backgroundColor: "#353a42"
                    }}>Sold<div className="spacer"></div>
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
            <NavLink to="/feedback"
                activeStyle={{
                    backgroundColor: "#353a42"
                }}>Leave Feeback</NavLink>
        </div>
    );
}

export default NavBar;