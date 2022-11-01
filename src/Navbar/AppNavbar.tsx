import React from "react";

import { Alignment, Navbar, NavbarDivider, NavbarGroup, NavbarHeading } from "@blueprintjs/core";

import { RoutineMenu } from "./RoutineMenu";
import { RobotMenu } from "./RobotMenu";
import { ExportDialog } from "./ExportDialog";
import { useAppSelector } from "../Store/hooks";
import { selectActiveRoutine } from "../Tree/uiSlice";

export function AppNavbar(): JSX.Element {
    const exportDialog = useAppSelector(selectActiveRoutine) ? (<>
        <NavbarDivider />
        <ExportDialog />
    </>) : null;

    return (
        <Navbar className="App-navbar">
            <NavbarGroup align={Alignment.LEFT}>
                <NavbarHeading>Raider Robotics Web Dashboard</NavbarHeading>
                <NavbarDivider />
                <RoutineMenu />
                <NavbarDivider />
                <RobotMenu />
                {exportDialog}
            </NavbarGroup>
        </Navbar>
    );
}