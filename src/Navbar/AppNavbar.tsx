import React from "react";

import {
    Alignment,
    Navbar,
    NavbarDivider,
    NavbarGroup,
    NavbarHeading,
} from "@blueprintjs/core";

import { RoutineMenu } from "./RoutineMenu";
import { RobotMenu } from "./RobotMenu";
import { ExportMenu } from "./ExportMenu";

export function AppNavbar(): JSX.Element {
    return (
        <Navbar className="App-navbar">
            <NavbarGroup align={Alignment.LEFT}>
                <NavbarHeading>Raider Robotics Web Dashboard</NavbarHeading>
                <NavbarDivider />
                <RoutineMenu />
                <NavbarDivider />
                <RobotMenu />
                <NavbarDivider />
                <ExportMenu />
            </NavbarGroup>
        </Navbar>
    );
}