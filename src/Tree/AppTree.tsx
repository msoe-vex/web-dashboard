import React from "react";

import {
    Classes,
    Tree,
    TreeNodeInfo,
    Icon,
    Intent,
    IconName,
    Button,
} from "@blueprintjs/core";

import { ContextMenu2, Tooltip2, Classes as Popover2Classes } from "@blueprintjs/popover2";
import { cloneDeep } from "lodash-es";

import { EntityId } from "@reduxjs/toolkit";

import { useAppDispatch, useAppSelector } from "../Store/hooks";
import { Path, selectPathById } from "./pathsSlice";
import { selectWaypointById } from "./waypointsSlice";
import { selectedWaypoint, selectHiddenWaypointIds, selectHighlightedWaypointIds, waypointVisibilityToggled } from "./uiSlice";
import { AppDispatch } from "../Store/store";

type NodePath = number[];

type TreeAction =
    | { type: "SET_IS_EXPANDED"; payload: { path: NodePath; isExpanded: boolean } }
    | { type: "DESELECT_ALL" }
    | { type: "SET_IS_SELECTED"; payload: { path: NodePath; isSelected: boolean } };

function forEachNode(nodes: TreeNodeInfo[] | undefined, callback: (node: TreeNodeInfo) => void) {
    if (nodes === undefined) {
        return;
    }
    for (const node of nodes) {
        callback(node);
        forEachNode(node.childNodes, callback);
    }
}

function forNodeAtPath(nodes: TreeNodeInfo[], path: NodePath, callback: (node: TreeNodeInfo) => void) {
    callback(Tree.nodeFromPath(path, nodes));
}

function treeExampleReducer(state: TreeNodeInfo[], action: TreeAction) {
    switch (action.type) {
        case "DESELECT_ALL":
            const newState1 = cloneDeep(state);
            forEachNode(newState1, node => (node.isSelected = false));
            return newState1;
        case "SET_IS_EXPANDED":
            const newState2 = cloneDeep(state);
            forNodeAtPath(newState2, action.payload.path, node => (node.isExpanded = action.payload.isExpanded));
            return newState2;
        case "SET_IS_SELECTED":
            const newState3 = cloneDeep(state);
            forNodeAtPath(newState3, action.payload.path, node => (node.isSelected = action.payload.isSelected));
            return newState3;
        default:
            return state;
    }
}

interface AppTreeProps {
    pathId: EntityId;
}

export function AppTree(props: AppTreeProps): JSX.Element {
    const dispatch = useAppDispatch();

    const path = useAppSelector(state => selectPathById(state, props.pathId));
    if (path === undefined) {
        throw Error("Expected valid pathId.");
    }
    const highlightedWaypointIds = useAppSelector(selectHighlightedWaypointIds);
    const hiddenWaypointIds = useAppSelector(selectHiddenWaypointIds);
    const content = getNodes(path, dispatch, highlightedWaypointIds, hiddenWaypointIds);

    const handleNodeClick = React.useCallback(
        (node: TreeNodeInfo, nodePath: NodePath, e: React.MouseEvent<HTMLElement>) => {
            dispatch(selectedWaypoint({
                selectedWaypointId: node.id,
                shiftKeyHeld: e.shiftKey,
                controlKeyHeld: e.ctrlKey
            }));
        }, [dispatch]);

    // const handleNodeCollapse = React.useCallback((_node: TreeNodeInfo, nodePath: NodePath) => {
    //     dispatch({
    //         payload: { path: nodePath, isExpanded: false },
    //         type: "SET_IS_EXPANDED",
    //     });
    // }, []);

    // const handleNodeExpand = React.useCallback((_node: TreeNodeInfo, nodePath: NodePath) => {
    //     dispatch({
    //         payload: { path: nodePath, isExpanded: true },
    //         type: "SET_IS_EXPANDED",
    //     });
    // }, []);

    return (
        <Tree
            contents={content}
            onNodeClick={handleNodeClick}
            // onNodeCollapse={handleNodeCollapse}
            // onNodeExpand={handleNodeExpand}
            className={Classes.ELEVATION_0}
        />
    );
};

function getNodes(path: Path, dispatch: AppDispatch, highlightedWaypointIds: EntityId[], hiddenWaypointIds: EntityId[]): TreeNodeInfo[] {
    const treeNodeInfo = path.waypointIds.map((id: EntityId) => {
        const waypoint = useAppSelector(state => selectWaypointById(state, id));
        if (waypoint === undefined) {
            throw new Error("Expected valid waypoint id.");
        }

        const secondaryLabel = (<Button
            icon={hiddenWaypointIds.includes(id) ? "eye-off" : "eye-open"}
            onClick={() => dispatch(waypointVisibilityToggled(id))}
            minimal={true}
        />);

        return {
            id,
            icon: "flow-linear" as IconName,
            label: waypoint.name,
            secondaryLabel,
            isSelected: highlightedWaypointIds.includes(id)
        };
    });
    return treeNodeInfo;
}