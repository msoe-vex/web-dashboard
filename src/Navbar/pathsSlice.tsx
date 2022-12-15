import { createSlice, createEntityAdapter, nanoid, PayloadAction, EntityId, EntityState } from "@reduxjs/toolkit";
import { routineAddedInternal, routineDeletedInternal, routineDuplicatedInternal } from "./routinesSlice";
import { addValidIdSelector, assertValid, getNextName, getSimpleSelectors, makeUpdate, remove, removeAll } from "../Store/storeUtils";

import { AppThunk, RootState } from "../Store/store";
import { folderAddedInternal, folderDeletedInternal } from "../Tree/foldersSlice";
import { ItemType, selectionDeletedInternal } from "../Tree/tempUiSlice";
import { waypointDuplicatedInternal, waypointDeletedInternal, waypointAddedInternal, waypointInserted } from "../Tree/waypointsSlice";
import { selectRobotIds } from "../Tree/robotsSlice";

export interface Path {
    name: string;
    id: EntityId;
    robotId: EntityId;
    // unordered
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
            .addCase(waypointAddedInternal, (pathState, action) => {
                // TODO : append id to path.waypointIds
            })
            .addCase(waypointInserted, (pathState, action) => {
                // TODO : add waypointIds to appropriate path (use selectOwnerPathInternal)
                // Note order does matter
                // Bonus: extract logic for waypointDuplicated case to a function and use here and below
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
                const { id, deleteFolder, folderId } = action.payload;
                const path = selectOwnerPathInternal(pathState, id, ItemType.WAYPOINT);
                removeIdsFromPath(pathState, path, { waypointIds: [id], folderIds: (deleteFolder ? [folderId ?? ""] : undefined) });
            })
            .addCase(folderDeletedInternal, (pathState, action) => {
                const path = selectOwnerPathInternal(pathState, action.payload.id, ItemType.FOLDER);
                removeIdsFromPath(pathState, path, { ...action.payload, folderIds: [action.payload.id] });
            })
            .addCase(selectionDeletedInternal, (pathState, action) => {
                const { folderIds, waypointIds, updateWaypointIds } = action.payload;
                folderIds.forEach(folderId => {
                    const path = selectOwnerPathInternal(pathState, folderId, ItemType.FOLDER);
                    removeIdsFromPath(pathState, path, { waypointIds, folderIds: [folderId] });
                });

                // yikes performance wise
                updateWaypointIds.forEach(waypointId => {
                    const path = selectOwnerPathInternal(pathState, waypointId, ItemType.WAYPOINT);
                    removeIdsFromPath(pathState, path, { waypointIds: [waypointId] });
                });
            })
    }
});

function removeIdsFromPath(pathState: EntityState<Path>, path: Path, idsToRemove: {
    waypointIds?: EntityId[],
    folderIds?: EntityId[]
}) {
    const newWaypointIds = idsToRemove.waypointIds ? removeAll(path.waypointIds, idsToRemove.waypointIds) : path.waypointIds;
    const newFolderIds = idsToRemove.folderIds ? removeAll(path.folderIds, idsToRemove.folderIds) : path.folderIds;
    pathsAdapter.updateOne(pathState, makeUpdate(path.id, { waypointIds: newWaypointIds, folderIds: newFolderIds }));
}

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
