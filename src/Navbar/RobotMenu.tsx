import React from "react";
import { Button, Classes, Menu, MenuDivider, Position } from "@blueprintjs/core";
import { MenuItem2, Popover2 } from "@blueprintjs/popover2";
import { EntityId } from "@reduxjs/toolkit";

import { useAppDispatch, useAppSelector } from "../Store/hooks";

import { NameInput } from "./NameInput";
import { DeleteMenuItem, DuplicateMenuItem, EditMenuItem, RenameMenuItem } from "../Tree/MenuItems";
import { ItemType, robotDialogOpened, selectIsRenaming } from "../Tree/tempUiSlice";
import { robotAdded, robotDeleted, robotDuplicated, selectRobotById, selectRobotIds } from "../Tree/robotsSlice";
import { RobotDialog } from "./RobotDialog";

export function RobotMenu(): JSX.Element {
    const dispatch = useAppDispatch();

    // isOpen, setIsOpen is a function
    const [isOpen, setIsOpen] = React.useState(false);

    const robotIds = useAppSelector(selectRobotIds);

    const ownerButton = (robotIds.length === 0 ?
        <Button
            icon="add"
            text="Add robot"
            minimal={true}
            onClick={() => { dispatch(robotAdded()); }}
        /> :
        <Button
            icon="playbook"
            rightIcon="chevron-down"
            text="Robots"
            minimal={true}
            onClick={() => { setIsOpen(true); }} // open popover
        />);

    const addRobotItem = (
        <MenuItem2
            icon="add"
            text="Add robot"
            onClick={() => { dispatch(robotAdded()); }}
            shouldDismissPopover={false}
        />);

    const robotMenu = (
        <Menu className={Classes.ELEVATION_2}>
            {robotIds.map(robotId =>
                <RobotItem
                    key={robotId} // key here to make React happy
                    id={robotId}
                    setIsOpen={setIsOpen}
                />)}
            <MenuDivider />
            {addRobotItem}
        </Menu>);

    return (robotIds.length === 0 ? ownerButton :
        <>
            <Popover2
                children={ownerButton}
                content={robotMenu}
                usePortal={true}
                minimal={true}
                position={Position.BOTTOM_LEFT}
                matchTargetWidth={true}
                isOpen={isOpen}
                onClose={() => { setIsOpen(false); }}
            />
            <RobotDialog />
        </>);
}

interface RobotItemProps {
    id: EntityId;
    setIsOpen: (state: boolean) => void;
}

function RobotItem(props: RobotItemProps): JSX.Element | null {
    const dispatch = useAppDispatch();

    const robot = useAppSelector(state => selectRobotById(state, props.id));
    const isRenaming = useAppSelector(state => selectIsRenaming(state, robot?.id));

    if (!robot) { return null; }
    return isRenaming ? (<NameInput
        id={robot.id}
        itemType={ItemType.ROBOT}
        icon="playbook"
    />) :
        (<MenuItem2
            icon="playbook"
            text={robot.name}
            onDoubleClick={() => { dispatch(robotDialogOpened(props.id)); }}
            submenuProps={{ className: Classes.ELEVATION_2 }}
        >
            <RobotSubmenu id={props.id} />
        </MenuItem2 >
        );
}

interface RobotSubmenuProps {
    id: EntityId;
}

function RobotSubmenu(props: RobotSubmenuProps): JSX.Element {
    const dispatch = useAppDispatch();
    const dismissProps = { shouldDismissPopover: false };
    return (<>
        <EditMenuItem onClick={() => { dispatch(robotDialogOpened(props.id)); }} />
        <RenameMenuItem {...dismissProps} id={props.id} />
        <DuplicateMenuItem {...dismissProps} onClick={() => { dispatch(robotDuplicated(props.id)); }} />
        <MenuDivider />
        <DeleteMenuItem {...dismissProps} onClick={() => { dispatch(robotDeleted(props.id)); }} />
    </>);
}
