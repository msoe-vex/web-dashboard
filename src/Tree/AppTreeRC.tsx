import React from "react";

import { TreeNodeInfo, IconName, Button, Card, H5 } from "@blueprintjs/core";
import { ContextMenu2 } from "@blueprintjs/popover2";
import { Dictionary, EntityId } from "@reduxjs/toolkit";
import { Tree, TreeItem, ControlledTreeEnvironment } from "react-complex-tree";

import { useAppDispatch, useAppSelector } from "../Store/hooks";
import { Path, selectAllPaths } from "./pathsSlice";
import { selectWaypointDictionary, Waypoint } from "./waypointsSlice";
import {
    selectActiveRoutineId,
    selectHiddenWaypointIds,
    itemVisibilityToggled,
} from "./uiSlice";
import { selectRoutineById } from "../Navbar/routinesSlice";
import { Folder, selectFolderDictionary } from "./foldersSlice";
import { FolderContextMenu, PathContextMenu, WaypointContextMenu } from "./TreeContextMenu";
import { DUMMY_ID } from "../Store/dummyId";
import {
    allItemsDeselected,
    ItemType,
    selectCollapsedFolderIds,
    selectSelectedWaypointIds,
    TreeItemType
} from "./tempUiSlice";

export function AppTree(): JSX.Element {
    const dispatch = useAppDispatch();

    // Could wrap activeRoutineId logic with card and simply pass pathIds
    const activeRoutineId = useAppSelector(selectActiveRoutineId);
    const routine = useAppSelector(state => selectRoutineById(state, activeRoutineId));
    if (!routine) { throw new Error("Expected valid active routine in tree."); }

    const pathIds = routine.pathIds;
    const allPaths = useAppSelector(selectAllPaths);
    let paths = pathIds.map(pathId => {
        // can't use selectors within callback function, so get allPaths and find instead
        const result = allPaths.find(allPath => allPath.id === pathId);
        if (!result) { throw new Error("Expected valid paths in tree."); }
        return result;
    });

    const [renamingId, setRenamingId] = React.useState<EntityId>(DUMMY_ID);

    const selectedWaypointIds = useAppSelector(selectSelectedWaypointIds);
    const collapsedFolderIds = useAppSelector(selectCollapsedFolderIds);
    const folderDictionary = useAppSelector(selectFolderDictionary);
    const waypointDictionary = useAppSelector(selectWaypointDictionary);

    const treeItems = paths.map(path => {
        return getTreeItemsFromPath(path, waypointDictionary, folderDictionary);


        // return getPathNode(path, orderedWaypoints, folders, renamingId, setRenamingId, selectedWaypointIds, collapsedFolderIds);
    });

    // const handleNodeClick = React.useCallback(
    //     // _ marks arg as unused
    //     (node: TreeNodeInfo<TreeItemType>, _nodePath: number[], e: React.MouseEvent) => {
    //         // === undefined doesn't catch ItemType.PATH, unlike ! operator
    //         if (node.nodeData === undefined) { throw new Error("Expected valid nodeData."); }
    //         else if (renamingId !== DUMMY_ID) { return; }
    //         dispatch(itemSelected(node.id, node.nodeData, e.shiftKey));
    //     }, [renamingId, dispatch]);

    // const handleNodeCollapse = React.useCallback((node: TreeNodeInfo, _nodePath: number[]) => {
    //     dispatch(treeItemsCollapsed([node.id]));
    // }, [dispatch]);

    // const handleNodeExpand = React.useCallback((node: TreeNodeInfo, _nodePath: number[]) => {
    //     dispatch(treeItemsExpanded([node.id]));
    // }, [dispatch]);

    // const handleNodeMouseEnter = React.useCallback((node: TreeNodeInfo<TreeItemType>, _nodePath: number[]) => {
    //     if (node.nodeData === undefined) { throw new Error("Expected valid nodeData."); }
    //     dispatch(itemMouseEnter(node.id, node.nodeData));
    // }, [dispatch]);

    // const handleNodeMouseLeave = React.useCallback((node: TreeNodeInfo<TreeItemType>, _nodePath: number[]) => {
    //     if (node.nodeData === undefined) { throw new Error("Expected valid nodeData."); }
    //     dispatch(itemMouseLeave(node.id, node.nodeData));
    // }, [dispatch]);

    const [contextMenu, setContextMenu] = React.useState<JSX.Element>(<></>);

    const handleNodeContextMenu = React.useCallback(
        (node: TreeNodeInfo<TreeItemType>, _nodePath: number[], e: React.MouseEvent) => {
            const contextMenuProps = { id: node.id, handleRenameClick: () => setRenamingId(node.id) };
            let contextMenu;
            switch (node.nodeData) {
                case ItemType.PATH:
                    contextMenu = (<PathContextMenu
                        {...contextMenuProps}
                    />);
                    break;
                case ItemType.FOLDER:
                    contextMenu = (<FolderContextMenu
                        {...contextMenuProps}
                    />);
                    break;
                case ItemType.WAYPOINT:
                    contextMenu = (<WaypointContextMenu
                        {...contextMenuProps}
                    />);
                    break;
                default:
                    throw new Error("Specified tree item does not have a tree context menu.");
            }
            setContextMenu(
                <div style={{ position: "absolute", left: e.clientX, top: e.clientY }} >
                    {contextMenu}
                </div >);
        }, []);

    // A callback function which actually renders the context menu
    const createContextMenu = React.useCallback(
        (): JSX.Element => (contextMenu),
        [contextMenu]);

    // Whether we should have one or more trees is not actually clear
    // I could see an argument for a single tree with multiple paths, or multiple trees, one per path
    // Could want to add robot dropdowns between trees?

    return (
        <Card className="App-tree-card"
            onClick={(e: React.MouseEvent) => {
                if (!e.isPropagationStopped()) { dispatch(allItemsDeselected()); }
            }} >
            <H5>{routine.name}</H5>

            <ContextMenu2
                content={createContextMenu}
                className={"App-tree-context-menu-popover"}
                popoverProps={{ popoverClassName: "App-tree-context-menu-popover" }}
            >
                {/* A div which automatically stops propagation of all tree events. Used to cohesively stop tree actions from deselecting.*/}
                < div onClick={(e: React.MouseEvent) => { e.stopPropagation(); }} >
                    {/* <ControlledTreeEnvironment
                        // items={}
                        getItemTitle={(item) => item.data}
                        viewState={{
                            "tree": {
                                focusedItem: undefined,
                                selectedItems: selectedWaypointIds,
                                expandedItems: undefined //collapsedFolderIds
                            }
                        }}
                        canSearch={false}
                    >
                        <Tree treeId="tree" rootItem="root" treeLabel={routine.name} />
                    </ControlledTreeEnvironment> */}
                    {/* <Tree
                        className="App-tree"
                        contents={treeNodeInfo}
                        onNodeClick={handleNodeClick}
                        onNodeCollapse={handleNodeCollapse}
                        onNodeExpand={handleNodeExpand}
                        onNodeContextMenu={handleNodeContextMenu}
                        onNodeMouseEnter={handleNodeMouseEnter}
                        onNodeMouseLeave={handleNodeMouseLeave}
                    /> */}
                </div>
            </ContextMenu2>
        </Card>
    );
};

