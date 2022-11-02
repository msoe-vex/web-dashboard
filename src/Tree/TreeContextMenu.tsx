import React from "react";
import { Menu, MenuDivider } from "@blueprintjs/core";
import { EntityId } from "@reduxjs/toolkit";

import { useAppDispatch } from "../Store/hooks";
import { deletedWaypoint, duplicatedWaypoint } from "./waypointsSlice";
import { unpackedFolder, deletedFolder } from "./foldersSlice";
import { deletedPath } from "../Navbar/pathsSlice";
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


// interface ContextMenuProps {
//     event: React.MouseEvent;
//     children: JSX.Element;
// }

// export function ContextMenu(props: ContextMenuProps): JSX.Element {
//     return (
//         <div style={{
//             position: "absolute",
//             left: props.event.clientX,
//             top: props.event.clientY
//         }}>
//             {props.children}
//         </div>);
// }

interface WaypointContextMenuProps {
    id: EntityId;
    handleRenameClick: () => void;
    menuLocation: MenuLocation;
}

export enum MenuLocation {
    FIELD, 
    TREE
}

export function WaypointContextMenu(props: WaypointContextMenuProps): JSX.Element {
    const dispatch = useAppDispatch();

    const showAll = (<ShowAllMenuItem dispatch={dispatch} />);
    const hideAll = (<HideAllMenuItem dispatch={dispatch} />);
    const onTree = (props.menuLocation === MenuLocation.TREE);

    return (
        <Menu>
            {onTree ? <RenameMenuItem onClick={props.handleRenameClick} /> : null}
            {/* <EditMenuItem onClick={dispatch(editedWaypoint(props.id))} /> */}
            <DuplicateMenuItem onClick={() => { dispatch(duplicatedWaypoint(props.id)); }} />

            {onTree ? <AddSelectionToNewFolderMenuItem dispatch={dispatch} /> : null}

            <MenuDivider />

            {onTree ? <CollapseAndExpandFoldersMenuItems dispatch={dispatch} /> : null}

            {showAll}
            {hideAll}
            <MenuDivider />

            <DeleteMenuItem onClick={() => { dispatch(deletedWaypoint(props.id)); }} />

            {/* set speed option */}
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

            <DeleteMenuItem onClick={() => { dispatch(deletedPath(props.id)); }} />
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

            <MenuItem2
                text="Unpack folder"
                icon="folder-shared-open"
                onClick={() => dispatch(unpackedFolder(props.id))}
            />

            <DeleteMenuItem onClick={() => { dispatch(deletedFolder(props.id)); }} />
        </Menu>
    );
}
