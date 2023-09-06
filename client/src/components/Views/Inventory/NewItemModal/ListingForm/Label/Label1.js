import React from "react"
import Styles from "./Label.module.scss"

// Create Document Component
function Label({labelInfo}) {
    let { sku, year, make, model } = labelInfo
    return (
       <iframe className={Styles.frame}>
           <input type="text" placeholder="SKU"/>
           <input type="text"/>
       </iframe>
    );
}
export default Label;


