import { createSlice, createEntityAdapter, nanoid, PayloadAction, EntityId } from "@reduxjs/toolkit";
import { addedRoutineInternal, deletedRoutineInternal, duplicatedRoutineInternal } from "../Navbar/routinesSlice";
import { DUMMY_ID } from "../Store/dummyId";

import { AppThunk, RootState } from "../Store/store";
import { addedFolderInternal, deletedFolderInternal } from "./foldersSlice";
import { ItemType } from "./uiSlice";
import { addedWaypoint, duplicatedWaypointInternal, deletedWaypoint } from "./waypointsSlice";

export interface Path {
    id: EntityId;
    robotId: EntityId;
    folderIds: EntityId[];
    waypointIds: EntityId[];
}

const pathsAdapter = createEntityAdapter<Path>();
const simpleSelectors = pathsAdapter.getSelectors();

export const pathsSlice = createSlice({
    name: "paths",
    initialState: pathsAdapter.getInitialState(),
    reducers: {
        addedPathInternal(pathState, action: PayloadAction<{
            id: EntityId,
            routineId: EntityId,
            robotId: EntityId,
            waypointIds: EntityId[]
        }>) {
            pathsAdapter.addOne(pathState, {
                ...action.payload, // not routineId
                folderIds: []
            });
        },
        deletedPathInternal(pathState, action: PayloadAction<{
            id: EntityId,
            folderIds: EntityId[],
            waypointIds: EntityId[]
        }>) {
            pathsAdapter.removeOne(pathState, action.payload.id);
        },
        changedPath: pathsAdapter.updateOne,
    },
    extraReducers: (builder) => {
        builder
            .addCase(addedRoutineInternal, (pathState, action) => {
                pathsAdapter.addOne(pathState, {
                    ...action.payload,
                    id: action.payload.pathId,
                    folderIds: []
                });
            })
            .addCase(deletedRoutineInternal, (pathState, action) => {
                pathsAdapter.removeMany(pathState, action.payload.pathIds);
            })
            .addCase(addedWaypoint, (pathState, action) => {
                const path = simpleSelectors.selectAll(pathState).find(path => path.waypointIds.includes(action.payload.waypointId));
                if (path) {
                    if (action.payload.index && action.payload.index < path.waypointIds.length) {
                        // this inserts into the array at index
                        path.waypointIds.splice(action.payload.index, 0, action.payload.waypointId);
                    }
                    else {
                        path.waypointIds.push(action.payload.waypointId);
                    }
                    pathsAdapter.upsertOne(pathState, path);
                }
            })
            .addCase(deletedWaypoint, (pathState, action) => {
                const id = action.payload;
                let path = simpleSelectors.selectAll(pathState).find(path => path.waypointIds.includes(id));
                if (path) {
                    const newWaypointIds = path.waypointIds.filter(waypointId => waypointId !== id);
                    pathsAdapter.updateOne(pathState, { id: path.id, changes: { waypointIds: newWaypointIds } });
                }
            })
            // Add newWaypointId after waypointId in correct path
            .addCase(duplicatedWaypointInternal, (pathState, action) => {
                const path = simpleSelectors.selectAll(pathState).find(path => path.waypointIds.includes(action.payload.waypointId));
                if (path) {
                    const newWaypointIds = path.waypointIds.slice();
                    const waypointIndex = path.waypointIds.findIndex(waypointId => waypointId === action.payload.waypointId);
                    newWaypointIds.splice(waypointIndex + 1, 0, action.payload.newWaypointId);
                    pathsAdapter.updateOne(pathState, { id: path.id, changes: { waypointIds: newWaypointIds } });
                }
            })
            .addCase(addedFolderInternal, (pathState, action) => {
                const path = simpleSelectors.selectById(pathState, action.payload.pathId);
                if (path) {
                    const newFolderIds = path.folderIds.slice();
                    newFolderIds.push(action.payload.id);
                    pathsAdapter.updateOne(pathState, { id: path.id, changes: { folderIds: newFolderIds } });
                }
            })
            .addCase(deletedFolderInternal, (pathState, action) => {
                const path = simpleSelectors.selectAll(pathState).find(path => path.folderIds.includes(action.payload.id));
                if (path) {
                    const newFolderIds = path.folderIds.filter(folderId => folderId !== action.payload.id);
                    const newWaypointIds = path.waypointIds.filter(waypointId => !action.payload.waypointIds.includes(waypointId));
                    pathsAdapter.updateOne(pathState, { id: path.id, changes: { folderIds: newFolderIds, waypointIds: newWaypointIds } });
                }
            })
            .addCase(duplicatedRoutineInternal, (pathState, action) => {
                pathsAdapter.addMany(pathState, action.payload.paths);
            })
    }
});

export const deletedPath = (pathId: EntityId): AppThunk => {
    return (dispatch, getState) => {
        const path = selectPathById(getState(), pathId);
        dispatch(deletedPathInternal({
            id: pathId,
            folderIds: path?.folderIds ?? [],
            waypointIds: path?.waypointIds ?? []
        }));
    };
};

export const addedPath = (routineId: EntityId): AppThunk => {
    return (dispatch) => {
        dispatch(pathsSlice.actions.addedPathInternal({
            id: nanoid(),
            routineId,
            robotId: DUMMY_ID, // selectFirstRobotId(getState(),
            waypointIds: [nanoid(), nanoid()]
        }));
    };
};

export const {
    changedPath,
    deletedPathInternal
} = pathsSlice.actions;

// Runtime selectors
export const {
    selectById: selectPathById,
    selectIds: selectPathIds,
    selectAll: selectAllPaths,
    selectEntities: selectPathDictionary,
} = pathsAdapter.getSelectors<RootState>((state) => state.paths);

/**
 * Selects the path which owns a given waypoint or folder specified by id. 
 * @param {EntityId} folderId - The folder id to use.
 * @param {ItemType} itemType - The ItemType to use.
 * @returns {Path}
 */
export function selectOwnerPath(state: RootState, itemId: EntityId, itemType: ItemType): Path {
    let path;
    switch (itemType) {
        case ItemType.FOLDER:
            path = selectAllPaths(state).find(path => path.folderIds.includes(itemId));
            break;
        case ItemType.WAYPOINT:
            path = selectAllPaths(state).find(path => path.waypointIds.includes(itemId));
            break;
        case ItemType.ROBOT:
            path = selectAllPaths(state).find(path => path.robotId === itemId);
            break;
        default:
            throw new Error("selectOwningPath only supports folders and waypoints.");
    }
    if (!path) { throw new Error("Found orphaned path."); }
    return path;
};