import React from "react";
import Styles from "./SideBarHeader.module.scss";
const flintLogo = require("../../../media/logos/bluebook.png");

const SideBarHeader = (props) => {
    return (
        <div className={Styles.wrapper}>
            <div>
                <img className={Styles.logo} src={flintLogo} alt="logo" />
                <h1>flintbooks</h1>
            </div>

        </div>
    );
}

export default SideBarHeader;