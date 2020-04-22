import React, {useContext} from 'react';
import { Switch } from "react-router-dom"
import ProtectedRoute from "./components/ServiceComponents/ProtectedRoute"
import Inventory from "./components/Views/Inventory/Inventory"
import VerifyUserToken from "./components/ServiceComponents/VerifyUserToken"
import './global.scss';
import Header from "./components/Header/Header"
import SideBar from './components/SideBar/SideBar';
import { storeContext } from "./Store"
import VerifyPayPalToken from "./components/ServiceComponents/VerifyPayPalToken"
import SoldItems from './components/Views/SoldItems/SoldItems';

function App() {
  const storeData = useContext(storeContext);
  const { syncWithEbay, setPayPalToken, syncWithPayPal, user, setEbayToken, login } = storeData;

  return (
    <div className="appWrapper">
      <Header />
      <SideBar login={login} syncWithPayPal={syncWithPayPal} syncWithEbay={syncWithEbay} user={user}/>
      <Switch>
        {/* <Route path="/auth/signin" component={SignIn} /> */}
        {/* <Route exact path="/" component={() => <Redirect to="/auth/signin" />} /> */}
        <ProtectedRoute path="/inventory" component={() => <Inventory {...storeData} />} />
        <ProtectedRoute path="/reports/solditems" component={() => <SoldItems {...storeData} />} />
        <ProtectedRoute path="/verifyUserToken" component={() => <VerifyUserToken setEbayToken={setEbayToken}/>} />
        <ProtectedRoute path="/verifyPayPalToken" component={() => <VerifyPayPalToken setPayPalToken={setPayPalToken}/>} />

      </Switch>
    </div>
  );
}

export default App;
