import React from "react";
import Styles from "./SideBarHeader.module.scss";
const flintLogo = require("../../../media/logos/flint_logo.png");

const SideBarHeader = (props) => {

    return (
        <div className={Styles.wrapper}>
            <img className={Styles.logo} src={flintLogo} alt="logo"/>
        </div>
    );
}

export default SideBarHeader;