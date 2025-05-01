import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
} from "react"
import { useLocation } from "react-router-dom"
import axios from "axios"
import prepItemsForImport from "./lib/massImportPrep"
import readFile from "./lib/readAndParseCVS"
import { AuthContext } from "./AuthContext"

const userAxios = axios.create({ timeout: 60000 })
export const storeContext = createContext({})

const Store = (props) => {
  const { user, setUser, login, logout } = useContext(AuthContext)

  const [state, changeState] = useState({
    items: [],
    expenses: [],
    ebayListings: [],
    churnSettings: null,

    // newListings: []
  })
  const { items, expenses, ebayListings, churnSettings } = state
  const location = useLocation()

  const authRoutes = ["/auth/signin", "/auth/signup", "/"]
  const isAuthRoute = authRoutes.includes(location.pathname)
  const interceptorRef = useRef(null)

  useEffect(() => {
    // Clear existing interceptor
    if (interceptorRef.current !== null) {
      userAxios.interceptors.request.eject(interceptorRef.current)
    }

    // Create new interceptor if user exists
    if (user?.token) {
      interceptorRef.current = userAxios.interceptors.request.use((config) => {
        config.headers["Authorization"] = `Bearer ${user.token}`
        return config
      })
    }

    // Cleanup on unmount
    return () => {
      if (interceptorRef.current !== null) {
        userAxios.interceptors.request.eject(interceptorRef.current)
      }
    }
  }, [user])

  useEffect(() => {
    const fetchData = async () => {
      if (user?.token && !isAuthRoute) {
        console.log("Made it")
        getExpenses()
        getChurnSettings()
        if (user.syncedWithEbay && user.OAuthActive) {
          try {
            await getEbay()
          } catch (err) {
            console.error("Error fetching eBay data:", err)
          }
        }
      } else {
        changeState({
          items: [],
          expenses: [],
          ebayListings: [],
          churnSettings: null,
          carPartOptions: {
            years: [],
            models: [],
            parts: [],
          },
        })
      }
    }

    fetchData()
  }, [user, isAuthRoute])

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

  async function getEbayListing(itemId) {
    try {
      if (!itemId) {
        console.error("Item ID is required")
        return { success: false, message: "Item ID is required" }
      }

      // Call the backend endpoint we just created
      const response = await userAxios.get(`/api/ebay/getListing/${itemId}`)
      console.log("Ebay Listing Response:", response.data)

      // Return the response data for immediate use
      return response.data
    } catch (error) {
      console.error("Error fetching eBay listing:", error)

      // Return detailed error information for better debugging
      return {
        success: false,
        message: error.response?.data?.message || error.message,
        error: error.response?.data || error.message,
      }
    }
  }

  async function saveChurnSettings(newChurnSettings) {
    try {
      const response = await userAxios.post(
        "/api/churnsettings",
        newChurnSettings
      )
      const { success, churnSettings, message } = response.data

      if (success === true) {
        changeState((prevState) => {
          return { ...prevState, churnSettings: churnSettings }
        })
        console.log("Churn settings saved successfully")
        return true
      } else {
        // Handle failure, e.g., display an error message
        console.error("Saving churn settings failed:", message)
        return false
      }
    } catch (error) {
      // Handle error, e.g., display an error message or log the error
      console.error("Error saving churn settings:", error)
      return false
    }
  }

  async function getChurnSettings() {
    try {
      const response = await userAxios.get("/api/churnsettings")
      const { success, churnSettings, message } = response.data

      if (success) {
        changeState((prevState) => ({
          ...prevState,
          churnSettings,
        }))
        return true
      } else {
        console.error("Failed to fetch churn settings:", message)
        return false
      }
    } catch (error) {
      console.error("Error fetching churn settings:", error)
      return false
    }
  }

  async function updateItem(itemInfo) {
    userAxios
      .put("/api/inventoryItems/update", itemInfo)
      .then((result) => {
        const { success } = result.data
        if (success === true) {
          getInventoryItems()
          return true
        } else {
          alert(result.message)
          return false
        }
      })
      .catch((err) => {
        console.log(err)
        return false
      })
  }

  async function submitNewItem(form) {
    try {
      const result = await userAxios.post("/api/inventoryItems", form);
      
      changeState((prevState) => {
        return { ...prevState, items: [...items, result.data.item] }
      });
      
      return {success: true};
    } catch (err) {
      console.log(err);
      return {success: false, message: err.message};
    }
  }

  async function getCarPartOptions() {
    try {
      const result = await userAxios.get("/api/carparthunter/getoptions")
      // Update state with the car part models
      return result.data // Return success status
    } catch (error) {
      console.error("Error fetching car part models:", error)
      // Set empty array on error

      return {
        years: [],
        models: [],
        parts: [],
      }
    }
  }

  async function getPartSearchOptions(year, model, part, zipCode = "84067") {
    try {
      // Call the endpoint we just created with query parameters
      const result = await userAxios.get("/api/carparthunter/getpartoptions", {
        params: {
          year,
          model,
          part,
          zipCode,
        },
      })

      return result.data // Return the data for immediate use if needed
    } catch (error) {
      console.error("Error fetching part options:", error)

      return [] // Return empty array in case of error
    }
  }

  async function getAllParts(payloads) {
    if (!payloads || payloads.length === 0) {
      console.log("No payloads provided")
      return []
    }

    try {
      const result = await userAxios.post("/api/carparthunter/getallparts", {
        payloads: payloads,
      })

      return result.data
    } catch (error) {
      console.error("Error fetching all parts:", error)
      return []
    }
  }
  async function getActiveListings(keyword) {
    try {
      const result = await userAxios.get(
        `/api/ebay/getactivelistings?keyword=${keyword}`
      )
      return result.data
    } catch (error) {
      console.error("Error fetching active listings:", error)
      return []
    }
  }

  async function getShippingLabels(orderId = null) {
    try {
      const result = await userAxios.get("/api/ebay/getshippinglabels")
      const shippingLabels = result.data.shippingLabels || []

      // Filter for items that have an orderId, and optionally match the provided orderId
      return shippingLabels.filter((label) =>
        orderId ? label.orderId === orderId : true
      )
    } catch (error) {
      console.error("Error fetching shipping labels:", error)
      return []
    }
  }

  async function getCompatibility(itemIds, partNumber) {
    if (itemIds.length === 0) return []
    try {
      // Send a GET request to the /getCompatibility route, passing itemIds as a query parameter
      const result = await userAxios.get("/api/ebay/getCompatibility", {
        params: {
          itemIds: itemIds.join(","), // Pass itemIds as a comma-separated string
          partNumber: partNumber, // Include partNumber in the request
        },
      })

      const compatibility = result.data.compatibility || []

      // If you need to filter by some condition (e.g., if the list has matches), you can do so
      return compatibility // Return the compatibility data
    } catch (error) {
      console.error("Error fetching compatibility data:", error)
      return [] // Return an empty array in case of error
    }
  }

  function submitMassImport(form) {
    userAxios
      .post("/api/inventoryItems//massImport", form)
      .then((result) => {
        changeState((prevState) => {
          return { ...prevState, items: [...items, result.data.item] }
        })
      })
      .catch((err) => console.log(err))
  }

  function submitNewExpense(form) {
    userAxios
      .post("/api/expense/addexpense", form)
      .then((result) => {
        changeState((prevState) => {
          return { ...prevState, expenses: [...expenses, result.data.expense] }
        })
      })
      .catch((err) => console.log(err))
  }

  function deleteExpense(expenseId) {
    userAxios
      .delete(`/api/expense/${expenseId}`)
      .then((result) => {
        const updatedExpenses = expenses.filter(
          (expense) => expense._id !== expenseId
        )
        changeState((prevState) => {
          return { ...prevState, expenses: updatedExpenses }
        })
      })
      .catch((err) => console.log(err))
  }

  function getInventoryItems() {
    userAxios
      .get("/api/inventoryItems")
      .then((result) =>
        changeState((prevState) => {
          return { ...prevState, items: result.data }
        })
      )
      .catch((err) => console.log("Get Inventory Failed", err.message))
  }

  function returnInventoryItem(itemUpdates) {
    userAxios
      .put("/api/inventoryItems/returnInventoryItem", itemUpdates)
      .then((res) => {
        if (res.data.success) {
          const updatedItems = [...items]
          const itemIndex = updatedItems.findIndex(
            (item) => item._id === itemUpdates.itemId
          )
          updatedItems[itemIndex] = res.data.result

          changeState((prevState) => ({
            ...prevState,
            items: updatedItems,
          }))
        }
      })
      .catch((err) => console.log("Return Item Failed:", err.message))
  }

  function editInventoryItem(itemObject) {
    userAxios
      .put("/api/inventoryItems/editInventoryItem", itemObject)
      .then((result) => {
        const updatedItems = items.map((item) =>
          item._id === itemObject.itemId ? { ...item, ...itemObject } : item
        )
        changeState((prevState) => {
          return { ...prevState, items: updatedItems }
        })
      })
      .catch((err) => {
        alert("An error has occured during the update")
        console.log(err.message)
      })
  }
  function updateUnlisted(ids) {
    userAxios
      .post("/api/inventoryItems/updateUnlisted", { ids: ids })
      .then((result) =>
        changeState((prevState) => {
          return { ...prevState, items: result.data }
        })
      )
  }
  function getExpenses() {
    userAxios
      .get("/api/expense")
      .then((result) => {
        changeState((prevState) => {
          return { ...prevState, expenses: result.data }
        })
      })
      .catch((err) => console.log("Get Expenses Failed", err.message))
  }

  // function linkItem(inventoryId, listingInfo) {
  //   userAxios
  //     .put(`/api/ebay/linkItem/${inventoryId}`, listingInfo)
  //     .then((result) => {
  //       const success = result.data.success

  //       if (success) {
  //         const updatedItem = result.data.updatedItem
  //         console.log(updatedItem)
  //         //Need to learn how to useReducer
  //         changeItems(
  //           items.map((x) => (x._id === updatedItem._id ? updatedItem : x))
  //         )
  //         setNewListings(
  //           newListings.filter((x) => x.ebayId !== listingInfo.ItemID)
  //         )
  //       } else {
  //         alert("Something went wrong! Item not linked.")
  //       }
  //     })
  // }
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

  function setEbayToken() {
    userAxios.post("/api/syncebay/setebaytoken").then((results) => {
      const data = results.data
      if (data.success) {
        setUser(data.user)
      }
    })
  }

  function requestOAuthLink() {
    const requestLink = userAxios
      .get("/api/oauth/requesttoken")
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
    let result = await userAxios.post("/api/syncebay/setebayoauthtoken", {
      authCode,
    })
    const { success, message } = result.data
    return { success, message }
  }

  function getEbay() {
    userAxios
      .get("/api/ebay/getebay", {
        headers: { "Cache-Control": "no-cache, no-store, must-revalidate" },
        timeout: 30000,
      })
      .then((result) => {
        const data = result.data
        const { ebayListings = [], inventoryItems = [] } = data
        changeState((prevState) => {
          return {
            ...prevState,
            items: inventoryItems,
            ebayListings: ebayListings,
          }
        })
      })
      .catch((err) => {
        if (err.response && err.response.status === 402) {
          userAxios
            .post("/api/ebay/refreshOToken")
            .then((result) => {
              localStorage.setItem(
                "user",
                JSON.stringify({ ...user, OAuthActive: true })
              )
              return userAxios
                .get("/api/ebay/getebay", { timeout: 30000 })
                .then((result) => {
                  const data = result.data
                  const { ebayListings = [], inventoryItems = [] } = data
                  changeState((prevState) => {
                    return {
                      ...prevState,
                      items: inventoryItems,
                      ebayListings: ebayListings,
                    }
                  })
                })
                .catch((err) => {
                  console.log(err.message)
                  localStorage.setItem(
                    "user",
                    JSON.stringify({ ...user, OAuthActive: false })
                  )
                })
            })
            .catch((err) => {
              console.log("Oauth refresh catch")
              const data = err.response.data
              const { link } = data
              if (link) {
                localStorage.setItem(
                  "user",
                  JSON.stringify({ ...user, OAuthActive: false })
                )
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
    preppedItems.forEach((x) => submitMassImport(x))
  }

  // function sortNewListings(items) {
  //   const ebayIds = items.map((x) => x.ebayId)
  //   const newEbayListings = ebayListings.filter((x) => {
  //     return ebayIds.indexOf(x.ItemID) === -1
  //   })
  //   return newEbayListings
  // }

  return (
    <storeContext.Provider
      value={{
        user,
        items,
        submitNewItem,
        submitNewExpense,
        deleteExpense,
        // newListings,
        editInventoryItem,
        returnInventoryItem,
        // linkItem,
        syncWithEbay,
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
        getActiveListings,
        getCompatibility,
        getShippingLabels,
        saveChurnSettings,
        churnSettings,
        getCarPartOptions,
        getPartSearchOptions,
        getAllParts,
        getEbayListing
      }}
    >
      {props.children}
    </storeContext.Provider>
  )
}

export default Store
