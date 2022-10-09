import React from "react";
import { Button, Classes, Menu, MenuDivider, Position } from "@blueprintjs/core";
import { MenuItem2, Popover2 } from "@blueprintjs/popover2";
import { EntityId } from "@reduxjs/toolkit";

import { useAppDispatch, useAppSelector } from "../Store/hooks";

import { NameInput } from "./NameInput";
import { DeleteMenuItem, DuplicateMenuItem, EditMenuItem, RenameMenuItem } from "../Tree/MenuItems";
import { addedRobot, deletedRobot, renamedRobot, selectRobotById, selectRobotIds } from "../Tree/robotsSlice";

export function RobotMenu(): JSX.Element {
    const dispatch = useAppDispatch();

    // isOpen, setIsOpen is a function
    const [isOpen, setIsOpen] = React.useState(false);
    const [globalIsRenaming, setGlobalIsRenaming] = React.useState(false);

    const robotIds = useAppSelector(selectRobotIds);

    const ownerButton = (robotIds.length === 0 ?
        <Button
            icon="add"
            text="Add robot"
            minimal={true}
            onClick={() => { dispatch(addedRobot()); }}
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
            onClick={() => { dispatch(addedRobot()); }}
            shouldDismissPopover={false}
        />);

    const robotMenu = (
        <Menu className={Classes.ELEVATION_2}>
            {robotIds.map(robotId =>
                <RobotItem
                    key={robotId} // key here to make React happy
                    id={robotId}
                    setGlobalIsRenaming={setGlobalIsRenaming}
                    setIsOpen={setIsOpen}
                />)}
            <MenuDivider />
            {addRobotItem}
        </Menu>);

    return (robotIds.length === 0 ? ownerButton :
        <Popover2
            children={ownerButton}
            content={robotMenu}
            usePortal={true}
            minimal={true}
            position={Position.BOTTOM_LEFT}
            matchTargetWidth={true}
            isOpen={isOpen}
            onClose={() => { setIsOpen(globalIsRenaming); }} // setIsOpen to globalIsRenaming (which is usually false)
        />);
}

interface RobotItemProps {
    id: EntityId;
    setGlobalIsRenaming: (isRenaming: boolean) => void;
    setIsOpen: (state: boolean) => void;
}

function RobotItem(props: RobotItemProps): JSX.Element {
    const dispatch = useAppDispatch();

    const name = useAppSelector(state => selectRobotById(state, props.id)?.name);
    if (!name) { throw new Error("Expected valid routine name."); }

    const [isRenaming, setIsRenaming] = React.useState(false);
    return isRenaming ? (<NameInput
        initialName={name}
        icon="playbook"
        newNameSubmitted={(newName) => {
            if (newName) { dispatch(renamedRobot({ newName: newName, id: props.id })); }
            setIsRenaming(false);
            props.setGlobalIsRenaming(false);
        }}
    />) :
        (<MenuItem2
            icon="playbook"
            text={name}
            // selected={props.selected}
            // onClick={() => {
            //     props.setIsOpen(false);
            //     dispatch(selectedActiveRobot(props.id));
            // }}
            // doesn't work for some reason
            // submenuProps={{ className: Classes.ELEVATION_2 }}
            children={
                < RobotSubmenu
                    id={props.id}
                    handleRenameClick={() => {
                        setIsRenaming(true);
                        props.setGlobalIsRenaming(true);
                    }}
                />}
        />);
}

interface RobotSubmenuProps {
    id: EntityId;
    handleRenameClick: React.MouseEventHandler;
}

function RobotSubmenu(props: RobotSubmenuProps): JSX.Element {
    const dispatch = useAppDispatch();
    const dismissProps = { shouldDismissPopover: false };
    return (<>
        {/* <EditMenuItem onClick={() => dispatch(selectedActiveRobot(props.id))} /> */}
        <RenameMenuItem {...dismissProps} onClick={props.handleRenameClick} />
        {/* <DuplicateMenuItem {...dismissProps} onClick={() => { dispatch(duplicatedRobot(props.id)); }} /> */}
        <MenuDivider />
        <DeleteMenuItem {...dismissProps} onClick={() => { dispatch(deletedRobot(props.id)); }} />
    </>);
}