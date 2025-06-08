import React from "react";
import Styles from "./Menu.module.scss";

const Menu = (props) => {
    const { title, subMenu, id } = props;
    
    function toggleSubMenu(e){
        let menuTitle = document.querySelector(`#${id} > p`);
        let subMenu = document.querySelector(`#${id} > #subMenu`);

        if (subMenu.classList.contains(Styles.subMenuOpen)){
            subMenu.classList = `${Styles.subMenu} ${Styles.subMenuClosed}`;
            menuTitle.classList.remove(Styles.menuOpen);
        } else {
            subMenu.classList = `${Styles.subMenu} ${Styles.subMenuOpen}`;
            menuTitle.classList.add(Styles.menuOpen);
        }
    }

    return (
        <div id={id} className={Styles.wrapper}>
                <p onClick={toggleSubMenu}>
                    {title}
                </p>
            <div id="subMenu" className={Styles.subMenuClosed}>
                {subMenu}
            </div>
        </div>
    );
}

export default Menu;