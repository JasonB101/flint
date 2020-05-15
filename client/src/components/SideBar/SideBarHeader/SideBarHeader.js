import React from "react";
import Styles from "./SideBarHeader.module.scss";
const flintLogo = require("../../../media/logos/bluebook.png");

const SideBarHeader = (props) => {
    const { login } = props
    return (
        <div className={Styles.wrapper}
            onClick={() => login({ email: "jason.brown91@outlook.com", password: "Wtf10101" })}>
            <div>
                <img className={Styles.logo} src={flintLogo} alt="logo" />
                <h1>flintbooks</h1>
            </div>

        </div>
    );
}

export default SideBarHeader;