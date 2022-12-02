import { createSlice, createEntityAdapter, nanoid, PayloadAction, EntityId, EntityState } from "@reduxjs/toolkit";
import { routineAddedInternal, routineDeletedInternal, routineDuplicatedInternal } from "./routinesSlice";
import { addValidIdSelector, assertValid, getNextName, getSimpleSelectors, makeUpdate } from "../Store/storeUtils";

import { AppThunk, RootState } from "../Store/store";
import { folderAddedInternal, folderDeletedInternal } from "../Tree/foldersSlice";
import { ItemType, selectionDeletedInternal } from "../Tree/tempUiSlice";
import { waypointAdded, waypointDuplicatedInternal, waypointDeletedInternal } from "../Tree/waypointsSlice";
import { selectRobotIds } from "../Tree/robotsSlice";

export interface Path {
    name: string;
    id: EntityId;
    robotId: EntityId;
    folderIds: EntityId[];
    waypointIds: EntityId[];
}

const pathsAdapter = createEntityAdapter<Path>();
const simpleSelectors = getSimpleSelectors(pathsAdapter);

export const pathsSlice = createSlice({
    name: "paths",
    initialState: pathsAdapter.getInitialState(),
    reducers: {
        pathAddedInternal(pathState, action: PayloadAction<{
            id: EntityId,
            routineId: EntityId,
            robotId: EntityId,
            waypointIds: EntityId[]
        }>) {
            pathsAdapter.addOne(pathState, {
                ...action.payload, // not routineId
                name: getNextName(simpleSelectors.selectAll(pathState), "Path"),
                folderIds: []
            });
        },
        pathDeletedInternal(pathState, action: PayloadAction<{
            id: EntityId,
            folderIds: EntityId[],
            waypointIds: EntityId[]
        }>) {
            pathsAdapter.removeOne(pathState, action.payload.id);
        },
        pathChanged: pathsAdapter.updateOne,
    },
    extraReducers: (builder) => {
        builder
            .addCase(routineAddedInternal, (pathState, action) => {
                pathsAdapter.addOne(pathState, {
                    ...action.payload,
                    name: getNextName(simpleSelectors.selectAll(pathState), "Path"),
                    id: action.payload.pathId,
                    folderIds: []
                });
            })
            .addCase(routineDeletedInternal, (pathState, action) => {
                pathsAdapter.removeMany(pathState, action.payload.pathIds);
            })
            .addCase(routineDuplicatedInternal, (pathState, action) => {
                pathsAdapter.addMany(pathState, action.payload.paths);
            })
            .addCase(waypointAdded, (pathState, action) => {
                const { waypointId, index } = action.payload;
                const path = selectOwnerPathInternal(pathState, waypointId, ItemType.WAYPOINT);
                // inserts into the array at index
                path.waypointIds.splice(index ?? path.waypointIds.length, 0, waypointId);
                pathsAdapter.updateOne(pathState, makeUpdate(path.id, { waypointIds: path.waypointIds }));
            })
            // Add newWaypointId after waypointId in correct path
            .addCase(waypointDuplicatedInternal, (pathState, action) => {
                const path = selectOwnerPathInternal(pathState, action.payload.waypointId, ItemType.WAYPOINT);
                const newWaypointIds = path.waypointIds.slice();
                const waypointIndex = path.waypointIds.findIndex(waypointId => waypointId === action.payload.waypointId);
                newWaypointIds.splice(waypointIndex + 1, 0, action.payload.newWaypointId);
                pathsAdapter.updateOne(pathState, makeUpdate(path.id, { waypointIds: newWaypointIds }));
            })
            .addCase(folderAddedInternal, (pathState, action) => {
                const path = simpleSelectors.selectById(pathState, action.payload.pathId);
                const newFolderIds = path.folderIds.slice();
                newFolderIds.push(action.payload.id);
                pathsAdapter.updateOne(pathState, makeUpdate(path.id, { folderIds: newFolderIds }));
            })
            .addCase(waypointDeletedInternal, (pathState, action) => {
                const path = selectOwnerPathInternal(pathState, action.payload.id, ItemType.WAYPOINT);
                const newWaypointIds = path.waypointIds.filter(waypointId => waypointId !== action.payload.id);

                const newFolderIds = action.payload.deleteFolder ?
                    path.folderIds.filter(folderId => folderId !== action.payload.folderId) : path.folderIds;

                pathsAdapter.updateOne(pathState,
                    makeUpdate(path.id, {
                        waypointIds: newWaypointIds,
                        folderIds: newFolderIds
                    }));
            })
            .addCase(folderDeletedInternal, (pathState, action) => {
                const path = selectOwnerPathInternal(pathState, action.payload.id, ItemType.FOLDER);
                const newFolderIds = path.folderIds.filter(folderId => folderId !== action.payload.id);
                const newWaypointIds = path.waypointIds.filter(waypointId => !action.payload.waypointIds.includes(waypointId));
                pathsAdapter.updateOne(pathState, makeUpdate(path.id, { folderIds: newFolderIds, waypointIds: newWaypointIds }));
            })
            .addCase(selectionDeletedInternal, (pathState, action) => {
                const updates = action.payload.folderIds.map(folderId => {
                    const path = selectOwnerPathInternal(pathState, folderId, ItemType.FOLDER);
                    const newFolderIds = path.folderIds.filter(currFolderId => currFolderId !== folderId);
                    const newWaypointIds = path.waypointIds.filter(waypointId => !action.payload.waypointIds.includes(waypointId));
                    return makeUpdate(path.id, { folderIds: newFolderIds, waypointIds: newWaypointIds });
                });
                pathsAdapter.updateMany(pathState, updates);
            })
    }
});

