import React from 'react';

import {
    Tree,
    TreeNodeInfo,
    IconName,
    Button,
    Card,
    H5,
} from '@blueprintjs/core';
import { ContextMenu2 } from '@blueprintjs/popover2';
import { EntityId } from '@reduxjs/toolkit';

import { useAppDispatch, useAppSelector } from '../Store/hooks';
import { Path, selectAllPaths } from './pathsSlice';
import { selectWaypointDictionary, Waypoint } from './waypointsSlice';
import {
    selectActiveRoutineId,
    selectCollapsedIds,
    selectHiddenWaypointIds,
    selectHighlightedWaypointIds,
    treeItemCollapsed,
    treeItemExpanded,
    treeItemSelected,
    TreeItemType,
    treeItemVisibilityToggled,
} from './uiSlice';
import { selectRoutineById } from '../Navbar/routinesSlice';
import { Folder, selectFolderDictionary } from './foldersSlice';
import { FolderContextMenu, PathContextMenu, WaypointContextMenu } from './TreeContextMenu';
import { DUMMY_ID } from '../Store/dummyId';
import { NameInput } from '../Navbar/NameInput';
import { treeItemRenamed } from './treeActions';

interface AppTreeProps {
}

export function AppTree(props: AppTreeProps): JSX.Element {
    const dispatch = useAppDispatch();

    // Could wrap activeRoutineId logic with card and simply pass pathIds
    const activeRoutineId = useAppSelector(selectActiveRoutineId);
    const routine = useAppSelector(state => selectRoutineById(state, activeRoutineId));
    if (!routine) {
        throw Error("Expected valid active routine in tree.");
    }

    const pathIds = routine.pathIds;
    const allPaths = useAppSelector(selectAllPaths);
    let paths = pathIds.map(pathId => {
        // can't use selectors within callback function, so get allPaths and find instead
        const result = allPaths.find(allPath => allPath.id === pathId)
        if (!result) { throw Error("Expected valid paths in tree."); }
        return result;
    });

    const [renamingId, setRenamingId] = React.useState<EntityId>(DUMMY_ID);

    const highlightedWaypointIds = useAppSelector(selectHighlightedWaypointIds);
    const collapsedIds = useAppSelector(selectCollapsedIds);
    const folderDictionary = useAppSelector(selectFolderDictionary);
    const waypointDictionary = useAppSelector(selectWaypointDictionary);

    const treeNodeInfo = paths.map(path => {
        const orderedWaypoints = path.waypointIds.map(waypointId => {
            const waypoint = waypointDictionary[waypointId];
            if (!waypoint) { throw Error("Expected valid waypoint in path."); }
            return waypoint;
        });

        const folders = path.folderIds.map(folderId => {
            const folder = folderDictionary[folderId];
            if (!folder) { throw Error("Expected valid folder in path."); }
            return folder;
        });
        return getPathNode(path, orderedWaypoints, folders, renamingId, setRenamingId, highlightedWaypointIds, collapsedIds);
    });

    const handleNodeClick = React.useCallback(
        // _ marks arg as unused
        (node: TreeNodeInfo<TreeItemType>, _nodePath: number[], e: React.MouseEvent) => {
            // === undefined doesn't catch TreeItemType.PATH, unlike ! operator
            if (node.nodeData === undefined) { throw Error("Expected valid nodeData."); }
            else if (renamingId !== DUMMY_ID) { return; }
            dispatch(treeItemSelected(node.id, node.nodeData, e.shiftKey, e.ctrlKey));
        }, [renamingId, dispatch]);

    const handleNodeCollapse = React.useCallback((node: TreeNodeInfo, _nodePath: number[]) => {
        dispatch(treeItemCollapsed(node.id));
    }, [dispatch]);

    const handleNodeExpand = React.useCallback((node: TreeNodeInfo, _nodePath: number[]) => {
        dispatch(treeItemExpanded(node.id));
    }, [dispatch]);

    const [contextMenu, setContextMenu] = React.useState<JSX.Element>(<></>);

    const handleNodeContextMenu = React.useCallback(
        (node: TreeNodeInfo<TreeItemType>, nodePath: number[], e: React.MouseEvent) => {
            let contextMenu;
            const contextMenuProps = { id: node.id, handleRenameClick: () => setRenamingId(node.id) };
            if (node.nodeData === TreeItemType.PATH) {
                contextMenu = (<PathContextMenu
                    {...contextMenuProps}
                />);
            } else if (node.nodeData === TreeItemType.FOLDER) {
                contextMenu = (<FolderContextMenu
                    {...contextMenuProps}
                />);
            } else if (node.nodeData === TreeItemType.WAYPOINT) {
                contextMenu = (<WaypointContextMenu
                    {...contextMenuProps}
                />);
            }
            setContextMenu(
                <div style={{ position: 'absolute', left: e.clientX, top: e.clientY }} >
                    {contextMenu}
                </div >);
        }, []);

    // A callback function which actually renders the context menu
    const createContextMenu = React.useCallback(
        (): JSX.Element => (contextMenu), [contextMenu]
    );

    return (
        <Card className="App-tree-card" >
            <H5>{routine.name}</H5>

            <ContextMenu2
                content={createContextMenu}
                className={"App-tree-context-menu-popover"}
                popoverProps={{ popoverClassName: "App-tree-context-menu-popover" }}
            >
                {/* A div which automatically stops propagation of all tree events. Used to cohesively stop tree actions from deselecting.*/}
                < div
                    onClick={(e: React.MouseEvent) => e.stopPropagation()}
                >
                    <Tree
                        contents={treeNodeInfo}
                        onNodeClick={handleNodeClick}
                        onNodeCollapse={handleNodeCollapse}
                        onNodeExpand={handleNodeExpand}
                        onNodeContextMenu={handleNodeContextMenu}
                        className="App-tree"
                    />
                </div>
            </ContextMenu2>
        </Card >
    );
};

