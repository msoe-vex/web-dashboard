import React, { ReactNode } from "react";
import "./App.scss";
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
        <GlobalHotkeys>
          <AppNavbar />
          <AppBody className="App-body" />
        </GlobalHotkeys>
      </HotkeysProvider>
    </Provider>
  );
}

export default App;

interface GlobalHotkeysProps {
  children: ReactNode;
}

function GlobalHotkeys(props: GlobalHotkeysProps) {
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