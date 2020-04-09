import React from "react";
import Styles from "./Toolbar.module.scss";

const Toolbar = (props) => {
    const { searchTerm, changeSearchTerm } = props;

    return (
        <div className={Styles.wrapper}>
            <input onChange={(e) => changeSearchTerm(e.target.value)}
                type="text"
                value={searchTerm}
                placeholder={"Search Sold Items"} />
            <div className="spacer"></div>
        </div>
    );
}

export default Toolbar;