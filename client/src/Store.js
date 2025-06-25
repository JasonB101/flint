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
import socketService from "./services/socketService"

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
        console.log("🔌 Initializing Store for user:", user._id)
        console.log("🔌 User sync settings:", { syncedWithEbay: user.syncedWithEbay, OAuthActive: user.OAuthActive })
        
        // Initialize WebSocket connection for real-time progress
        socketService.connect(user._id)
        
        getExpenses()
        getChurnSettings()
        if (user.syncedWithEbay && user.OAuthActive) {
          // Wait for room-joined confirmation before starting sync
          let syncStarted = false
          
          const handleRoomJoined = () => {
            if (!syncStarted) {
              syncStarted = true
              getEbay().catch(err => console.error("eBay sync error:", err))
            }
          }
          
          // Listen for room-joined confirmation
          socketService.on('room-joined', handleRoomJoined)
          
          // Fallback: if no room-joined event after 5 seconds, start anyway
          setTimeout(() => {
            if (!syncStarted) {
              syncStarted = true
              socketService.off('room-joined')
              getEbay().catch(err => console.error("eBay sync error:", err))
            }
          }, 5000)
        }
      } else {
        // Disconnect WebSocket when not authenticated
        socketService.disconnect()
        
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
    
    // Cleanup WebSocket on unmount
    return () => {
      socketService.disconnect()
    }
  }, [user, isAuthRoute])

  async function checkNewScores(newScores) {
    try {
      // Call the backend API to initiate checking of new scores and pass the newScores data
      const response = await userAxios.post("/api/milestones/updateMilestones", newScores)

      const { success } = response.data

      if (success === true) {
        // Handle success, e.g., display a success message
        console.log("New scores checked successfully")
        // Refresh notification count after checking milestones
        await getNotificationCount()
        return true
      } else {
        // Handle failure, e.g., display an error message
        console.error("Checking new scores failed:", response.data.message)
        return false
      }
    } catch (error) {
      // Handle error, e.g., display an error message or log the error
      console.error("Error checking new scores:", error)
      return false
    }
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

  // Notification management functions
  async function getNotifications() {
    try {
      // Ensure user is authenticated before making request
      if (!user?.token) {
        return []
      }
      
      const response = await userAxios.get("/api/notifications")
      if (response.data.success) {
        return response.data.notifications
      } else {
        console.error("Failed to fetch notifications:", response.data.error)
        return []
      }
    } catch (error) {
      // Don't log 401 errors as they're expected when not authenticated
      if (error.response?.status !== 401) {
        console.error("Error fetching notifications:", error)
      }
      return []
    }
  }

  async function getNotificationCount() {
    try {
      // Ensure user is authenticated before making request
      if (!user?.token) {
        return 0
      }
      
      const response = await userAxios.get("/api/notifications/unviewed-count")
      if (response.data.success) {
        return response.data.count
      } else {
        console.error("Failed to fetch notification count:", response.data.error)
        return 0
      }
    } catch (error) {
      // Don't log 401 errors as they're expected when not authenticated
      if (error.response?.status !== 401) {
        console.error("Error fetching notification count:", error)
      }
      return 0
    }
  }

  async function markNotificationAsViewed(notificationId) {
    try {
      const response = await userAxios.put(`/api/notifications/${notificationId}/viewed`)
      return response.data.success
    } catch (error) {
      console.error("Error marking notification as viewed:", error)
      return false
    }
  }

  async function markAllNotificationsAsViewed() {
    try {
      const response = await userAxios.put("/api/notifications/mark-all-viewed")
      return response.data.success
    } catch (error) {
      console.error("Error marking all notifications as viewed:", error)
      return false
    }
  }

  async function deleteNotification(notificationId) {
    try {
      const response = await userAxios.delete(`/api/notifications/${notificationId}`)
      return response.data.success
    } catch (error) {
      console.error("Error deleting notification:", error)
      return false
    }
  }

  async function clearAllNotifications() {
    try {
      const response = await userAxios.delete("/api/notifications")
      return response.data.success
    } catch (error) {
      console.error("Error clearing all notifications:", error)
      return false
    }
  }

  // User settings functions
  async function getUserSettings() {
    try {
      const response = await userAxios.get("/api/user/settings")
      const { success, notificationSettings } = response.data
      
      if (success) {
        return { notificationSettings }
      } else {
        throw new Error("Failed to fetch user settings")
      }
    } catch (error) {
      console.error("Error fetching user settings:", error)
      throw error
    }
  }

  async function updateUserSettings(settingsData) {
    try {
      const response = await userAxios.put("/api/user/settings", settingsData)
      const { success, message } = response.data
      
      if (success) {
        return true
      } else {
        throw new Error(message || "Failed to update user settings")
      }
    } catch (error) {
      console.error("Error updating user settings:", error)
      throw error
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

  function updateExpense(expenseData) {
    const expenseId = expenseData._id;
    userAxios
      .put(`/api/expense/${expenseId}`, expenseData)
      .then((result) => {
        if (result.data.success) {
          const updatedExpenses = expenses.map((expense) =>
            expense._id === expenseId ? result.data.expense : expense
          )
          changeState((prevState) => {
            return { ...prevState, expenses: updatedExpenses }
          })
        }
      })
      .catch((err) => {
        console.log("Update expense failed:", err);
        alert("Failed to update expense. Please try again.");
      })
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

  function deleteInventoryItem(itemId) {
    userAxios
      .delete(`/api/inventoryItems/${itemId}`)
      .then((res) => {
        if (res.data.success) {
          // Remove the item from state
          const updatedItems = items.filter((item) => item._id !== itemId)
          changeState((prevState) => ({
            ...prevState,
            items: updatedItems,
          }))
        } else {
          alert("Failed to remove item: " + res.data.message)
        }
      })
      .catch((err) => {
        console.log("Delete Item Failed:", err.message)
        alert("Failed to remove item. Please try again.")
      })
  }

  function wasteInventoryItem(itemId) {
    userAxios
      .put(`/api/inventoryItems/wasteItem/${itemId}`)
      .then((res) => {
        if (res.data.success) {
          // Update the item in state
          const updatedItems = items.map((item) => 
            item._id === itemId ? res.data.result : item
          )
          changeState((prevState) => ({
            ...prevState,
            items: updatedItems,
          }))
        } else {
          alert("Failed to mark item as waste: " + res.data.message)
        }
      })
      .catch((err) => {
        console.log("Waste Item Failed:", err.message)
        alert("Failed to mark item as waste. Please try again.")
      })
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
    // WebSocket will handle all progress events automatically
    // Just make the API call - progress will be sent via WebSocket
    return userAxios
      .get("/api/ebay/getebay", {
        headers: { "Cache-Control": "no-cache, no-store, must-revalidate" },
        timeout: 120000, // Increased to match backend timeout
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
        return data // Return the data for chaining
      })
      .catch((err) => {
        console.error("eBay sync error:", err)
        
        // Handle OAuth expiration by redirecting to re-authentication
        if (err.response && err.response.status === 402) {
          localStorage.setItem(
            "user",
            JSON.stringify({ ...user, OAuthActive: false })
          )
          
          // Try to get the OAuth link for re-authentication
          userAxios.post("/api/ebay/refreshOToken")
            .catch((refreshErr) => {
              const data = refreshErr.response?.data
              if (data?.link) {
                window.location.href = data.link
              } else {
                console.error("OAuth re-authentication required")
              }
            })
        }
        
        throw err // Re-throw the error for proper handling
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
        updateExpense,
        // newListings,
        editInventoryItem,
        returnInventoryItem,
        deleteInventoryItem,
        wasteInventoryItem,
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
        getEbayListing,
        // Notification functions
        getNotifications,
        getNotificationCount,
        markNotificationAsViewed,
        markAllNotificationsAsViewed,
        deleteNotification,
        clearAllNotifications,
        // User settings functions
        getUserSettings,
        updateUserSettings
      }}
    >
      {props.children}
    </storeContext.Provider>
  )
}

export default Store
