import React, {useEffect} from "react";
import { withRouter } from 'react-router-dom';

const VerifyOAuthCode = (props) => {
    const {sendOAuthCode} = props;
    useEffect(() => {
        setEbayToken();
        
        props.history.push("/inventory")
    }, [setEbayToken, props.history])

    return (
        <div></div>
    );
}

export default withRouter(VerifyUserToken);