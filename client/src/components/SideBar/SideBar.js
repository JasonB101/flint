import React from "react";
import Styles from "./SideBar.module.scss";
import { Button } from "react-bootstrap";
import SideBarHeader from "./SideBarHeader/SideBarHeader";
import NavBar from "./NavBar/NavBar";



const SideBar = (props) => {

    const { syncWithEbay, syncWithPayPal, user, login, importItemsFromCVS } = props;

    return (
        <div className={Styles.wrapper}>
            <SideBarHeader login={login} />
            <NavBar />
            <div className="spacer"></div>
            {
                !user.syncedWithEbay &&
                <div className={Styles.syncWrapper}>
                    <Button onClick={() => syncWithEbay()}>Sync with eBay</Button>
                    <p>Sync your Flint account with your eBay account.</p>
                </div>
            }
            <br></br>
            {
                !user.syncedWithPayPal &&
                <div className={Styles.syncWrapper}>
                    <Button onClick={() => syncWithPayPal()}>Sync with PayPal</Button>
                    <p>Sync your Flint account with your PayPal account.</p>
                </div>
            }
            <h3>Import CSV File</h3>
            <input type="file" id="fileInput" onChange={(e) => importItemsFromCVS(e.target.files[0])}></input>

        </div>
    );
}

export default SideBar;