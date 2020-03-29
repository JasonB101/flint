import React from "react";
import Styles from "./Menu.module.scss";

const Menu = (props) => {
    const { title, subMenu, id } = props;
    
    function toggleSubMenu(e){
        let arrowIcon = document.querySelector(`#${id} > p > .material-icons`);
        let subMenu = document.querySelector(`#${id} > #subMenu`);

        if (arrowIcon.textContent === "keyboard_arrow_up"){
            arrowIcon.textContent = "keyboard_arrow_down";
            subMenu.classList = `${Styles.subMenu} ${Styles.subMenuClosed}`
        } else {
            arrowIcon.textContent = "keyboard_arrow_up";
            subMenu.classList = `${Styles.subMenu} ${Styles.subMenuOpen}`
        }

    }

    return (
        <div id={id} className={Styles.wrapper}>
                <p onClick={toggleSubMenu}>
                    {title}
                    <span className="spacer"></span>
                    <i className="material-icons">keyboard_arrow_down</i>
                </p>
            <div id="subMenu" className={Styles.subMenuClosed}>
                {subMenu}
            </div>
        </div>
    );
}

export default Menu;