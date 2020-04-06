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
    const [newListings, setNewListings] = useState([]);



    useEffect(() => {
        getInventoryItems();
        if (user.syncedWithEbay) {
            //need to rename this and handle all ebay data not just listings.
            getNewListings();
        }
        // login({ email: "test@test.com", password: "test" })

    }, [user])


    const login = (credentials) => {
        return authAxios.post("/auth/login", credentials)
            .then(async (response) => {
                const { user, user: { token } } = response.data;

                localStorage.setItem("user", JSON.stringify(user))
                localStorage.setItem("token", token)
                setUser(user);

                return response;
            })
    }

    async function syncWithEbay() {
        try {
            const linkData = await userAxios.get("/api/syncebay/gettokenlink");
            const link = linkData.data;
            window.location=link;
        } catch (err) {
            console.log(err)
            return null
        }
    }

    const logout = () => {
        localStorage.removeItem("user");
        localStorage.removeItem("token");
        setUser({});
    }

    function submitNewItem(form) {
        userAxios.post("/api/inventoryItems", form)
            .then(result => {
                console.log(result.data)
                changeItems([...items, result.data.item])
            })
            .catch(err => console.log(err))
    }

    function getInventoryItems() {
        userAxios.get("/api/inventoryItems")
            .then(result => changeItems(result.data))
    }

    function linkItem(inventoryId, listingInfo) {
        userAxios.put(`/api/syncebay/linkItem/${inventoryId}`, listingInfo).then(result => {
            const success = result.data.success

            if (success) {
                const updatedItem = result.data.updatedItem;
                console.log(updatedItem)
                //Need to learn how to useReducer
                changeItems(items.map(x => x._id === updatedItem._id ? updatedItem : x));
                setNewListings(newListings.filter(x => x.ebayId != listingInfo.ItemID));
            } else {
                alert("Something went wrong! Item not linked.")
            }

        }

        )

    }

    function getNewListings() {
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
            getNewListings,
            newListings,
            linkItem,
            syncWithEbay
        }} >
            {props.children}
        </storeContext.Provider >
    )
}

export default Store
