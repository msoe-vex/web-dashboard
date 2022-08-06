import React from "react";
import "./App.css";
import { FocusStyleManager } from "@blueprintjs/core";
// import logo from "./logo.svg";

import { Provider } from "react-redux";
import { store } from "./Store/store";


import { AppNavbar } from "./Navbar/AppNavbar";
import { AppBody } from "./AppBody";

function App() {
  FocusStyleManager.onlyShowFocusOnTabs();
  return (
    <Provider store={store}>
      <div className="App">
        <AppNavbar />
        <AppBody className="App-body" />
        {/* <header className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <p>
            Edit <code>src/App.tsx</code> and save to reload.
          </p>
          <a
            className="App-link"
            href="https://reactjs.org"
            target="_blank"
            rel="noopener noreferrer"
          >
            Learn React
          </a>
        </header> */}
      </div>

    </Provider>
  );
}

export default App;
