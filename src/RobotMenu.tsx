import React from 'react';
import { InputGroup, Menu, MenuItem } from '@blueprintjs/core';

interface RobotMenuProps {
    names: string[];
    // dispatch: Object;
}

export function RobotMenu(props: RobotMenuProps): JSX.Element {
    return (
        <Menu>
            {props.names.map((name: String): JSX.Element => (
                <MenuItem
                    icon="plus"
                    text={name}
                />
            ))}

            <InputGroup />

            {/* <MenuDivider /> */}

            <MenuItem
                icon="add"
                text="New robot"
            />
        </Menu>
    );
}
