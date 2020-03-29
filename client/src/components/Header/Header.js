import React from "react";
import Styles from "./Header.module.scss";

const Header = (props) => {
    const hasNotification = false;
    return (
        <div className={Styles.wrapper}>
           <div className="spacer"></div>
           {    hasNotification ? 
               <i style={{color: "rgb(247, 126, 126)"}} className="material-icons">notifications_active</i> :
               <i className="material-icons">notifications</i>
           }
        </div>
    );
}

export default Header;