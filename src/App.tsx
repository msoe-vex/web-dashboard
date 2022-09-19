import React, { ReactNode } from "react";
import "./App.css";
import { FocusStyleManager, HotkeysProvider, useHotkeys } from "@blueprintjs/core";
// import logo from "./logo.svg";

import { Provider } from "react-redux";
import { store } from "./Store/store";


import { AppNavbar } from "./Navbar/AppNavbar";
import { AppBody } from "./AppBody";
import { useAppDispatch } from "./Store/hooks";
import { ActionCreators } from "redux-undo";

function App() {
  FocusStyleManager.onlyShowFocusOnTabs();
  return (
    <Provider store={store}>
      <HotkeysProvider>
        <GlobalHotkeysDiv>
          <AppNavbar />
          <AppBody className="App-body" />
        </GlobalHotkeysDiv>
      </HotkeysProvider>
    </Provider>
  );
}

export default App;

interface GlobalHotkeysDivProps {
  children: ReactNode;
}

function GlobalHotkeysDiv(props: GlobalHotkeysDivProps) {
  const dispatch = useAppDispatch();
  const hotkeys = React.useMemo(() => [
    {
      combo: "ctrl+z",
      global: true,
      label: "Undo",
      onKeyDown: () => { dispatch(ActionCreators.undo()); }
    },
    {
      combo: "ctrl+y",
      global: true,
      label: "Redo",
      onKeyDown: () => { dispatch(ActionCreators.redo()); }
    }
  ], [dispatch]);
  const { handleKeyDown, handleKeyUp } = useHotkeys(hotkeys);
  return (
    <div onKeyDown={handleKeyDown} onKeyUp={handleKeyUp} className="App">
      {props.children}
    </div>
  );
}