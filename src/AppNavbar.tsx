import React from 'react';

import {
    Alignment,
    Button,
    Classes,
    Navbar,
    NavbarDivider,
    NavbarGroup,
    NavbarHeading,
    FocusStyleManager,
} from '@blueprintjs/core';

import { RoutineMenu } from './RoutineMenu';

export interface AppNavbarProps {
}

export function AppNavbar(props: AppNavbarProps): JSX.Element {
    FocusStyleManager.onlyShowFocusOnTabs();
    return (
        <Navbar>
            <NavbarGroup align={Alignment.LEFT}>
                <NavbarHeading>Raider Robotics Web Dashboard</NavbarHeading>
                <NavbarDivider />

                <RoutineMenu />

                {/* <RobotMenu names={props.robotNames}/> */}

                {/* <Button className={Classes.MINIMAL} icon="playbook" text="Routine" /> */}
                <NavbarDivider />
                <Button className={Classes.MINIMAL} icon="home" text="Home" />
            </NavbarGroup>
        </Navbar>
    );
}