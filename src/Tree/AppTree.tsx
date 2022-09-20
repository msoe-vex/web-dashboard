import React from "react";

import { Tree, TreeNodeInfo, IconName, Button, Card, H5 } from "@blueprintjs/core";
import { ContextMenu2 } from "@blueprintjs/popover2";
import { EntityId } from "@reduxjs/toolkit";

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
import { NameInput } from "../Navbar/NameInput";
import { treeItemRenamed } from "./treeActions";
import {
    allItemsDeselected,
    itemMouseEnter,
    itemMouseLeave,
    itemSelected,
    ItemType,
    selectCollapsedFolderIds,
    selectSelectedWaypointIds,
    treeItemsCollapsed,
    treeItemsExpanded,
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

    const treeNodeInfo = paths.map(path => {
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
        return getPathNode(path, orderedWaypoints, folders, renamingId, setRenamingId, selectedWaypointIds, collapsedFolderIds);
    });

    const handleNodeClick = React.useCallback(
        // _ marks arg as unused
        (node: TreeNodeInfo<TreeItemType>, _nodePath: number[], e: React.MouseEvent) => {
            // === undefined doesn't catch ItemType.PATH, unlike ! operator
            if (node.nodeData === undefined) { throw new Error("Expected valid nodeData."); }
            else if (renamingId !== DUMMY_ID) { return; }
            dispatch(itemSelected(node.id, node.nodeData, e.shiftKey));
        }, [renamingId, dispatch]);

    const handleNodeCollapse = React.useCallback((node: TreeNodeInfo, _nodePath: number[]) => {
        dispatch(treeItemsCollapsed([node.id]));
    }, [dispatch]);

    const handleNodeExpand = React.useCallback((node: TreeNodeInfo, _nodePath: number[]) => {
        dispatch(treeItemsExpanded([node.id]));
    }, [dispatch]);

    const handleNodeMouseEnter = React.useCallback((node: TreeNodeInfo<TreeItemType>, _nodePath: number[]) => {
        if (node.nodeData === undefined) { throw new Error("Expected valid nodeData."); }
        dispatch(itemMouseEnter(node.id, node.nodeData));
    }, [dispatch]);

    const handleNodeMouseLeave = React.useCallback((node: TreeNodeInfo<TreeItemType>, _nodePath: number[]) => {
        if (node.nodeData === undefined) { throw new Error("Expected valid nodeData."); }
        dispatch(itemMouseLeave(node.id, node.nodeData));
    }, [dispatch]);

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
        (): JSX.Element => (contextMenu), [contextMenu]
    );

    return (
        <Card className="App-tree-card"
            onClick={(e: React.MouseEvent) => {
                if (!e.isPropagationStopped()) { dispatch(allItemsDeselected()); }
            }}
        >
            <H5>{routine.name}</H5>

            <ContextMenu2
                content={createContextMenu}
                className={"App-tree-context-menu-popover"}
                popoverProps={{ popoverClassName: "App-tree-context-menu-popover" }}
            >
                {/* A div which automatically stops propagation of all tree events. Used to cohesively stop tree actions from deselecting.*/}
                < div onClick={(e: React.MouseEvent) => { e.stopPropagation(); }} >
                    <Tree
                        className="App-tree"
                        contents={treeNodeInfo}
                        onNodeClick={handleNodeClick}
                        onNodeCollapse={handleNodeCollapse}
                        onNodeExpand={handleNodeExpand}
                        onNodeContextMenu={handleNodeContextMenu}
                        onNodeMouseEnter={handleNodeMouseEnter}
                        onNodeMouseLeave={handleNodeMouseLeave}
                    />
                </div>
            </ContextMenu2>
        </Card>
    );
};

function getPathNode(
    path: Path,
    orderedWaypoints: Waypoint[],
    folders: Folder[],
    renamingId: EntityId,
    setRenamingId: (newId: EntityId) => void,
    selectedWaypointIds: EntityId[],
    collapsedFolderIds: EntityId[],
): TreeNodeInfo<TreeItemType> {
    // Waypoint nodes
    const waypointNodes: TreeNodeInfo<TreeItemType>[] = orderedWaypoints.map(waypoint => {
        const waypointEyeButton = (<TreeEyeButton
            treeItem={waypoint}
            itemType={ItemType.WAYPOINT}
            renamingId={renamingId}
        />);

        const waypointLabel = getTreeLabel(waypoint, ItemType.WAYPOINT, renamingId, setRenamingId);

        return {
            id: waypoint.id,
            icon: "flow-linear" as IconName,
            label: waypointLabel,
            secondaryLabel: waypointEyeButton,
            isSelected: selectedWaypointIds.includes(waypoint.id),
            nodeData: ItemType.WAYPOINT
        };
    });

    // Inject folders
    folders.forEach(folder => {
        const folderEyeButton = (<TreeEyeButton
            treeItem={folder}
            itemType={ItemType.FOLDER}
            renamingId={renamingId}
        />);

        const folderLabel = getTreeLabel(folder, ItemType.FOLDER, renamingId, setRenamingId);

        const startIndex = waypointNodes.findIndex(waypointNode => waypointNode.id === folder.waypointIds[0]);
        if (startIndex === -1) { throw new Error("Expected folder contents in path."); }

        // slice contents from waypointNodes and shift into new folder node
        const folderNode = {
            id: folder.id,
            hasCaret: true,
            isExpanded: !collapsedFolderIds.includes(folder.id),
            isSelected: folder.waypointIds.length > 0 && folder.waypointIds.every(waypointId => selectedWaypointIds.includes(waypointId)),
            label: folderLabel,
            secondaryLabel: folderEyeButton,
            nodeData: ItemType.FOLDER as TreeItemType
        }
        const childNodes = waypointNodes.splice(startIndex, folder.waypointIds.length, folderNode);
        waypointNodes[startIndex].childNodes = childNodes;
    });

    const pathEyeButton = (<TreeEyeButton
        treeItem={path}
        itemType={ItemType.PATH}
        renamingId={renamingId}
    />);

    return {
        id: path.id,
        hasCaret: true,
        isExpanded: !collapsedFolderIds.includes(path.id),
        icon: "layout-linear" as IconName,
        label: "Path - Robot 1", // todo: change to robot name
        isSelected: path.waypointIds.length > 0 && path.waypointIds.every(waypointId => selectedWaypointIds.includes(waypointId)),
        nodeData: ItemType.PATH,
        secondaryLabel: pathEyeButton,
        childNodes: waypointNodes
    };
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

function getTreeLabel(treeItem: Waypoint | Folder, itemType: TreeItemType, renamingId: EntityId, setRenamingId: (newId: EntityId) => void): JSX.Element | string {
    return (treeItem.id === renamingId) ? (
        < TreeNameInput
            treeItem={treeItem}
            itemType={itemType}
            setRenamingId={setRenamingId}
        />
    ) : treeItem.name;
}

interface TreeNameInputProps {
    treeItem: { id: EntityId, name: string };
    itemType: TreeItemType;
    setRenamingId: (newId: EntityId) => void;
}

function TreeNameInput(props: TreeNameInputProps): JSX.Element {
    const dispatch = useAppDispatch();
    return (<NameInput
        initialName={props.treeItem.name}
        newNameSubmitted={(newName) => {
            if (newName) { dispatch(treeItemRenamed(props.treeItem.id, props.itemType, newName)); }
            props.setRenamingId(DUMMY_ID);
        }}
    />);
}