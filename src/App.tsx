import React from 'react';
import logo from './logo.svg';
import './App.css';

import { ApplicationNavbar } from './Navbar';
import { WaypointMenu, WaypointMenuProps } from './WaypointMenu';

import { Alignment, Button, Classes, Navbar } from '@blueprintjs/core';
import { Waypoint } from './Waypoint';
import { EndWaypoint } from './EndWaypoint';

function App() {
  return (
    <div className="App">
      <ApplicationNavbar>
      </ApplicationNavbar>

      <WaypointMenu
        waypoint={new EndWaypoint("Waypoint 1")}
      />

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
  );
}

export default App;
