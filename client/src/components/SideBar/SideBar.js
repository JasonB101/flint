import React from "react";
import Styles from "./SideBar.module.scss";
import SideBarHeader from "./SideBarHeader/SideBarHeader";
import NavBar from "./NavBar/NavBar";
import { Button } from "react-bootstrap";



const SideBar = (props) => {
    const { syncEbay } = props;
    return (
        <div className={Styles.wrapper}>
            <SideBarHeader />
            <NavBar />
            <div className="spacer"></div>
            <Button onClick={() => syncEbay()}>Sync eBay</Button>
        </div>
    );
}

export default SideBar;