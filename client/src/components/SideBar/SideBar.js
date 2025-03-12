import React from "react";
import Styles from "./SideBar.module.scss";
import { Button } from "react-bootstrap";
import SideBarHeader from "./SideBarHeader/SideBarHeader";
import NavBar from "./NavBar/NavBar";



const SideBar = (props) => {

    const { syncWithEbay, user, importItemsFromCVS } = props;

    return (
        <div className={Styles.wrapper}>
            <SideBarHeader />


            {user?.token && <>
                <NavBar fname={user.fname} />
                <div className="spacer"></div>
                {
                    !user.syncedWithEbay &&
                    <div className={Styles.syncWrapper}>
                        <Button onClick={() => syncWithEbay()}>Sync with eBay</Button>
                        <p>Sync your Flint account with your eBay account.</p>
                    </div>
                }
                {/* <div className={Styles.cvsImportBox}>
                    <h5>Import CSV File</h5>
                    <input type="file" id="fileInput" onChange={(e) => importItemsFromCVS(e.target.files[0])}></input>
                </div> */}

            </>}

        </div>
    );
}

export default SideBar;