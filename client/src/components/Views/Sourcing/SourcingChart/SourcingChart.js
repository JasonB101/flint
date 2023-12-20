import React from "react";
import Styles from "./SourcingChart.module.scss";
import CanvasJSReact from "../../../../assets/canvasjs.react";

const {CanvasJS, CanvasJSChart} = CanvasJSReact;

const SouricngChart = (props) => {
    const {options} = props;
    
    return (
        <div className={Styles.wrapper}>
        <CanvasJSChart options = {options}/>
        </div>
    );
}

export default SouricngChart;