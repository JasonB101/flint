import React, { useContext, useCallback } from "react"
import { Switch, Route, Redirect } from "react-router-dom"
import ProtectedRoute from "./components/ServiceComponents/ProtectedRoute"
import Inventory from "./components/Views/Inventory/Inventory"
import Sales from "./components/Views/Sales/Sales"
import Sourcing from "./components/Views/Sourcing/Sourcing"
import Listing from "./components/Views/Listing/Listing"
import VerifyUserToken from "./components/ServiceComponents/VerifyUserToken"
import "./global.scss"
import SideBar from "./components/SideBar/SideBar"
import { storeContext } from "./Store"
import SoldItems from "./components/Views/SoldItems/SoldItems"
import Returns from "./components/Views/Returns/Returns"
import Waste from "./components/Views/Waste/Waste"
import Milestones from "./components/Views/Milestones/Milestones"
import Expense from "./components/Views/Expense/Expense"
import Overview from "./components/Views/Overview/Overview"
import SignIn from "./components/SignIn/SignIn"
import PartHunter from "./components/Views/KeywordHunter/KeywordHunter"
import CarPartHunter from "./components/Views/CarPartHunter/CarPartHunter"  
import OAuthCode from "./components/OAuth/OAuthCode"
import Churn from "./components/Views/Churn/Churn"
import SyncProgressIndicator from "./components/SyncProgressIndicator/SyncProgressIndicator"
import Settings from "./components/Views/Settings/Settings"

function App() {
  const storeData = useContext(storeContext)
  const {
    items,
    syncWithEbay,
    updateItem,
    user,
    setEbayToken,
    login,
    expenses,
    submitNewExpense,
    importItemsFromCVS,
    logout,
    deleteExpense,
    updateExpense,
    saveChurnSettings,
    churnSettings
  } = storeData

  // Stable callback refs to prevent SyncProgressIndicator remounting
  const handleSyncComplete = useCallback((result) => {
    console.log('eBay sync completed!', result)
  }, [])

  const handleSyncError = useCallback((error) => {
    console.error('eBay sync failed:', error)
  }, [])

  return (
    <div className="appWrapper">
      <SideBar
        importItemsFromCVS={importItemsFromCVS}
        login={login}
        syncWithEbay={syncWithEbay}
        user={user}
      />
      <SyncProgressIndicator 
        onComplete={handleSyncComplete}
        onError={handleSyncError}
      />
      <Switch>
        <Route path="/auth/signin" component={SignIn} />
        <Route
          exact
          path="/"
          component={() => <Redirect to="/auth/signin" />}
        />
        <ProtectedRoute
          path="/setOAuthTokens"
          component={() => <OAuthCode {...storeData} />}
        />
        <ProtectedRoute
          path="/inventory"
          component={() => <Inventory {...storeData} />}
        />
        <ProtectedRoute
          path="/expenses"
          component={() => (
            <Expense
              expenses={expenses}
              deleteExpense={deleteExpense}
              submitNewExpense={submitNewExpense}
              updateExpense={updateExpense}
            />
          )}
        />
        <ProtectedRoute
          path="/churn"
          component={() => (
            <Churn
              churnSettings={churnSettings}
              saveChurnSettings={saveChurnSettings}
              items={items}
            />
          )}
        />
        <ProtectedRoute
          path="/reports/sales"
          component={() => <Sales {...storeData} />}
        />
        <ProtectedRoute
          path="/reports/sourcing"
          component={() => <Sourcing {...storeData} />}
        />
        <ProtectedRoute
          path="/reports/listing"
          component={() => <Listing {...storeData} />}
        />
        <ProtectedRoute
          path="/reports/solditems"
          component={() => <SoldItems {...storeData} />}
        />
        <ProtectedRoute
          path="/reports/returns"
          component={() => <Returns {...storeData} />}
        />
        <ProtectedRoute
          path="/reports/waste"
          component={() => <Waste {...storeData} />}
        />
        <ProtectedRoute
          path="/reports/overview"
          component={() => <Overview {...storeData} />}
        />
        <ProtectedRoute
          path="/reports/milestones"
          component={() => <Milestones {...storeData} />}
        />
        <ProtectedRoute
          path="/parthunter"
          component={() => <PartHunter {...storeData} />}
        />
        <ProtectedRoute
          path="/car-parthunter"
          component={() => <CarPartHunter {...storeData} />}
        />
        <ProtectedRoute
          path="/settings"
          component={() => <Settings />}
        />
        <ProtectedRoute
          path="/verifyUserToken"
          component={() => <VerifyUserToken setEbayToken={setEbayToken} />}
        />
      </Switch>
    </div>
  )
}

export default App
