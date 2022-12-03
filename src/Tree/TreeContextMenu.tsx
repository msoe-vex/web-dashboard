import React from "react";
import { Menu, MenuDivider } from "@blueprintjs/core";
import { EntityId } from "@reduxjs/toolkit";

import { useAppDispatch } from "../Store/hooks";
import { waypointDeleted, waypointDuplicated } from "./waypointsSlice";
import { folderUnpacked, folderDeleted } from "./foldersSlice";
import { pathDeleted } from "../Navbar/pathsSlice";
import {
    AddSelectionToNewFolderMenuItem,
    CollapseAndExpandAllMenuItems,
    CollapseAndExpandFoldersMenuItems,
    DeleteMenuItem,
    DuplicateMenuItem,
    HideAllMenuItem,
    RenameMenuItem,
    ShowAllMenuItem
} from "./MenuItems";
import { MenuItem2 } from "@blueprintjs/popover2";

interface WaypointContextMenuProps {
    id: EntityId;
    menuLocation: MenuLocation;
}

export enum MenuLocation {
    FIELD,
    TREE
}

export function WaypointContextMenu(props: WaypointContextMenuProps): JSX.Element {
    const dispatch = useAppDispatch();

    const showAll = (<ShowAllMenuItem />);
    const hideAll = (<HideAllMenuItem />);
    const onTree = (props.menuLocation === MenuLocation.TREE);

    return (
        <Menu>
            {onTree ? <RenameMenuItem id={props.id} /> : null}
            {/* <EditMenuItem onClick={dispatch(waypointEdited(props.id))} /> */}
            <DuplicateMenuItem onClick={() => { dispatch(waypointDuplicated(props.id)); }} />

            {onTree ? <AddSelectionToNewFolderMenuItem /> : null}

            <MenuDivider />

            {onTree ? <CollapseAndExpandFoldersMenuItems /> : null}

            {showAll}
            {hideAll}
            <MenuDivider />

            <DeleteMenuItem onClick={() => { dispatch(waypointDeleted(props.id)); }} />

            {/* set speed option */}
        </Menu>
    );
}

interface PathContextMenuProps {
    id: EntityId;
}

export function PathContextMenu(props: PathContextMenuProps): JSX.Element {
    const dispatch = useAppDispatch();
    return (
        <Menu>
            {/* select new robot */}
            {/* <MenuDivider /> */}

            {/* Comes with menu divider */}
            <CollapseAndExpandAllMenuItems />

            <ShowAllMenuItem />
            <HideAllMenuItem />
            <MenuDivider />

            <DeleteMenuItem onClick={() => { dispatch(pathDeleted(props.id)); }} />
        </Menu>
    );
}

interface FolderContextMenuProps {
    id: EntityId;
}

export function FolderContextMenu(props: FolderContextMenuProps): JSX.Element {
    const dispatch = useAppDispatch();
    return (
        <Menu>
            <RenameMenuItem id={props.id} />
            <MenuDivider />

            {/* Comes with menu divider */}
            <CollapseAndExpandFoldersMenuItems />

            <ShowAllMenuItem />
            <HideAllMenuItem />
            <MenuDivider />

            <MenuItem2
                text="Unpack folder"
                icon="folder-shared-open"
                onClick={() => dispatch(folderUnpacked(props.id))}
            />

            <DeleteMenuItem onClick={() => { dispatch(folderDeleted(props.id)); }} />
        </Menu>
    );
}

//Would this need an interface? TODO - Andy Dao
export function OnFieldContextMenu(): JSX.Element {
    //const dispatch = useAppDispatch();
    const showAll = (<ShowAllMenuItem />);
    const hideAll = (<HideAllMenuItem />);
    //TODO Needs Adding Robot Waypoints Functionality
    return(
        <Menu>
            {showAll}
            {hideAll}
        </Menu> //Insert Adding Waypoint Here?
    )
}

export function OutsideFieldContextMenu(): JSX.Element{
    //const dispatch = useAppDispatch();
    const showAll = (<ShowAllMenuItem />);
    const hideAll = (<HideAllMenuItem />);
    return(
        <Menu>
            {showAll}
            {hideAll}
        </Menu>
    )
}

export function AppTreeContextMenu(): JSX.Element{
    const collapseAndExpandAll = (<CollapseAndExpandAllMenuItems />);
    const showAll = (<ShowAllMenuItem />);
    const hideAll = (<HideAllMenuItem />);
    return (
        <Menu>
            {collapseAndExpandAll}
            {showAll}
            {hideAll}
        </Menu>
    )
}

export function SplineContextMenu(): JSX.Element{
    return (
        <Menu>
            <MenuItem2 label="Spline"/>
        </Menu>
    )
}