function getPathNode(
    path: Path,
    orderedWaypoints: Waypoint[],
    folders: Folder[],
    renamingId: EntityId,
    setRenamingId: (newId: EntityId) => void,
    highlightedWaypointIds: EntityId[],
    collapsedIds: EntityId[],
): TreeNodeInfo<TreeItemType> {
    // Waypoint nodes
    const waypointNodes: TreeNodeInfo<TreeItemType>[] = orderedWaypoints.map(waypoint => {
        const waypointEyeButton = (<TreeEyeButton
            treeItem={waypoint}
            treeItemType={TreeItemType.WAYPOINT}
            renamingId={renamingId}
        />);

        const waypointLabel = getTreeLabel(waypoint, TreeItemType.WAYPOINT, renamingId, setRenamingId);

        return {
            id: waypoint.id,
            icon: "flow-linear" as IconName,
            // label can be an element for renaming
            // triggering rename behavior is a bit weird, might have renamingId | undefined
            label: waypointLabel,
            secondaryLabel: waypointEyeButton,
            isSelected: highlightedWaypointIds.includes(waypoint.id),
            nodeData: TreeItemType.WAYPOINT
        };
    });

    // Inject folders
    folders.forEach(folder => {
        const folderEyeButton = (<TreeEyeButton
            treeItem={folder}
            treeItemType={TreeItemType.FOLDER}
            renamingId={renamingId}
        />);

        const folderLabel = getTreeLabel(folder, TreeItemType.FOLDER, renamingId, setRenamingId);

        const startIndex = waypointNodes.findIndex(waypointNode => waypointNode.id === folder.waypointIds[0]);
        if (startIndex === -1) { throw Error("Expected folder contents in path."); }

        // slice contents from waypointNodes and shift into new folder node
        const folderNode = {
            id: folder.id,
            hasCaret: true,
            isExpanded: !collapsedIds.includes(folder.id),
            isSelected: folder.waypointIds.length > 0 && folder.waypointIds.every(waypointId => highlightedWaypointIds.includes(waypointId)),
            label: folderLabel,
            secondaryLabel: folderEyeButton,
            nodeData: TreeItemType.FOLDER
        }
        const childNodes = waypointNodes.splice(startIndex, folder.waypointIds.length, folderNode);
        waypointNodes[startIndex].childNodes = childNodes;
    });

    const pathEyeButton = (<TreeEyeButton
        treeItem={path}
        treeItemType={TreeItemType.PATH}
        renamingId={renamingId}
    />);

    return {
        id: path.id,
        hasCaret: true,
        isExpanded: !collapsedIds.includes(path.id),
        icon: "layout-linear" as IconName,
        label: "Path - Robot 1", // todo: change to robot name
        isSelected: path.waypointIds.length > 0 && path.waypointIds.every(waypointId => highlightedWaypointIds.includes(waypointId)),
        nodeData: TreeItemType.PATH,
        secondaryLabel: pathEyeButton,
        childNodes: waypointNodes
    };
}

interface TreeEyeButtonProps {
    treeItem: { id: EntityId, waypointIds?: EntityId[] };
    treeItemType: TreeItemType;
    renamingId: EntityId;
}

function TreeEyeButton(props: TreeEyeButtonProps): JSX.Element | null {
    const dispatch = useAppDispatch();

    const handleEyeButtonClick = React.useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        dispatch(treeItemVisibilityToggled(props.treeItem.id, props.treeItemType));
    }, [props.treeItem.id, props.treeItemType, dispatch]);

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

function getTreeLabel(treeItem: Waypoint | Folder, treeItemType: TreeItemType, renamingId: EntityId, setRenamingId: (newId: EntityId) => void): JSX.Element | string {
    return (treeItem.id === renamingId) ? (
        < TreeNameInput
            treeItem={treeItem}
            treeItemType={treeItemType}
            setRenamingId={setRenamingId}
        />
    ) : treeItem.name;
}

interface TreeNameInputProps {
    treeItem: { id: EntityId, name: string };
    treeItemType: TreeItemType;
    setRenamingId: (newId: EntityId) => void;
}

function TreeNameInput(props: TreeNameInputProps): JSX.Element {
    const dispatch = useAppDispatch();
    return (<NameInput
        initialName={props.treeItem.name}
        newNameSubmitted={(newName) => {
            if (newName) {
                dispatch(treeItemRenamed(props.treeItem.id, props.treeItemType, newName));
            }
            props.setRenamingId(DUMMY_ID);
        }}
    />);
}