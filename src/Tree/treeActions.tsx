import { EntityId } from "@reduxjs/toolkit";
import { AppThunk, RootState } from "../Store/store";
import { selectActiveRoutineId, selectHiddenWaypointIds } from "./uiSlice";
import { Path, selectOwnerPath, selectPathByValidId } from "../Navbar/pathsSlice";
import { addedFolder, renamedFolder, selectFolderByValidId } from "./foldersSlice";
import { renamedWaypoint } from "./waypointsSlice";
import { ItemType, selectSelectedWaypointIds } from "./tempUiSlice";
import { selectRoutineByValidId } from "../Navbar/routinesSlice";

export function treeItemRenamed(id: EntityId, treeItemType: ItemType, newName: string): AppThunk {
    return (dispatch) => {
        if (treeItemType === ItemType.WAYPOINT) {
            dispatch(renamedWaypoint({ newName, id }));
        } else if (treeItemType === ItemType.FOLDER) {
            dispatch(renamedFolder({ newName, id }));
        }
    };
};

export function selectionAddedToNewFolder(): AppThunk {
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

export function selectAllTreePaths(state: RootState): Path[] {
    const activeRoutine = selectRoutineByValidId(state, selectActiveRoutineId(state));
    return activeRoutine.pathIds.map(pathId => selectPathByValidId(state, pathId));
};

export function selectAllTreeWaypointIds(state: RootState): EntityId[] {
    return selectAllTreePaths(state).flatMap(path => path.waypointIds);
};

export function selectAllTreeContainerIds(state: RootState): EntityId[] {
    return selectAllTreePaths(state).flatMap(path => [path.id].concat(path.folderIds));
};

export function selectAllTreeFolderIds(state: RootState): EntityId[] {
    return selectAllTreePaths(state).flatMap(path => path.folderIds);
};

/**
 * @returns true if all menu items are hidden, and false otherwise.
 */
export function checkIfAllTreeItemsAreHidden(state: RootState): boolean {
    const treeWaypointIds = selectAllTreeWaypointIds(state);
    const hiddenWaypointIds = selectHiddenWaypointIds(state);
    return treeWaypointIds.every(waypointId => hiddenWaypointIds.includes(waypointId));
}

/**
 * @returns true if all menu items are shown, and false otherwise.
 */
export function checkIfAllTreeItemsAreShown(state: RootState): boolean {
    const treeWaypointIds = selectAllTreeWaypointIds(state);
    const hiddenWaypointIds = selectHiddenWaypointIds(state);
    return treeWaypointIds.every(waypointId => !hiddenWaypointIds.includes(waypointId));
}

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
export function checkIfSelectionCanBePutInFolder(state: RootState): boolean {
    const selection = makeSelectionContiguous(state);
    if (selection.length === 0) { return false; }

    const ownerPath = selectOwnerPath(state, selection[0], ItemType.WAYPOINT);
    // If some selection is not in ownerPath, return false
    if (selection.some(waypointId => !ownerPath.waypointIds.includes(waypointId))) { return false; }
    // If some waypoint in selection is owned by a folder in owner path, return false
    else if (selection.some(waypointId =>
        ownerPath.folderIds.some(folderId => selectFolderByValidId(state, folderId).waypointIds.includes(waypointId))
    )) { return false; }
    return true;
};

/**
 * Captures additional waypoint ids such that the current selection becomes contiguous.
 */
export function makeSelectionContiguous(state: RootState): EntityId[] {
    const treeWaypointIds = selectAllTreeWaypointIds(state);
    const currentSelection = selectSelectedWaypointIds(state);
    const indices = currentSelection.map(waypointId =>
        treeWaypointIds.findIndex(treeWaypointId => treeWaypointId === waypointId)).filter(number => number !== -1);
    if (indices.length === 0) { return []; }
    const min = Math.min(...indices);
    const max = Math.max(...indices);
    return treeWaypointIds.slice(min, max + 1);
};