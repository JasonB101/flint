import React from "react";
import Styles from "./SideBarHeader.module.scss";
const flintLogo = require("../../../media/logos/flint_logo.png");

const SideBarHeader = (props) => {
    const {login} = props
    return (
        <div className={Styles.wrapper}
        onClick={() =>  login({ email: "jason.brown91@outlook.com", password: "Wtf10101" })}>
            <img className={Styles.logo} src={flintLogo} alt="logo"/>
        </div>
    );
}

export default SideBarHeader;