import React, { createContext, useState, useEffect } from 'react';
import axios from "axios";
import prepItemsForImport from "./lib/massImportPrep"
import readFile from "./lib/readAndParseCVS";
const authAxios = axios.create();
const userAxios = axios.create();
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
    const [expenses, setExpenses] = useState([]);
    const [ebayListings, setEbayListings] = useState([])
    const [newListings, setNewListings] = useState(sortNewListings());



    useEffect(() => {
        if (user.token) {
            getInventoryItems();
            getExpenses();
            if (user.syncedWithEbay) {
                getEbay();
            }
        }
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


    const logout = () => {
        localStorage.removeItem("user");
        localStorage.removeItem("token");
        setUser({});
    }

    async function submitNewItem(form) {
        userAxios.post("/api/inventoryItems", form)
            .then(result => {
                changeItems([...items, result.data.item])
                return true;
            })
            .catch(err => {
                console.log(err)
                return false;
            })
    }
    function submitMassImport(form) {
        userAxios.post("/api/inventoryItems//massImport", form)
            .then(result => {
                changeItems([...items, result.data.item])
            })
            .catch(err => console.log(err))
    }

    function submitNewExpense(form) {
        userAxios.post("/api/expense/addexpense", form)
            .then(result => {
                setExpenses([...expenses, result.data.expense])
            })
            .catch(err => console.log(err))
    }

    function getInventoryItems() {
        userAxios.get("/api/inventoryItems")
            .then(result => changeItems(result.data))
    }
    function getExpenses() {
        userAxios.get("/api/expense")
            .then(result => {
                setExpenses(result.data)
            })
    }

    function linkItem(inventoryId, listingInfo) {
        userAxios.put(`/api/ebay/linkItem/${inventoryId}`, listingInfo).then(result => {
            const success = result.data.success

            if (success) {
                const updatedItem = result.data.updatedItem;
                console.log(updatedItem)
                //Need to learn how to useReducer
                changeItems(items.map(x => x._id === updatedItem._id ? updatedItem : x));
                setNewListings(newListings.filter(x => x.ebayId !== listingInfo.ItemID));
            } else {
                alert("Something went wrong! Item not linked.")
            }

        }

        )

    }
    async function syncWithEbay() {
        try {
            const linkData = await userAxios.get("/api/syncebay/gettokenlink");
            const link = linkData.data;
            window.location = link;
        } catch (err) {
            console.log(err)
            return null
        }
    }

    async function syncWithPayPal() {
        //Eventually this will be a Permissions Flow, for right now, its only 1st person capable
        //Wish eBay would fix their ish 
        setPayPalToken()
    }


    function setEbayToken() {
        userAxios.post("/api/syncebay/setebaytoken")
            .then(results => {
                const data = results.data
                if (data.success) {
                    setUser(data.user)
                }
            })

    }
    function setEbayOAuthToken(authCode) {
        userAxios.post("/api/syncebay/setebayoauthtoken", {authCode})
            .then(results => {
                getEbay();
            })
    }

    function setPayPalToken() {
        userAxios.get("/api/syncpaypal/setAccessToken")
            .then(results => {
                const data = results.data
                if (data.success) {
                    setUser(data.user)
                }
            })

    }

    function getEbay() {
        userAxios.get("/api/ebay/getebay")
            .then(result => {
                const data = result.data;
                const { ebayListings, inventoryItems } = data;
                changeItems(inventoryItems);
                setEbayListings(ebayListings);
            })
            .catch(err => console.log(err))
    }

    async function importItemsFromCVS(file) {
        let items = await readFile(file);
        let preppedItems = prepItemsForImport(items);
        preppedItems.forEach(x => submitMassImport(x));
    }

    function sortNewListings(){
        const ebayIds = items.map(x => x.ebayId);
        const newEbayListings = ebayListings.filter(x => {
            return ebayIds.indexOf(x.ItemID) === -1
        });
        return newEbayListings;
    }

    return (

        <storeContext.Provider value={{
            user,
            items,
            submitNewItem,
            submitNewExpense,
            newListings,
            linkItem,
            syncWithEbay,
            syncWithPayPal,
            setPayPalToken,
            setEbayToken,
            login,
            expenses,
            importItemsFromCVS,
            logout,
            ebayListings
        }} >
            {props.children}
        </storeContext.Provider >
    )
}

export default Store
