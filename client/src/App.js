import React, {useContext} from 'react';
import { Switch, Route, Redirect } from "react-router-dom"
import ProtectedRoute from "./components/ServiceComponents/ProtectedRoute"
import Inventory from "./components/Views/Inventory/Inventory"
import Sales from "./components/Views/Sales/Sales"
import Sourcing from "./components/Views/Sourcing/Sourcing"
import Listing from "./components/Views/Listing/Listing"
import VerifyUserToken from "./components/ServiceComponents/VerifyUserToken"
import './global.scss';
import Header from "./components/Header/Header"
import SideBar from './components/SideBar/SideBar';
import { storeContext } from "./Store"
import VerifyPayPalToken from "./components/ServiceComponents/VerifyPayPalToken"
import SoldItems from './components/Views/SoldItems/SoldItems';
import Milestones from './components/Views/Milestones/Milestones';
import Expense from "./components/Views/Expense/Expense"
import SignIn from "./components/SignIn/SignIn"
import PartHunter from "./components/Views/KeywordHunter/KeywordHunter"
import OAuthCode from './components/OAuth/OAuthCode';


function App() {
  const storeData = useContext(storeContext);
  const { syncWithEbay, updateItem, setPayPalToken, syncWithPayPal, user, setEbayToken, login, expenses, submitNewExpense, importItemsFromCVS, logout } = storeData;

  return (
    <div className="appWrapper">
      <Header />
      <SideBar importItemsFromCVS={importItemsFromCVS} login={login} syncWithPayPal={syncWithPayPal} syncWithEbay={syncWithEbay} user={user}/>
      <Switch>
        <Route path="/auth/signin" component={SignIn} />
        <Route exact path="/" component={() => <Redirect to="/auth/signin" />} />
        <ProtectedRoute path="/setOAuthTokens" component={() => <OAuthCode {...storeData} />} />
        <ProtectedRoute path="/inventory" component={() => <Inventory {...storeData} />} />
        <ProtectedRoute path="/expenses" component={() => <Expense expenses={expenses} submitNewExpense={submitNewExpense} />} />
        <ProtectedRoute path="/reports/sales" component={() => <Sales {...storeData} />} />
        <ProtectedRoute path="/reports/sourcing" component={() => <Sourcing {...storeData} />} />
        <ProtectedRoute path="/reports/listing" component={() => <Listing {...storeData} />} />
        <ProtectedRoute path="/reports/solditems" component={() => <SoldItems {...storeData} />} />
        <ProtectedRoute path="/reports/milestones" component={() => <Milestones {...storeData} />} />
        <ProtectedRoute path="/parthunter" component={() => <PartHunter {...storeData} />} />
        <ProtectedRoute path="/verifyUserToken" component={() => <VerifyUserToken setEbayToken={setEbayToken}/>} />
        <ProtectedRoute path="/verifyPayPalToken" component={() => <VerifyPayPalToken setPayPalToken={setPayPalToken}/>} />

      </Switch>
    </div>
  );
}

export default App;
