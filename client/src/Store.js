import React, { createContext, useState, useEffect } from 'react'
import axios from "axios"
const authAxios = axios.create()
const userAxios = axios.create()
export const storeContext = createContext({});

userAxios.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    config.headers.Authorization = `Bearer ${token}`;
    return config;
})



const Store = (props) => {
    //change initial value of user to empty object
    const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')) || {})
    const [items, changeItems] = useState([
        {
            item: "2007 Ford Focus Radio",
            partNo: "1234",
            sku: "1234",
            location: "Shelf A",
            datePurchased: new Date().toDateString(),
            purchasePrice: 9.99,
            listed: false,
            listedPrice: 0,
            expectedProfit: 0,
            id: 1234
        },
        {
            item: "2007 Ford Focus Radio",
            partNo: "1234",
            sku: "1234",
            location: "Shelf A",
            datePurchased: new Date().toDateString(),
            purchasePrice: 9.99,
            listed: false,
            listedPrice: 0,
            expectedProfit: 0,
            id: 1234
        },


    ])



    useEffect(() => {
        localStorage.setItem('user', JSON.stringify({ user: { token: "Here" } }))
    }, [user])


    const login = (credentials) => {
        return authAxios.post("/auth/login", credentials)
            .then(response => {
                const { user, user: { token } } = response.data;
                localStorage.setItem("user", JSON.stringify(user))
                localStorage.setItem("token", token)
                setUser(user);
                return response;
            })
    }

    const logout = () => {
        localStorage.removeItem("user");
        localStorage.removeItem("token");
        setUser({});
    }

    return (

        <storeContext.Provider value={{
            user,
            items,
        }} >
            {props.children}
        </storeContext.Provider >
    )
}

export default Store
