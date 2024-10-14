import React, { createContext, useState, useEffect } from 'react'
import axios from "axios"
import prepItemsForImport from "./lib/massImportPrep"
import readFile from "./lib/readAndParseCVS"
const authAxios = axios.create()
const userAxios = axios.create()
export const storeContext = createContext({})

userAxios.interceptors.request.use((config) => {
    const token = localStorage.getItem("token")
    config.headers.Authorization = `Bearer ${token}`
    return config
})



const Store = (props) => {
    //change initial value of user to empty object
    const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')) || {})
    const [items, changeItems] = useState([])
    const [expenses, setExpenses] = useState([])
    const [ebayListings, setEbayListings] = useState([])
    const [newListings, setNewListings] = useState(sortNewListings())



    useEffect(() => {
        if (user.token) {
            getExpenses()
            if (user.syncedWithEbay && user.OAuthActive) {
                console.log("Made it")
                getEbay()
            } else {
                getInventoryItems()
            }
        }
    }, [user])


    const login = (credentials) => {
        return authAxios.post("/auth/login", credentials)
            .then(async (response) => {
                const { user, user: { token } } = response.data

                localStorage.setItem("user", JSON.stringify(user))
                localStorage.setItem("token", token)
                setUser(user)

                return response
            })
    }


    const logout = () => {
        localStorage.removeItem("user")
        localStorage.removeItem("token")
        setUser({})
    }

    async function checkNewScores(newScores) {
        console.log("Checking New Scores is Disabled")
        // try {
        //   // Call the backend API to initiate checking of new scores and pass the newScores data
        //   const response = await userAxios.post("/api/milestones/updateMilestones", newScores) 
      
        //   const { success } = response.data
      
        //   if (success === true) {
        //     // Handle success, e.g., display a success message
        //     console.log("New scores checked successfully")
        //     return true
        //   } else {
        //     // Handle failure, e.g., display an error message
        //     console.error("Checking new scores failed:", response.data.message)
        //     return false
        //   }
        // } catch (error) {
        //   // Handle error, e.g., display an error message or log the error
        //   console.error("Error checking new scores:", error)
        //   return false
        // }
      }
      

    async function updateItem(itemInfo) {
        userAxios.put("/api/inventoryItems/update", itemInfo)
            .then(result => {
                const { success } = result.data
                if (success === true) {
                    getInventoryItems()
                    return true
                } else {
                    alert(result.message)
                    return false
                }
            })
            .catch(err => {
                console.log(err)
                return false
            })
    }

    async function submitNewItem(form) {
        userAxios.post("/api/inventoryItems", form)
            .then(result => {
                changeItems([...items, result.data.item])
                return true
            })
            .catch(err => {
                console.log(err)
                return false
            })
    }

    async function getActiveListings(keyword) {
        try {
          const result = await userAxios.get(`/api/ebay/getactivelistings?keyword=${keyword}`);
          return result.data;
        } catch (error) {
          console.error('Error fetching active listings:', error);
          throw error; // Re-throw the error to handle it in the calling code if needed
        }
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
    function editInventoryItem(itemObject) {
        userAxios.put("/api/inventoryItems/editInventoryItem", itemObject)
            .then(result => {
               const updatedItems = items.map(item => item._id === itemObject.itemId ? {...item, ...itemObject} : item)
               changeItems(updatedItems)
            }).catch(err => {
                alert("An error has occured during the update")
                console.log(err.message)
            })
               
    }
    function updateUnlisted(ids) {
        userAxios.post("/api/inventoryItems/updateUnlisted", { ids: ids })
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
                const updatedItem = result.data.updatedItem
                console.log(updatedItem)
                //Need to learn how to useReducer
                changeItems(items.map(x => x._id === updatedItem._id ? updatedItem : x))
                setNewListings(newListings.filter(x => x.ebayId !== listingInfo.ItemID))
            } else {
                alert("Something went wrong! Item not linked.")
            }

        }

        )

    }
    async function syncWithEbay() {
        try {
            const linkData = await userAxios.get("/api/syncebay/gettokenlink")
            const link = linkData.data
            window.location = link
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

    function requestOAuthLink() {
        const requestLink = userAxios.get("/api/oauth/requesttoken")
            .then((result, err) => {
                if (err) alert(err.message)
                else {
                    const link = result.data
                    return link
                }
                return false
            })
    }

    async function setEbayOAuthTokens(authCode) {
        let result = await userAxios.post("/api/syncebay/setebayoauthtoken", { authCode })
        const { success, message } = result.data
        return { success, message }

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
        userAxios.get("/api/ebay/getebay", { timeout: 30000 })
            .then(result => {
                const data = result.data
                const { ebayListings = [], inventoryItems = [] } = data
                changeItems(inventoryItems)
                setEbayListings(ebayListings)
            })
            .catch(err => {
                if (err.response && err.response.status === 401) {
                    userAxios.post('/api/ebay/refreshOToken')
                        .then(result => {
                            localStorage.setItem("user", JSON.stringify({ ...user, OAuthActive: true }))
                            return userAxios.get("/api/ebay/getebay", { timeout: 30000 })
                                .then(result => {
                                    const data = result.data
                                    const { ebayListings = [], inventoryItems = [] } = data
                                    changeItems(inventoryItems)
                                    setEbayListings(ebayListings)
                                })
                                .catch(err => {
                                    console.log(err.message)
                                    localStorage.setItem("user", JSON.stringify({ ...user, OAuthActive: false }))
                                })
                                
                        })
                        .catch(err => {
                            const data = err.response.data
                            const { link } = data
                            if (link) {
                                localStorage.setItem("user", JSON.stringify({ ...user, OAuthActive: false }))
                                window.location.href = link
                            } else {
                                console.log(err)
                            }
                        })
                }
            })
    }

    async function importItemsFromCVS(file) {
        let items = await readFile(file)
        let preppedItems = prepItemsForImport(items)
        preppedItems.forEach(x => submitMassImport(x))
    }

    function sortNewListings() {
        const ebayIds = items.map(x => x.ebayId)
        const newEbayListings = ebayListings.filter(x => {
            return ebayIds.indexOf(x.ItemID) === -1
        })
        return newEbayListings
    }


    return (

        <storeContext.Provider value={{
            user,
            items,
            submitNewItem,
            submitNewExpense,
            newListings,
            editInventoryItem,
            linkItem,
            syncWithEbay,
            syncWithPayPal,
            setPayPalToken,
            setEbayToken,
            login,
            expenses,
            importItemsFromCVS,
            logout,
            ebayListings,
            updateUnlisted,
            updateItem,
            setEbayOAuthTokens,
            checkNewScores,
            getActiveListings
        }} >
            {props.children}
        </storeContext.Provider >
    )
}

export default Store
