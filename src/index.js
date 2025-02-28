import React from "react";
import ReactDOM from "react-dom/client";  // ✅ Correct import for React 18
import { BootstrapWrapper } from "./utils/provider";  // ✅ Ensure Chakra is removed
import { Provider } from "react-redux";
import store from "./store/index"; // ✅ Correct import
import App from "./App";
import "bootstrap/dist/css/bootstrap.min.css";  // ✅ Ensure Bootstrap styles are applied
//import './utils/storeDebug';  // Add this import

const root = ReactDOM.createRoot(document.getElementById("root"));  // ✅ Use React 18 API

root.render(
  <Provider store={store}>
    <BootstrapWrapper>
      <App />
    </BootstrapWrapper>
  </Provider>
);
