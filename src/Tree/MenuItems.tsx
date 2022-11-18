import React from "react";

import { useAppDispatch, useAppSelector } from "../Store/hooks";
import { MenuDivider } from "@blueprintjs/core";
import { MenuItem2 } from "@blueprintjs/popover2";

import {
    checkIfAllTreeItemsAreHidden,
    checkIfAllTreeItemsAreShown,
    checkIfSelectionCanBePutInFolder,
    selectionAddedToNewFolder,
    selectAllTreeFolderIds,
    selectAllTreeContainerIds
} from "./treeActions";
import { allItemsShown, allItemsHidden } from "./uiSlice";
import { renamingStarted, selectCollapsedFolderIds, treeItemsCollapsed, treeItemsExpanded } from "./tempUiSlice";
import { EntityId } from "@reduxjs/toolkit";

interface ShouldDismissPopoverProps {
    shouldDismissPopover?: boolean;
}
interface OnClickProps { onClick: React.MouseEventHandler; }
interface IdProps { id: EntityId; }

export function EditMenuItem(props: OnClickProps): JSX.Element {
    return (<MenuItem2
        {...props}
        text="Edit"
        icon="edit" // "form"
    />);
}

export function RenameMenuItem(props: IdProps & ShouldDismissPopoverProps): JSX.Element {
    const dispatch = useAppDispatch();
    return (<MenuItem2
        shouldDismissPopover={props.shouldDismissPopover}
        text="Rename"
        icon="text-highlight"
        onClick={() => { dispatch(renamingStarted(props.id)); }}
    />);
}

export function DuplicateMenuItem(props: OnClickProps & ShouldDismissPopoverProps): JSX.Element {
    return (<MenuItem2
        {...props}
        text="Duplicate"
        icon="duplicate"
    />);
}

export function DeleteMenuItem(props: OnClickProps & ShouldDismissPopoverProps): JSX.Element {
    return (<MenuItem2
        {...props}
        text="Delete"
        icon="trash"
        intent="danger"
        shouldDismissPopover={props.shouldDismissPopover}
    />);
}

export function AddSelectionToNewFolderMenuItem(): JSX.Element | null {
    const dispatch = useAppDispatch();
    const canBeFolder = useAppSelector(checkIfSelectionCanBePutInFolder);
    return canBeFolder ? (<MenuItem2
        text="Add selection to folder"
        icon="folder-new"
        onClick={() => { dispatch(selectionAddedToNewFolder()); }}
    />) : null;
}

export function HideAllMenuItem(): JSX.Element | null {
    const dispatch = useAppDispatch();
    const someShown = !useAppSelector(checkIfAllTreeItemsAreHidden);
    return (someShown ? <MenuItem2
        text="Hide all"
        icon="eye-off"
        onClick={() => { dispatch(allItemsHidden()); }}
    /> : null);
}

export function ShowAllMenuItem(): JSX.Element | null {
    const dispatch = useAppDispatch();
    const someHidden = !useAppSelector(checkIfAllTreeItemsAreShown);
    return (someHidden ? <MenuItem2
        text="Show all"
        icon="eye-open"
        onClick={() => { dispatch(allItemsShown()); }}
    /> : null);
}

//TODO check if broken because of dispatch modifications
export function CollapseAndExpandAllMenuItems(): JSX.Element {
    const dispatch = useAppDispatch();
    // const collapse = (<CollapseMenuItem {...props} />);
    // const expand = (<ExpandMenuItem {...props} />);
    const collapseAll = (<CollapseAllMenuItem {...dispatch} />);
    const expandAll = (<ExpandAllMenuItem {...dispatch} />);
    return (
        <>
            {expandAll}
            {collapseAll}
            <MenuDivider />
        </>
    );
}

// Expanding/collapsing paths is usually undesired behavior
function CollapseAllMenuItem(): JSX.Element | null {
    const dispatch = useAppDispatch();
    const containerIds = useAppSelector(selectAllTreeContainerIds);
    const collapsedFolderIds = useAppSelector(selectCollapsedFolderIds);
    // some container is expanded
    return (containerIds.some(containerId => !collapsedFolderIds.includes(containerId)) ?
        <MenuItem2
            text="Collapse all"
            icon="collapse-all"
            onClick={() => { dispatch(treeItemsCollapsed(containerIds)); }}
        /> : null);
}

function ExpandAllMenuItem(): JSX.Element | null {
    const dispatch = useAppDispatch();
    const containerIds = useAppSelector(selectAllTreeContainerIds);
    const collapsedFolderIds = useAppSelector(selectCollapsedFolderIds);
    // some container is collapsed
    return (containerIds.some(containerId => collapsedFolderIds.includes(containerId)) ?
        <MenuItem2
            text="Expand all"
            icon="expand-all"
            onClick={() => { dispatch(treeItemsExpanded(containerIds)); }}
        /> : null);
}

export function CollapseAndExpandFoldersMenuItems(): JSX.Element {
    const collapseFolders = (<CollapseFoldersMenuItem />);
    const expandFolders = (<ExpandFoldersMenuItem />);
    const hasFolders = useAppSelector(selectAllTreeFolderIds).length > 0;
    return (
        <>
            {expandFolders}
            {collapseFolders}
            {hasFolders ? <MenuDivider /> : null}
        </>
    );
}

function CollapseFoldersMenuItem(): JSX.Element | null {
    const dispatch = useAppDispatch();
    const folderIds = useAppSelector(selectAllTreeFolderIds);
    const collapsedFolderIds = useAppSelector(selectCollapsedFolderIds);
    // some folder is expanded
    return (folderIds.some(folderId => !collapsedFolderIds.includes(folderId)) ?
        <MenuItem2
            text="Collapse folders"
            icon="collapse-all"
            onClick={() => { dispatch(treeItemsCollapsed(folderIds)); }}
        /> : null);
}

function ExpandFoldersMenuItem(): JSX.Element | null {
    const dispatch = useAppDispatch();
    const folderIds = useAppSelector(selectAllTreeFolderIds);
    const collapsedFolderIds = useAppSelector(selectCollapsedFolderIds);
    // some folder is collapsed
    return (folderIds.some(folderId => collapsedFolderIds.includes(folderId)) ?
        <MenuItem2
            text="Expand folders"
            icon="expand-all"
            onClick={() => { dispatch(treeItemsExpanded(folderIds)); }}
        /> : null);
}

// function AddWaypointBeforeMenuItem(props: IdProps): JSX.Element {
//     const dispatch = useAppDispatch();
//     return (<MenuItem2
//         text="Add waypoint before"
//         icon="add"
//         onClick={() => dispatch(waypointAddedBefore(props.id))}
//     />);
// }

// function AddWaypointAfterMenuItem(props: IdProps): JSX.Element {
//     return (< MenuItem2
//         text="Add waypoint after"
//         icon="add"
//         onClick={() => dispatch(waypointAddedAfter(props.id))}
//     />);
// }
