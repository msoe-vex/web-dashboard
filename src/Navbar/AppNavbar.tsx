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
import { useAppSelector } from "../Store/hooks";
import { selectActiveRoutine } from "../Tree/uiSlice";

export function AppNavbar(): JSX.Element {
    const exportMenu = useAppSelector(selectActiveRoutine) ? (<>
        <NavbarDivider />
        <ExportMenu />
    </>) : null;

    return (
        <Navbar className="App-navbar">
            <NavbarGroup align={Alignment.LEFT}>
                <NavbarHeading>Raider Robotics Web Dashboard</NavbarHeading>
                <NavbarDivider />
                <RoutineMenu />
                <NavbarDivider />
                <RobotMenu />
                {exportMenu}
            </NavbarGroup>
        </Navbar>
    );
}