export function pathDeleted(pathId: EntityId): AppThunk {
    return (dispatch, getState) => {
        const path = assertValid(selectPathById(getState(), pathId));
        dispatch(pathDeletedInternal({
            id: pathId,
            folderIds: path.folderIds,
            waypointIds: path.waypointIds,
            // don't attach routine since routine can figure it out
        }));
    };
}

export function pathAdded(routineId: EntityId): AppThunk {
    return (dispatch, getState) => {
        const robotIds = selectRobotIds(getState());
        dispatch(pathsSlice.actions.pathAddedInternal({
            id: nanoid(),
            routineId,
            robotId: robotIds[0],
            waypointIds: [nanoid(), nanoid()]
        }));
    };
}

export const {
    pathChanged,
    pathDeletedInternal
} = pathsSlice.actions;

export function selectPathSlice(state: RootState) {
    return state.history.present.paths;
}

// Runtime selectors
export const {
    selectById: selectPathById,
    selectByValidId: selectPathByValidId,
    selectIds: selectPathIds,
    selectAll: selectAllPaths,
    selectEntities: selectPathDictionary,
} = addValidIdSelector(pathsAdapter.getSelectors<RootState>(selectPathSlice));

/**
 * Selects the path which owns a given waypoint, folder, or robot.
 * @param id - The item id to use.
 * @param itemType - The ItemType to use.
 */
export function selectOwnerPath(state: RootState, id: EntityId, itemType: ItemType.FOLDER | ItemType.WAYPOINT | ItemType.ROBOT): Path {
    return selectOwnerPathInternal(selectPathSlice(state), id, itemType);
}

function selectOwnerPathInternal(pathState: EntityState<Path>, id: EntityId, itemType: ItemType.FOLDER | ItemType.WAYPOINT | ItemType.ROBOT) {
    let path: Path | undefined;
    const paths = simpleSelectors.selectAll(pathState);
    switch (itemType) {
        case ItemType.FOLDER:
            path = paths.find(path => path.folderIds.includes(id));
            break;
        case ItemType.WAYPOINT:
            path = paths.find(path => path.waypointIds.includes(id));
            break;
        case ItemType.ROBOT:
            path = paths.find(path => path.robotId === id);
            break;
        default:
            throw new Error("selectOwnerPath only supports folders, waypoints, and robots.");
    }
    return assertValid(path);
}
