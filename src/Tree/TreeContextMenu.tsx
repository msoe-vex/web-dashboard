import React from "react";
import { Menu, MenuDivider, MenuItem } from "@blueprintjs/core";
import { EntityId } from "@reduxjs/toolkit";

import { useAppDispatch } from "../Store/hooks";
import { deletedWaypoint, duplicatedWaypoint } from "./waypointsSlice";
import { unpackedFolder, deletedFolder } from "./foldersSlice";
import { deletedPath } from "./pathsSlice";
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


interface WaypointContextMenuProps {
    id: EntityId;
    handleRenameClick: () => void;
}

export function WaypointContextMenu(props: WaypointContextMenuProps): JSX.Element {
    const dispatch = useAppDispatch();

    const showAll = (<ShowAllMenuItem dispatch={dispatch} />);
    const hideAll = (<HideAllMenuItem dispatch={dispatch} />);
    return (
        <Menu>
            <RenameMenuItem onClick={props.handleRenameClick} />
            {/* <EditMenuItem onClick={dispatch(editedWaypoint(props.id))} /> */}
            <DuplicateMenuItem onClick={() => dispatch(duplicatedWaypoint(props.id))} />
            <AddSelectionToNewFolderMenuItem dispatch={dispatch} />

            <MenuDivider />

            <CollapseAndExpandFoldersMenuItems dispatch={dispatch} />

            {showAll}
            {hideAll}
            <MenuDivider />

            <DeleteMenuItem onClick={() => dispatch(deletedWaypoint(props.id))} />
        </Menu>
    );
}

interface PathContextMenuProps {
    id: EntityId;
    handleRenameClick: () => void;
}

export function PathContextMenu(props: PathContextMenuProps): JSX.Element {
    const dispatch = useAppDispatch();
    return (
        <Menu>
            {/* select new robot */}
            {/* <MenuDivider /> */}

            {/* Comes with menu divider */}
            <CollapseAndExpandAllMenuItems dispatch={dispatch} />

            <ShowAllMenuItem dispatch={dispatch} />
            <HideAllMenuItem dispatch={dispatch} />
            <MenuDivider />

            <DeleteMenuItem onClick={() => dispatch(deletedPath(props.id))} />
        </Menu>
    );
}

interface FolderContextMenuProps {
    id: EntityId;
    handleRenameClick: () => void;
}

export function FolderContextMenu(props: FolderContextMenuProps): JSX.Element {
    const dispatch = useAppDispatch();
    return (
        <Menu>
            <RenameMenuItem onClick={props.handleRenameClick} />
            <MenuDivider />

            {/* Comes with menu divider */}
            <CollapseAndExpandFoldersMenuItems dispatch={dispatch} />

            <ShowAllMenuItem dispatch={dispatch} />
            <HideAllMenuItem dispatch={dispatch} />
            <MenuDivider />

            <MenuItem
                text="Unpack folder"
                icon="folder-shared-open"
                onClick={() => dispatch(unpackedFolder(props.id))}
            />

            <DeleteMenuItem onClick={() => dispatch(deletedFolder(props.id))} />
        </Menu>
    );
}
