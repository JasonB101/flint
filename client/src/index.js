import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import { BrowserRouter } from "react-router-dom"
import Store from "./Store"
import * as serviceWorker from './serviceWorker';
import 'bootstrap/dist/css/bootstrap.min.css';

ReactDOM.render(
  <BrowserRouter>
    <React.StrictMode>
      <Store>
        <App />
      </Store>
    </React.StrictMode>
  </BrowserRouter>,
  document.getElementById('root')
);


serviceWorker.unregister();
