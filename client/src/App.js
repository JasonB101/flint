import React, {useContext} from 'react';
import { Switch } from "react-router-dom"
import ProtectedRoute from "./ProtectedRoute"
import Inventory from "./components/Views/Inventory/Inventory"
import './global.scss';
import Header from "./components/Header/Header"
import SideBar from './components/SideBar/SideBar';
import { storeContext } from "./Store"

function App() {
  const storeData = useContext(storeContext);
  const { syncEbay } = storeData;

  return (
    <div className="appWrapper">
      <Header />
      <SideBar syncEbay={syncEbay}/>
      <Switch>
        {/* <Route path="/auth/signin" component={SignIn} /> */}
        {/* <Route exact path="/" component={() => <Redirect to="/auth/signin" />} /> */}
        <ProtectedRoute path="/inventory" component={() => <Inventory />} />

      </Switch>
    </div>
  );
}

export default App;
