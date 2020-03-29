import React from 'react';
import { Switch } from "react-router-dom"
import ProtectedRoute from "./ProtectedRoute"
import Inventory from "./components/Views/Inventory/Inventory"
import './global.scss';
import Header from "./components/Header/Header"
import SideBar from './components/SideBar/SideBar';
function App() {
  return (
    <div className="appWrapper">
      <Header />
      <SideBar />
      <Switch>
        {/* <Route path="/auth/signin" component={SignIn} /> */}
        {/* <Route exact path="/" component={() => <Redirect to="/auth/signin" />} /> */}
        <ProtectedRoute path="/inventory" component={() => <Inventory />} />

      </Switch>
    </div>
  );
}

export default App;
