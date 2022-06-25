import React from 'react';
import logo from './logo.svg';
import './App.css';

import { Provider } from 'react-redux';
import { store } from './Store/store';


import { AppNavbar } from './Navbar/AppNavbar';
import { AppTree } from './Tree/AppTree';

function App() {

  return (
    <Provider store={store}>

      <div className="App">

        <AppNavbar />

        <AppTree />

        <header className="App-header">
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
        </header>
      </div>

    </Provider>
  );
}

export default App;
