import React from "react"
import { Route, Redirect } from "react-router-dom";

function ProtectedRoute(props) {
    const user = JSON.parse(localStorage.getItem('user')) || {};

    const { component: Component, ...rest } = props;
    return (
        user.token ?
            <Route {...rest} component={Component} /> :
            <Redirect to="/auth/signin" />
    )
}

export default ProtectedRoute;