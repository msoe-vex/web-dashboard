import * as React from "react";

import {
    Button,
    Card,
    Elevation,
    InputGroup,
} from "@blueprintjs/core";

export class WaypointMenu extends React.Component {
    // public waypoint: Waypoint;

    public state = {
        editName: false
    };

    private handleEditNameClick = () => this.setState({ editName: true });
    private handleNameChange = () => {
        this.setState({ editName: false });
    };

    public render() {
        const { editName } = this.state;

        const editNameButton = (
            <Button
                disabled={editName}
                icon="edit"
                minimal={true}
                onClick={this.handleEditNameClick}
            />
        );

        const nameInput = (
            <InputGroup
                disabled={!editName}
                rightElement={editNameButton}
                onChange={this.handleNameChange}
            />
        );

        return (
            <Card interactive={true} elevation={Elevation.TWO}>
                {nameInput}
            </Card >
        );
    }
}