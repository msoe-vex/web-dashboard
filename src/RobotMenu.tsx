import React from 'react';
import { InputGroup, Menu } from '@blueprintjs/core';
import { MenuItem2 } from '@blueprintjs/popover2';

interface RobotMenuProps {
    names: string[];
    // dispatch: Object;
}

export function RobotMenu(props: RobotMenuProps): JSX.Element {
    return (
        <Menu>
            {props.names.map((name: String): JSX.Element => (
                <MenuItem2
                    icon="plus"
                    text={name}
                />
            ))}

            <InputGroup />

            {/* <MenuDivider /> */}

            <MenuItem2
                icon="add"
                text="New robot"
            />
        </Menu>
    );
}
