import React, { useCallback, useContext, MouseEvent } from "react";

import { Tree, TreeNodeInfo, IconName, Button, Card, H5 } from "@blueprintjs/core";
import { EntityId } from "@reduxjs/toolkit";

import { useAppDispatch, useAppSelector } from "../Store/hooks";
import { selectWaypointDictionary, Waypoint } from "./waypointsSlice";
import {
    selectActiveRoutineId,
    selectHiddenWaypointIds,
    itemVisibilityToggled,
} from "./uiSlice";
import { selectRoutineByValidId } from "../Navbar/routinesSlice";
import { Folder, selectFolderDictionary } from "./foldersSlice";
import { FolderContextMenu, MenuLocation, PathContextMenu, WaypointContextMenu, AppTreeContextMenu } from "./ContextMenu";
import { NameInput } from "../Navbar/NameInput";
import {
    allItemsDeselected,
    itemMouseEnter,
    itemMouseLeave,
    itemSelected,
    ItemType,
    selectCollapsedFolderIds,
    selectContainedWaypointIds,
    selectIsRenaming,
    selectRenamingId,
    selectSelectedWaypointIds,
    treeItemsCollapsed,
    treeItemsExpanded,
} from "./tempUiSlice";
import { ContextMenuHandlerContext } from "../Field/AppContextMenu";
import { Path, selectPathByValidId } from "../Navbar/pathsSlice";
import { assertValid } from "../Store/storeUtils";

export function AppTree(): JSX.Element {
    const dispatch = useAppDispatch();

    // Could wrap activeRoutineId logic with card and simply pass pathIds
    const activeRoutineId = useAppSelector(selectActiveRoutineId);
    const routine = useAppSelector(state => selectRoutineByValidId(state, activeRoutineId));
    const paths = useAppSelector(state => routine.pathIds.map(pathId => selectPathByValidId(state, pathId)));

    const selectedWaypointIds = useAppSelector(selectSelectedWaypointIds);
    const collapsedFolderIds = useAppSelector(selectCollapsedFolderIds);
    const folderDictionary = useAppSelector(selectFolderDictionary);
    const waypointDictionary = useAppSelector(selectWaypointDictionary);

    const renamingId = useAppSelector(selectRenamingId);

    const treeNodeInfo = paths.map(path => {
        const orderedWaypoints = path.waypointIds.map(waypointId =>
            assertValid(waypointDictionary[waypointId]));
        const folders = path.folderIds.map(folderId =>
            assertValid(folderDictionary[folderId]));
        return getPathNode(
            path,
            orderedWaypoints,
            folders,
            selectedWaypointIds,
            collapsedFolderIds,
            renamingId);
    });

    const handleNodeClick = useCallback(
        (node: TreeNodeInfo<ItemType>, _nodePath: number[], e: MouseEvent) => {
            dispatch(itemSelected(node.id, assertValid(node.nodeData), e.shiftKey, e.ctrlKey));
        }, [dispatch]);

    const handleNodeCollapse = useCallback((node: TreeNodeInfo) => {
        dispatch(treeItemsCollapsed([node.id]));
    }, [dispatch]);

    const handleNodeExpand = useCallback((node: TreeNodeInfo) => {
        dispatch(treeItemsExpanded([node.id]));
    }, [dispatch]);

    const handleNodeMouseEnter = useCallback((node: TreeNodeInfo<ItemType>) => {
        dispatch(itemMouseEnter(node.id, assertValid(node.nodeData)));
    }, [dispatch]);

    const handleNodeMouseLeave = useCallback((node: TreeNodeInfo<ItemType>) => {
        dispatch(itemMouseLeave(node.id, assertValid(node.nodeData)));
    }, [dispatch]);

    const contextMenuHandler = useContext(ContextMenuHandlerContext);
    const handleContextMenu = useCallback((e: MouseEvent) => {
        // true if right click is on card specifically
        if (e.currentTarget === e.target) {
            contextMenuHandler(<AppTreeContextMenu />, e.nativeEvent);
        }
    }, [contextMenuHandler]);

    const handleNodeContextMenu = useCallback(
        (node: TreeNodeInfo<ItemType>, _nodePath: number[], e: MouseEvent) => {
            const contextMenuProps = {
                id: node.id
            };

            let contextMenu;
            switch (node.nodeData) {
                case ItemType.PATH:
                    contextMenu = (<PathContextMenu {...contextMenuProps} />);
                    break;
                case ItemType.FOLDER:
                    contextMenu = (<FolderContextMenu {...contextMenuProps} />);
                    break;
                case ItemType.WAYPOINT:
                    contextMenu = (<WaypointContextMenu
                        {...contextMenuProps}
                        menuLocation={MenuLocation.TREE}
                    />);
                    break;
                default:
                    throw new Error("Specified tree item does not have a tree context menu.");
            }
            contextMenuHandler(contextMenu, e.nativeEvent);
        }, [contextMenuHandler]);

    return (
        <Card
            className={"App-tree-card"}
            onClick={(e: MouseEvent) => {
                if (!e.isPropagationStopped()) { dispatch(allItemsDeselected()); }
            }}
            onContextMenu={handleContextMenu}
        >
            <H5 onContextMenu={handleContextMenu}>{routine.name}</H5>
            {/* A div which automatically stops propagation of all tree events. Used to cohesively stop tree actions from deselecting.*/}
            < div onClick={(e: MouseEvent) => { e.stopPropagation(); }}>
                <Tree
                    contents={treeNodeInfo}
                    onNodeClick={handleNodeClick}
                    onNodeCollapse={handleNodeCollapse}
                    onNodeExpand={handleNodeExpand}
                    onNodeContextMenu={handleNodeContextMenu}
                    onNodeMouseEnter={handleNodeMouseEnter}
                    onNodeMouseLeave={handleNodeMouseLeave}
                />
            </div>
        </Card>
    );
};

