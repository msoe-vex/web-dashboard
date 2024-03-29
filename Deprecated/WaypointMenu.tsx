import * as React from 'react';
import { Card, Elevation } from '@blueprintjs/core';

import { NameInput } from './NameInput';

import { Waypoint } from './Waypoint';

interface WaypointMenuProps {
    waypoint: Waypoint
}

interface WaypointMenuState {
    waypoint: Waypoint
}

export class WaypointMenu extends React.Component<WaypointMenuProps, WaypointMenuState> {
    private constructor(props: WaypointMenuProps) {
        super(props);
        this.state = { waypoint: this.props.waypoint };
    }

    private onNameUpdate = (newName: string): void => {
        this.setState((state: WaypointMenuState) => {
            state.waypoint.name = newName;
            return state;
        });
    };

    public render() {
        return (
            <Card interactive={true} elevation={Elevation.TWO}>
                <NameInput
                    name={this.state.waypoint.name}
                    onNameUpdate={this.onNameUpdate}
                />
            </Card >
        );
    }
}