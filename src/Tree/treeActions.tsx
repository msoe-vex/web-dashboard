import { EntityId } from "@reduxjs/toolkit";
import { AppThunk, RootState } from "../Store/store";
import { selectActiveRoutineId, selectHighlightedWaypointIds, ItemType } from "./uiSlice";
import { Path, selectPathById, selectPathOwnerOfWaypointId } from "./pathsSlice";
import { addedFolder, renamedFolder, selectFolderById } from "./foldersSlice";
import { selectRoutineById } from "../Navbar/routinesSlice";
import { renamedWaypoint } from "./waypointsSlice";

export const treeItemRenamed = (id: EntityId, treeItemType: ItemType, newName: string): AppThunk => {
    return (dispatch, _getState) => {
        if (treeItemType === ItemType.WAYPOINT) {
            dispatch(renamedWaypoint({ newName, id }));
        } else if (treeItemType === ItemType.FOLDER) {
            dispatch(renamedFolder({ newName, id }));
        }
    };
};

export const selectionAddedToNewFolder = (): AppThunk => {
    return (dispatch, getState) => {
        const selection = makeSelectionContiguous(getState());
        dispatch(addedFolder(selection));
    };
};

// export const waypointAddedBefore = (id: EntityId): AppThunk => {
//     return (dispatch, getState) => {

//     };
// };

// export const waypointAddedAfter = (id: EntityId): AppThunk => {
//     return (dispatch, getState) => {
//         const treePaths = selectAllTreePaths(getState());
//         let treeIndex = -1;
//         let waypointIndex = -1;
//         for (let i = 0; i < treePaths.length; i++) {
//             const tIndex = treePaths[i].waypointIds.findIndex(waypointId => waypointId === id);
//             if (tIndex !== -1) {
//                 waypointIndex = tIndex;
//                 treeIndex = i;
//                 break;
//             }
//         }
//         if (waypointIndex === -1) { return; }
//         // dispatch waypointAdded
//         // eventually, poll previous and next waypoint, and calculate new state, then pass into waypointAdded
//         // sigh
//     };
// };

export const selectAllTreePaths = (state: RootState): Path[] => {
    const activeRoutine = selectRoutineById(state, selectActiveRoutineId(state));
    let result: Path[] = [];
    if (!activeRoutine) { return result; }
    activeRoutine.pathIds.forEach(pathId => {
        const path = selectPathById(state, pathId);
        if (path) { result.push(path); }
    });
    return result;
};

export const selectAllTreeWaypointIds = (state: RootState): EntityId[] => {
    const paths = selectAllTreePaths(state);
    return paths?.flatMap(path => path ? path.waypointIds : []) ?? [];
};

export const selectAllTreeContainerIds = (state: RootState): EntityId[] => {
    return selectAllTreePaths(state).flatMap(path => [path.id].concat(path.folderIds));
};

export const selectAllTreeFolderIds = (state: RootState): EntityId[] => {
    return selectAllTreePaths(state).flatMap(path => path.folderIds);
};

// /**
//  * @returns true if all container items in the tree are collapsed.
//  */
// export const checkIfAllTreeContainersAreCollapsed = (state: RootState): boolean => {
//     const containerIds = selectAllTreeContainerIds(state);
//     return containerIds.every(containerId => state.ui.collapsedIds.includes(containerId));
// };

// /**
//  * @returns true if all container items in the tree are expanded.
//  */
// export const checkIfAllTreeContainersAreExpanded = (state: RootState): boolean => {
//     const containerIds = selectAllTreeContainerIds(state);
//     return containerIds.every(containerId => !state.ui.collapsedIds.includes(containerId));
// };

// /**
//  * @returns true if all container items in the tree are collapsed.
//  */
// export const checkIfAllTreeFoldersAreCollapsed = (state: RootState): boolean => {
//     const folderIds = selectAllTreeFolderIds(state);
//     return folderIds.every(folderId => state.ui.collapsedIds.includes(folderId));
// };

// /**
//  * @returns true if all folder items in the tree are expanded.
//  */
// export const checkIfAllTreeFoldersAreExpanded = (state: RootState): boolean => {
//     const folderIds = selectAllTreeFolderIds(state);
//     return folderIds.every(folderId => !state.ui.collapsedIds.includes(folderId));
// };

/**
 * @returns true if all menu items are hidden, and false otherwise.
 */
export const checkIfAllTreeItemsAreHidden = (state: RootState): boolean => {
    const treeWaypointIds = selectAllTreeWaypointIds(state);
    return treeWaypointIds.every(waypointId => state.ui.hiddenWaypointIds.includes(waypointId));
}

/**
 * @returns true if all menu items are shown, and false otherwise.
 */
export const checkIfAllTreeItemsAreShown = (state: RootState): boolean => {
    const treeWaypointIds = selectAllTreeWaypointIds(state);
    return treeWaypointIds.every(waypointId => !state.ui.hiddenWaypointIds.includes(waypointId));
}

// /**
//  * @returns true if a selection currently exists, and false otherwise.
//  */
// export const checkIfSelectionExists = (state: RootState): boolean => {
//     return selectHighlightedWaypointIds(state).length > 0;
// };

/**
 * @returns true if the current selection can be inserted into a folder.
 * In order for this to be true, the following conditions must be met:
 * A current selection exists
 * If the current selection is not contiguous, it is automatically expanded to include
 * 
 * None of the current selection is already in a folder
 * All of the current selection belongs to the same path
 * The current selection is contiguous (after grabbing all )
 */
export const checkIfSelectionCanBePutInFolder = (state: RootState): boolean => {
    const selection = makeSelectionContiguous(state);
    if (selection.length === 0) { return false; }

    const ownerPath = selectPathOwnerOfWaypointId(state, selection[0]);
    if (!ownerPath) { return false; }
    // If some selection is not in ownerPath, return false
    else if (selection.some(waypointId => !ownerPath.waypointIds.includes(waypointId))) { return false; }
    // If some waypoint in selection is owned by a folder in owner path, return false
    else if (selection.some(waypointId =>
        ownerPath.folderIds.some(folderId => selectFolderById(state, folderId)?.waypointIds.includes(waypointId))
    )) { return false; }
    return true;
};

/**
 * Captures additional waypoint ids such that the current selection becomes contiguous.
 */
export const makeSelectionContiguous = (state: RootState): EntityId[] => {
    const treeWaypointIds = selectAllTreeWaypointIds(state);
    const currentSelection = selectHighlightedWaypointIds(state);
    const indicies = currentSelection.map(waypointId => treeWaypointIds.findIndex(treeWaypointId => treeWaypointId === waypointId)).filter(number => number !== -1);
    if (indicies.length === 0) { return []; }
    const min = Math.min(...indicies);
    const max = Math.max(...indicies);
    return treeWaypointIds.slice(min, max + 1);
};