function getTreeItemsFromPath(
    path: Path,
    waypointDictionary: Dictionary<Waypoint>,
    folderDictionary: Dictionary<Folder>
): ReadonlyArray<TreeItem<TreeItemType>> {
    const orderedWaypoints = path.waypointIds.map(waypointId => {
        const waypoint = waypointDictionary[waypointId];
        if (!waypoint) { throw new Error("Expected valid waypoint in path."); }
        return waypoint;
    });

    const folders = path.folderIds.map(folderId => {
        const folder = folderDictionary[folderId];
        if (!folder) { throw new Error("Expected valid folder in path."); }
        return folder;
    });

    

    return [];
}

interface TreeEyeButtonProps {
    treeItem: { id: EntityId, waypointIds?: EntityId[] };
    itemType: TreeItemType;
    renamingId: EntityId;
}

function TreeEyeButton(props: TreeEyeButtonProps): JSX.Element | null {
    const dispatch = useAppDispatch();

    const handleEyeButtonClick = React.useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        dispatch(itemVisibilityToggled(props.treeItem.id, props.itemType));
    }, [props.treeItem.id, props.itemType, dispatch]);

    const waypointIds = (!props.treeItem.waypointIds) ? [props.treeItem.id] : props.treeItem.waypointIds;
    const hiddenWaypointIds = useAppSelector(selectHiddenWaypointIds);
    return props.renamingId === props.treeItem.id ? null : (<Button
        className="App-eye-button"
        icon={eyeIcon(waypointIds, hiddenWaypointIds)}
        onClick={handleEyeButtonClick}
        minimal={true}
    />);
}

function eyeIcon(waypointIds: EntityId[], hiddenWaypointIds: EntityId[]): IconName {
    const allHidden = waypointIds.every(waypointId => hiddenWaypointIds.includes(waypointId));
    return (allHidden) ? "eye-off" : "eye-open";
}