function getPathNode(
    path: Path,
    orderedWaypoints: Waypoint[],
    folders: Folder[],
    selectedWaypointIds: EntityId[],
    collapsedFolderIds: EntityId[],
    // renamingId?: is different from | undefined for functions
    renamingId: EntityId | undefined
): TreeNodeInfo<ItemType> {
    // Waypoint nodes
    const waypointNodes: TreeNodeInfo<ItemType>[] = orderedWaypoints.map(waypoint => {
        const waypointProps = treeItemProps(waypoint.id, ItemType.WAYPOINT, waypoint.name, renamingId);
        return {
            ...waypointProps,
            icon: "flow-linear",
            isSelected: selectedWaypointIds.includes(waypoint.id),
        };
    });

    // Inject folders
    folders.forEach(folder => {
        const startIndex = waypointNodes.findIndex(waypointNode => waypointNode.id === folder.waypointIds[0]);
        // empty folders cannot render since we have no idea where to put them in the path
        if (startIndex === -1) { throw new Error("Expected folder contents in path."); }

        const folderProps = treeItemProps(folder.id, ItemType.FOLDER, folder.name, renamingId);
        const folderNode = {
            ...folderProps,
            hasCaret: true,
            isExpanded: !collapsedFolderIds.includes(folder.id),
            isSelected: folder.waypointIds.length > 0 && folder.waypointIds.every(waypointId => selectedWaypointIds.includes(waypointId)),
        }
        // slice folder contents from waypointNodes and add new folder node
        const childNodes = waypointNodes.splice(startIndex, folder.waypointIds.length, folderNode);
        waypointNodes[startIndex].childNodes = childNodes;
    });

    const pathProps = treeItemProps(path.id, ItemType.PATH, path.name, renamingId);
    return {
        ...pathProps,
        hasCaret: true,
        isExpanded: !collapsedFolderIds.includes(path.id),
        icon: "layout-linear" as IconName,
        isSelected: path.waypointIds.length > 0 && path.waypointIds.every(waypointId => selectedWaypointIds.includes(waypointId)),
        childNodes: waypointNodes
    };
}

function treeItemProps(id: EntityId, itemType: ItemType, name: string, renamingId?: EntityId) {
    const buttonProps = { id, itemType };
    const eyeButton = (<TreeEyeButton {...buttonProps} />);
    const nameInput = (<NameInput {...buttonProps} />);
    return {
        id,
        label: (id === renamingId ? nameInput : name),
        secondaryLabel: eyeButton,
        nodeData: itemType
    };
}

interface TreeEyeButtonProps {
    id: EntityId;
    itemType: ItemType;
}

function TreeEyeButton(props: TreeEyeButtonProps): JSX.Element | null {
    const dispatch = useAppDispatch();

    const handleEyeButtonClick = useCallback((e: MouseEvent) => {
        e.stopPropagation();
        dispatch(itemVisibilityToggled(props.id, props.itemType));
    }, [props.id, props.itemType, dispatch]);

    // const waypointIds = (!props.treeItem.waypointIds) ? [props.treeItem.id] : props.treeItem.waypointIds;
    const containedWaypointIds = useAppSelector(state =>
        selectContainedWaypointIds(state, props.id, props.itemType));
    const hiddenWaypointIds = useAppSelector(selectHiddenWaypointIds);
    const icon = eyeIcon(containedWaypointIds, hiddenWaypointIds);

    const isRenaming = useAppSelector(state => selectIsRenaming(state, props.id));
    return isRenaming ? null : (<Button
        className="App-eye-button"
        icon={icon}
        onClick={handleEyeButtonClick}
        minimal={true}
    />);
}

function eyeIcon(waypointIds: EntityId[], hiddenWaypointIds: EntityId[]): IconName {
    const allHidden = waypointIds.every(waypointId => hiddenWaypointIds.includes(waypointId));
    return (allHidden) ? "eye-off" : "eye-open";
}
