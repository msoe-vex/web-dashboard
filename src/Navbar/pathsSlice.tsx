import { createSlice, createEntityAdapter, nanoid, PayloadAction, EntityId, EntityState } from "@reduxjs/toolkit";
import undoable from "redux-undo";
import { addedRoutineInternal, deletedRoutineInternal, duplicatedRoutineInternal } from "./routinesSlice";
import { DUMMY_ID, getErrorlessSelectors } from "../Store/storeUtils";

import { AppThunk, RootState } from "../Store/store";
import { addedFolderInternal, deletedFolderInternal } from "../Tree/foldersSlice";
import { ItemType } from "../Tree/tempUiSlice";
import { addedWaypoint, duplicatedWaypointInternal, deletedWaypoint } from "../Tree/waypointsSlice";

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
            .addCase(duplicatedRoutineInternal, (pathState, action) => {
                pathsAdapter.addMany(pathState, action.payload.paths);
            })
            .addCase(addedWaypoint, (pathState, action) => {
                const { waypointId, index } = action.payload;
                const path = selectOwnerPathInternal(pathState, waypointId, ItemType.WAYPOINT);
                // inserts into the array at index
                path.waypointIds.splice(index ?? path.waypointIds.length, 0, waypointId);
                pathsAdapter.upsertOne(pathState, path);
            })
            .addCase(deletedWaypoint, (pathState, action) => {
                const path = selectOwnerPathInternal(pathState, action.payload, ItemType.WAYPOINT);
                const newWaypointIds = path.waypointIds.filter(waypointId => waypointId !== action.payload);
                pathsAdapter.updateOne(pathState, { id: path.id, changes: { waypointIds: newWaypointIds } });
            })
            // Add newWaypointId after waypointId in correct path
            .addCase(duplicatedWaypointInternal, (pathState, action) => {
                const path = selectOwnerPathInternal(pathState, action.payload.waypointId, ItemType.WAYPOINT);
                const newWaypointIds = path.waypointIds.slice();
                const waypointIndex = path.waypointIds.findIndex(waypointId => waypointId === action.payload.waypointId);
                newWaypointIds.splice(waypointIndex + 1, 0, action.payload.newWaypointId);
                pathsAdapter.updateOne(pathState, { id: path.id, changes: { waypointIds: newWaypointIds } });
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
                const path = selectOwnerPathInternal(pathState, action.payload.id, ItemType.FOLDER);
                const newFolderIds = path.folderIds.filter(folderId => folderId !== action.payload.id);
                const newWaypointIds = path.waypointIds.filter(waypointId => !action.payload.waypointIds.includes(waypointId));
                pathsAdapter.updateOne(pathState, { id: path.id, changes: { folderIds: newFolderIds, waypointIds: newWaypointIds } });
            })
    }
});


export function deletedPath(pathId: EntityId): AppThunk {
    return (dispatch, getState) => {
        const path = selectPathById(getState(), pathId);
        // const routineId = selectOwnerRoutine(pathId);
        dispatch(deletedPathInternal({
            id: pathId,
            folderIds: path?.folderIds ?? [],
            waypointIds: path?.waypointIds ?? []
        }));
    };
}

export function addedPath(routineId: EntityId): AppThunk {
    return (dispatch) => {
        dispatch(pathsSlice.actions.addedPathInternal({
            id: nanoid(),
            routineId,
            robotId: DUMMY_ID, // selectFirstRobotId(getState(),
            waypointIds: [nanoid(), nanoid()]
        }));
    };
}

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
} = getErrorlessSelectors(pathsAdapter.getSelectors<RootState>((state) => state.history.present.paths));

/**
 * Selects the path which owns a given waypoint, folder, or robot.
 * @param itemId - The item id to use.
 * @param itemType - The ItemType to use.
 */
export function selectOwnerPath(state: RootState, itemId: EntityId, itemType: ItemType.FOLDER | ItemType.WAYPOINT | ItemType.ROBOT): Path {
    return selectOwnerPathInternal(state.history.present.paths, itemId, itemType);
}

function selectOwnerPathInternal(pathState: EntityState<Path>, itemId: EntityId, itemType: ItemType.FOLDER | ItemType.WAYPOINT | ItemType.ROBOT) {
    let path : Path | undefined;
    switch (itemType) {
        case ItemType.FOLDER:
            path = simpleSelectors.selectAll(pathState).find(path => path.folderIds.includes(itemId));
            break;
        case ItemType.WAYPOINT:
            path = simpleSelectors.selectAll(pathState).find(path => path.waypointIds.includes(itemId));
            break;
        case ItemType.ROBOT:
            path = simpleSelectors.selectAll(pathState).find(path => path.robotId === itemId);
            break;
        default:
            throw new Error("selectOwnerPath only supports folders, waypoints, and robots.");
    }
    if (!path) { throw new Error("Found orphaned item."); }
    return path;
}