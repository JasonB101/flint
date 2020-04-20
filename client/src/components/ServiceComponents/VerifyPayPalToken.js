import React, {useEffect} from "react";
import { withRouter } from 'react-router-dom';

const VerifyUserToken = (props) => {
    const {setPayPalToken} = props;
    useEffect(() => {
        props.history.push("/inventory")
        setPayPalToken();
    }, [setPayPalToken, props.history])

    return (
        <div></div>
    );
}

export default withRouter(VerifyUserToken);