import React from "react";
import Styles from "./SideBar.module.scss";
import { Button } from "react-bootstrap";
import SideBarHeader from "./SideBarHeader/SideBarHeader";
import NavBar from "./NavBar/NavBar";



const SideBar = (props) => {

    const { syncWithEbay, user } = props;

    function handleClick(e) {
        syncWithEbay();
    }

    return (
        <div className={Styles.wrapper}>
            <SideBarHeader />
            <NavBar />
            <div className="spacer"></div>
            {
                !user.syncedWithEbay &&
                <div className={Styles.syncWrapper}>
                    <Button onClick={handleClick}>Sync with eBay</Button>
                    <p>Sync your Flint account with your eBay account.</p>
                </div>
            }

        </div>
    );
}

export default SideBar;