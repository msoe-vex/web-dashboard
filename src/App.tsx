import React from "react";
import "./App.scss";
import { FocusStyleManager, HotkeysProvider } from "@blueprintjs/core";
// import logo from "./logo.svg";

import { Provider } from "react-redux";
import { store } from "./Store/store";

import { AppNavbar } from "./Navbar/AppNavbar";
import { AppBody } from "./AppBody";
import { GlobalHotkeys } from "./GlobalHotkeys";

export function App() {
  FocusStyleManager.onlyShowFocusOnTabs();
  return (
    <Provider store={store}>
      <HotkeysProvider>
        <GlobalHotkeys>
          <AppNavbar />
          <AppBody className="App-body" />
        </GlobalHotkeys>
      </HotkeysProvider>
    </Provider>
  );
}
