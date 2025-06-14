import React from "react";
import { Button } from "react-bootstrap"
import Styles from "./Toolbar.module.scss";

const Toolbar = (props) => {
    const { toggleModal, searchTerm, changeSearchTerm } = props;

    return (
        <div className={Styles.wrapper}>
            <input onChange={(e) => changeSearchTerm(e.target.value)}
                type="text"
                value={searchTerm}
                placeholder={"Search by title, amount, or date..."} />
            <div className={Styles.spacer}></div>
            <Button onClick={() => toggleModal(true)}>Add New Expense</Button>
        </div>
    );
}

export default Toolbar;