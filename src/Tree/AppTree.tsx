import React from "react";

import { Tree, TreeNodeInfo, IconName, Button, Card, H5, Menu } from "@blueprintjs/core";
import { MenuItem2 } from "@blueprintjs/popover2";
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
import { FolderContextMenu, MenuLocation, PathContextMenu, WaypointContextMenu } from "./TreeContextMenu";
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
import { ContextMenuHandlerContext } from "../Field/AppContextMenu";
import { Path, selectPathByValidId } from "../Navbar/pathsSlice";
import { assertValid } from "../Store/storeUtils";

const renamingContext = React.createContext<EntityId | undefined>(undefined);

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

    const [renamingId, setRenamingId] = React.useState<EntityId | undefined>(undefined);

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
            setRenamingId,
            renamingId);

        return getPathNode(path, orderedWaypoints, folders, renamingId, setRenamingId, selectedWaypointIds, collapsedFolderIds);
    });

    const handleNodeClick = React.useCallback(
        (node: TreeNodeInfo<TreeItemType>, _nodePath: number[], e: React.MouseEvent) => {
            dispatch(itemSelected(node.id, assertValid(node.nodeData), e.shiftKey));
        }, [dispatch]);

    const handleNodeCollapse = React.useCallback((node: TreeNodeInfo) => {
        dispatch(treeItemsCollapsed([node.id]));
    }, [dispatch]);

    const handleNodeExpand = React.useCallback((node: TreeNodeInfo) => {
        dispatch(treeItemsExpanded([node.id]));
    }, [dispatch]);

    const handleNodeMouseEnter = React.useCallback((node: TreeNodeInfo<TreeItemType>) => {
        dispatch(itemMouseEnter(node.id, assertValid(node.nodeData)));
    }, [dispatch]);

    const handleNodeMouseLeave = React.useCallback((node: TreeNodeInfo<TreeItemType>) => {
        dispatch(itemMouseLeave(node.id, assertValid(node.nodeData)));
    }, [dispatch]);

    const contextMenuHandler = React.useContext(ContextMenuHandlerContext);
    const handleContextMenu = React.useCallback((e: React.MouseEvent) => {
        // true if right click is on card specifically
        if (e.currentTarget === e.target) {
            const contextMenu = (
                <Menu>
                    <MenuItem2 label="Ahh" />
                </Menu>);
            contextMenuHandler(contextMenu, e.nativeEvent);
        }
    }, [contextMenuHandler]);

    const handleNodeContextMenu = React.useCallback(
        (node: TreeNodeInfo<TreeItemType>, _nodePath: number[], e: React.MouseEvent) => {
            const contextMenuProps = {
                id: node.id,
                handleRenameClick: () => { setRenamingId(node.id); }
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
            onClick={(e: React.MouseEvent) => {
                if (!e.isPropagationStopped()) { dispatch(allItemsDeselected()); }
            }}
            onContextMenu={handleContextMenu}
        >
            <H5 onContextMenu={handleContextMenu}>{routine.name}</H5>
            {/* A div which automatically stops propagation of all tree events. Used to cohesively stop tree actions from deselecting.*/}
            < div onClick={(e: React.MouseEvent) => { e.stopPropagation(); }}>
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
    setRenamingId: (newId?: EntityId) => void,
    renamingId?: EntityId
): TreeNodeInfo<TreeItemType> {
    // Waypoint nodes
    const waypointNodes: TreeNodeInfo<TreeItemType>[] = orderedWaypoints.map(waypoint => {
        const waypointEyeButton = (<TreeEyeButton
            treeItem={waypoint}
            itemType={ItemType.WAYPOINT}
            renamingId={renamingId}
        />);

        const waypointNameInput = (
            <TreeNameInput
                treeItem={waypoint}
                itemType={ItemType.WAYPOINT}
                renamingId={renamingId}
                setRenamingId={setRenamingId}
            />
        );

        return {
            id: waypoint.id,
            icon: "flow-linear",
            label: (waypoint.id === renamingId ? waypointNameInput : waypoint.name),
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

        const folderNameInput = (
            <TreeNameInput
                treeItem={folder}
                itemType={ItemType.FOLDER}
                renamingId={renamingId}
                setRenamingId={setRenamingId}
            />
        );

        const startIndex = waypointNodes.findIndex(waypointNode => waypointNode.id === folder.waypointIds[0]);
        if (startIndex === -1) { throw new Error("Expected folder contents in path."); }

        const folderNode = {
            id: folder.id,
            hasCaret: true,
            isExpanded: !collapsedFolderIds.includes(folder.id),
            isSelected: folder.waypointIds.length > 0 && folder.waypointIds.every(waypointId => selectedWaypointIds.includes(waypointId)),
            label: (folder.id === renamingId ? folderNameInput : folder.name),
            secondaryLabel: folderEyeButton,
            nodeData: ItemType.FOLDER as TreeItemType
        }
        // slice folder contents from waypointNodes and add new folder node
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
    renamingId?: EntityId;
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

interface TreeNameInputProps {
    treeItem: Waypoint | Folder;
    itemType: TreeItemType;
    renamingId?: EntityId;
    setRenamingId: (newId: EntityId | undefined) => void;
}

function TreeNameInput(props: TreeNameInputProps): JSX.Element | null {
    const dispatch = useAppDispatch();
    const { treeItem, renamingId } = props;
    return (treeItem.id !== renamingId) ? null :
        (<NameInput
            initialName={treeItem.name}
            newNameSubmitted={(newName) => {
                if (newName) { dispatch(treeItemRenamed(treeItem.id, props.itemType, newName)); }
                props.setRenamingId(treeItem.id);
            }}
        />);
}