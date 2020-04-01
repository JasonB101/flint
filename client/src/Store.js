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
    const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')) || {});
    const [items, changeItems] = useState([]);
    
    const [newListings, setNewListings] = useState([])



    useEffect(() => {
        getInventoryItems();
        syncEbay();
    }, [user])


    const login = async (credentials) => {
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
    
    function submitNewItem(form) {
        userAxios.post("/api/inventoryItems", form)
    }

    function getInventoryItems(){
        userAxios.get("/api/inventoryItems")
        .then(result => changeItems(result.data))
    }

    function linkItem(inventoryId, ebayId) {
        
    }

    function syncEbay() {
        userAxios.get("/api/syncebay/getNewListings")
        .then(result => {
            setNewListings(result.data)
            // console.log(result.data)
        })
        .catch(err => console.log(err));
    }

    return (

        <storeContext.Provider value={{
            user,
            items,
            submitNewItem,
            syncEbay,
            newListings,
            linkItem
        }} >
            {props.children}
        </storeContext.Provider >
    )
}

export default Store
