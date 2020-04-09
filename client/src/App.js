import React, {useContext} from 'react';
import { Switch } from "react-router-dom"
import ProtectedRoute from "./ProtectedRoute"
import Inventory from "./components/Views/Inventory/Inventory"
import VerifyUserToken from "./VerifyUserToken"
import './global.scss';
import Header from "./components/Header/Header"
import SideBar from './components/SideBar/SideBar';
import { storeContext } from "./Store"
import SoldItems from './components/Views/SoldItems/SoldItems';

function App() {
  const storeData = useContext(storeContext);
  const { syncWithEbay, user, setEbayToken, login } = storeData;

  return (
    <div className="appWrapper">
      <Header />
      <SideBar login={login} syncWithEbay={syncWithEbay} user={user}/>
      <Switch>
        {/* <Route path="/auth/signin" component={SignIn} /> */}
        {/* <Route exact path="/" component={() => <Redirect to="/auth/signin" />} /> */}
        <ProtectedRoute path="/inventory" component={() => <Inventory {...storeData} />} />
        <ProtectedRoute path="/reports/solditems" component={() => <SoldItems {...storeData} />} />
        <ProtectedRoute path="/verifyUserToken" component={() => <VerifyUserToken setEbayToken={setEbayToken}/>} />

      </Switch>
    </div>
  );
}

export default App;
