import React from "react";

import { useAppSelector } from "../Store/hooks";
import { AppDispatch } from "../Store/store";
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
import { allItemsShown, allItemsHidden, selectCollapsedIds, treeItemsCollapsed, treeItemsExpanded } from "./uiSlice";

interface DispatchProps {
    dispatch: AppDispatch;
}

interface OnClickProps {
    onClick: React.MouseEventHandler;
}

interface ShouldDismissPopoverProps {
    shouldDismissPopover?: boolean;
}

export function EditMenuItem(props: OnClickProps): JSX.Element {
    return (<MenuItem2
        {...props}
        text="Edit"
        icon="edit" // "form"
    />);
}

export function RenameMenuItem(props: OnClickProps & ShouldDismissPopoverProps): JSX.Element {
    return (<MenuItem2
        {...props}
        text="Rename"
        icon="text-highlight"
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

export function AddSelectionToNewFolderMenuItem(props: DispatchProps): JSX.Element | null {
    const canBeFolder = useAppSelector(checkIfSelectionCanBePutInFolder);
    return canBeFolder ? (<MenuItem2
        text="Add selection to folder"
        icon="folder-new"
        onClick={() => props.dispatch(selectionAddedToNewFolder())}
    />) : null;
}

export function HideAllMenuItem(props: DispatchProps): JSX.Element | null {
    const someShown = !useAppSelector(checkIfAllTreeItemsAreHidden);
    return (someShown ? <MenuItem2
        text="Hide all"
        icon="eye-off"
        onClick={() => props.dispatch(allItemsHidden())}
    /> : null);
}

export function ShowAllMenuItem(props: DispatchProps): JSX.Element | null {
    const someHidden = !useAppSelector(checkIfAllTreeItemsAreShown);
    return (someHidden ? <MenuItem2
        text="Show all"
        icon="eye-open"
        onClick={() => props.dispatch(allItemsShown())}
    /> : null);
}

export function CollapseAndExpandAllMenuItems(props: DispatchProps): JSX.Element {
    // const collapse = (<CollapseMenuItem {...props} />);
    // const expand = (<ExpandMenuItem {...props} />);
    const collapseAll = (<CollapseAllMenuItem {...props} />);
    const expandAll = (<ExpandAllMenuItem {...props} />);
    return (
        <>
            {expandAll}
            {collapseAll}
            <MenuDivider />
        </>
    );
}

// Expanding/collapsing paths is usually undesired behavior
function CollapseAllMenuItem(props: DispatchProps): JSX.Element | null {
    const containerIds = useAppSelector(selectAllTreeContainerIds);
    const collapsedIds = useAppSelector(selectCollapsedIds);
    // some container is expanded
    return (containerIds.some(containerId => !collapsedIds.includes(containerId)) ?
        <MenuItem2
            text="Collapse all"
            icon="collapse-all"
            onClick={() => props.dispatch(treeItemsCollapsed(containerIds))}
        /> : null);
}

function ExpandAllMenuItem(props: DispatchProps): JSX.Element | null {
    const containerIds = useAppSelector(selectAllTreeContainerIds);
    const collapsedIds = useAppSelector(selectCollapsedIds);
    // some container is collapsed
    return (containerIds.some(containerId => collapsedIds.includes(containerId)) ?
        <MenuItem2
            text="Expand all"
            icon="expand-all"
            onClick={() => props.dispatch(treeItemsExpanded(containerIds))}
        /> : null);
}

export function CollapseAndExpandFoldersMenuItems(props: DispatchProps): JSX.Element {
    // const collapse = (<CollapseMenuItem {...props} />);
    // const expand = (<ExpandMenuItem {...props} />);
    const collapseFolders = (<CollapseFoldersMenuItem {...props} />);
    const expandFolders = (<ExpandFoldersMenuItem {...props} />);
    const hasFolders = useAppSelector(selectAllTreeFolderIds).length > 0;
    return (
        <>
            {expandFolders}
            {collapseFolders}
            {hasFolders ? <MenuDivider /> : null}
        </>
    );
}

function CollapseFoldersMenuItem(props: DispatchProps): JSX.Element | null {
    const folderIds = useAppSelector(selectAllTreeFolderIds);
    const collapsedIds = useAppSelector(selectCollapsedIds);
    // some folder is expanded
    return (folderIds.some(folderId => !collapsedIds.includes(folderId)) ?
        <MenuItem2
            text="Collapse folders"
            icon="collapse-all"
            onClick={() => props.dispatch(treeItemsCollapsed(folderIds))}
        /> : null);
}

function ExpandFoldersMenuItem(props: DispatchProps): JSX.Element | null {
    const folderIds = useAppSelector(selectAllTreeFolderIds);
    const collapsedIds = useAppSelector(selectCollapsedIds);
    // some folder is collapsed
    return (folderIds.some(folderId => collapsedIds.includes(folderId)) ?
        <MenuItem2
            text="Expand folders"
            icon="expand-all"
            onClick={() => props.dispatch(treeItemsExpanded(folderIds))}
        /> : null);
}

// function AddWaypointBeforeMenuItem(props: DispatchProps & IdProps): JSX.Element {
//     return (<MenuItem2
//         text="Add waypoint before"
//         icon="add"
//         onClick={() => props.dispatch(waypointAddedBefore(props.id))}
//     />);
// }

// function AddWaypointAfterMenuItem(props: DispatchProps & IdProps): JSX.Element {
//     return (< MenuItem2
//         text="Add waypoint after"
//         icon="add"
//         onClick={() => props.dispatch(waypointAddedAfter(props.id))}
//     />);
// }