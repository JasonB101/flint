import React from "react";
import Styles from "./SideBarHeader.module.scss";
const flintLogo = require("../../../media/logos/flint_logo.png");

const SideBarHeader = (props) => {
    const {login} = props
    return (
        <div className={Styles.wrapper}
        onClick={() =>  login({ email: "katers", password: "katers" })}>
            <img className={Styles.logo} src={flintLogo} alt="logo"/>
        </div>
    );
}

export default SideBarHeader;