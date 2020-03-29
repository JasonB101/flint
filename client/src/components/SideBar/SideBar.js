import React from "react";
import Styles from "./SideBar.module.scss";
import SideBarHeader from "./SideBarHeader/SideBarHeader";
import NavBar from "./NavBar/NavBar";



const SideBar = (props) => {

    return (
        <div className={Styles.wrapper}>
            <SideBarHeader />
            <NavBar />
        </div>
    );
}

export default SideBar;