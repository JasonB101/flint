import React, {useEffect} from "react";
import { withRouter } from 'react-router-dom';

const VerifyUserToken = (props) => {
    const {setEbayToken} = props;
    useEffect(() => {
        props.history.push("/inventory")
        setEbayToken();
    }, [setEbayToken, props.history])

    return (
        <div></div>
    );
}

export default withRouter(VerifyUserToken);