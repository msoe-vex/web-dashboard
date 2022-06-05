import * as React from "react";

import {
    Alignment,
    Button,
    Classes,
    Navbar,
    NavbarDivider,
    NavbarGroup,
    NavbarHeading,
} from "@blueprintjs/core";

export class ApplicationNavbar extends React.PureComponent {
    public render() {
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
}