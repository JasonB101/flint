import React from "react";
import Styles from "./SalesChart.module.scss";
import CanvasJSReact from "../../../../assets/canvasjs.react";

const {CanvasJS, CanvasJSChart} = CanvasJSReact;

const SalesChart = (props) => {
    const {options} = props;
    
    return (
        <div className={Styles.wrapper}>
        <CanvasJSChart options = {options}/>
        </div>
    );
}

export default SalesChart;