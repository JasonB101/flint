import React from "react";
import Styles from "./SideBar.module.scss";
import { Button } from "react-bootstrap";
import SideBarHeader from "./SideBarHeader/SideBarHeader";
import NavBar from "./NavBar/NavBar";



const SideBar = (props) => {

    const { syncWithEbay, user } = props;

    return (
        <div className={Styles.wrapper}>
            <SideBarHeader user={user} />


            {user?.token && <>
                <NavBar fname={user.fname} />
                <div className="spacer"></div>
                {
                    !user.syncedWithEbay &&
                    <div className={Styles.syncWrapper}>
                        <Button onClick={() => syncWithEbay()}>Sync with eBay</Button>
                    </div>
                }
            </>}

        </div>
    );
};

export default SideBar;