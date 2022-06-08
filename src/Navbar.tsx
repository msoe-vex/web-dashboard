import * as React from "react";

import {
    Alignment,
    Button,
    Classes,
    Navbar,
    NavbarDivider,
    NavbarGroup,
    NavbarHeading,
    FocusStyleManager,
} from "@blueprintjs/core";

export function ApplicationNavbar(props: Object) {
        FocusStyleManager.onlyShowFocusOnTabs();
        return (
            <Navbar>
                <NavbarGroup align={Alignment.LEFT}>
                    <NavbarHeading>Webdashboard</NavbarHeading>
                    <NavbarDivider />
                    <Button className={Classes.MINIMAL} icon="playbook" text="Routine" />
                    <NavbarDivider />
                    <Button className={Classes.MINIMAL} icon="home" text="Home" />
                </NavbarGroup>
            </Navbar>
        );
}