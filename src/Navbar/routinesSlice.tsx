import { AppThunk, RootState } from "../Store/store";
import { Folder, selectFolderByValidId } from "../Tree/foldersSlice";
import { pathDeletedInternal, Path, selectPathByValidId } from "./pathsSlice";
import { selectActiveRoutineId } from "../Tree/uiSlice";
import { selectWaypointByValidId, Waypoint } from "../Tree/waypointsSlice";
import { selectRobotIds } from "../Tree/robotsSlice";

import { createSlice, createEntityAdapter, nanoid, PayloadAction, EntityId, Dictionary, EntityState } from "@reduxjs/toolkit";
import { assertValid, addValidIdSelector, getSimpleSelectors, getNextName } from "../Store/storeUtils";

export interface Routine {
    id: EntityId;
    name: string;
    pathIds: EntityId[];
}

const routinesAdapter = createEntityAdapter<Routine>({
    sortComparer: (a, b) => (a.name.localeCompare(b.name))
});
// Selectors which take routineState as an argument
const simpleSelectors = getSimpleSelectors(routinesAdapter);

export const routinesSlice = createSlice({
    name: "routines",
    initialState: routinesAdapter.getInitialState(),
    reducers: {
        routineAddedInternal(routineState, action: PayloadAction<{
            routineId: EntityId,
            robotId: EntityId,
            pathId: EntityId,
            waypointIds: EntityId[]
        }>) {
            const routine = {
                ...action.payload,
                id: action.payload.routineId,
                pathIds: [action.payload.pathId],
                name: getNextName(simpleSelectors.selectAll(routineState), "Routine"),
            };
            routinesAdapter.addOne(routineState, routine);
        },
        routineDeletedInternal(routineState, action: PayloadAction<{
            routineId: EntityId,
            pathIds: EntityId[],
            waypointIds: EntityId[],
            folderIds: EntityId[],
            newActiveRoutineId: EntityId | undefined
        }>) {
            routinesAdapter.removeOne(routineState, action.payload.routineId);
        },
        routineUpdated: routinesAdapter.updateOne,
        routineDuplicatedInternal(routineState, action: PayloadAction<{
            routine: Routine,
            paths: Path[],
            waypoints: Waypoint[],
            folders: Folder[]
        }>) {
            routinesAdapter.addOne(routineState, action.payload.routine);
        },
        routineRenamed(routineState, action: PayloadAction<{ newName: string, id: EntityId }>) {
            routinesAdapter.updateOne(routineState, { id: action.payload.id, changes: { name: action.payload.newName } });
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(pathDeletedInternal, (routineState, action) => {
                const routine = selectOwnerRoutineInternal(routineState, action.payload.id);
                routine.pathIds = routine.pathIds.filter(pathId => pathId !== action.payload.id);
                routinesAdapter.upsertOne(routineState, routine);
            })
    }
});

/**
 * This is a redux thunk which wraps routineDeletedInternal.
 * It also adds additional logic to delete paths as well.
 */
export function routineDeleted(routineId: EntityId): AppThunk {
    return (dispatch, getState) => {
        const state = getState();
        const routineToDelete = selectRoutineByValidId(state, routineId);
        const pathIds = routineToDelete.pathIds;

        let waypointIds: EntityId[] = [],
            folderIds: EntityId[] = [];
        pathIds.forEach(pathId => {
            const path = selectPathByValidId(state, pathId);
            waypointIds.push(...path.waypointIds);
            folderIds.push(...path.folderIds);
        });

        let newActiveRoutineId = undefined;
        const activeRoutineId = selectActiveRoutineId(state);
        if (routineId === activeRoutineId) {
            const routineIds = selectRoutineIds(state);
            if (routineIds.length > 1) {
                newActiveRoutineId = (routineIds[0] === routineId ? routineIds[1] : routineIds[0]);
            }
        }
        else { newActiveRoutineId = activeRoutineId; }

        dispatch(routineDeletedInternal({
            routineId,
            pathIds,
            folderIds,
            waypointIds,
            newActiveRoutineId
        }));
    };
}

export function routineAdded(): AppThunk {
    return (dispatch, getState) => {
        const robotIds = selectRobotIds(getState());
        dispatch(routineAddedInternal({
            routineId: nanoid(),
            robotId: robotIds[0], // selectFirstRobotId(getState())
            // only a single pathId
            pathId: nanoid(),
            waypointIds: [nanoid(), nanoid()]
        }));
    };
}

export function routineDuplicated(id: EntityId): AppThunk {
    return (dispatch, getState) => {
        // create copies of each path's waypoints and folders
        // assign the new waypoint ids and folder ids to copies of each path
        // create a copied routine with updated name and new paths
        // Each slice will then add the new objects to their state
        const state = getState();
        const routine = selectRoutineByValidId(state, id);
        const paths = routine.pathIds.map(pathId => selectPathByValidId(state, pathId));
        const waypointIds = paths.flatMap(path => path.waypointIds);

        const waypoints = paths.flatMap(path => path.waypointIds.map(waypointId => selectWaypointByValidId(state, waypointId)));

        let waypointDictionary: Dictionary<EntityId> = {};
        waypointIds.forEach(waypointId => {
            waypointDictionary[waypointId] = nanoid();
        });

        const routineCopy = Object.assign({}, routine);
        routineCopy.name = "Copy of " + routine.name;
        let arg = {
            routine: routineCopy,
            paths: [] as Path[],
            waypoints: [] as Waypoint[],
            folders: [] as Folder[]
        };

        waypoints.forEach(waypoint => {
            const waypointCopy = Object.assign({}, waypoint);
            waypointCopy.id = waypointDictionary[waypoint.id] as EntityId;
            arg.waypoints.push(waypointCopy);
        });

        paths.forEach(path => {
            const pathCopy = Object.assign({}, path);
            pathCopy.id = nanoid();

            pathCopy.waypointIds = pathCopy.waypointIds.map(waypointId => waypointDictionary[waypointId]) as EntityId[];
            pathCopy.folderIds = pathCopy.folderIds.map(folderId => {
                const folderCopy = Object.assign({}, selectFolderByValidId(state, folderId));
                folderCopy.id = nanoid();

                folderCopy.waypointIds = folderCopy.waypointIds.map(waypointId => waypointDictionary[waypointId]) as EntityId[];
                arg.folders.push(folderCopy);
                return folderCopy.id;
            });
            arg.paths.push(pathCopy);
        });

        arg.routine.id = nanoid();
        arg.routine.pathIds = arg.paths.map(path => path.id);

        dispatch(routineDuplicatedInternal(arg));
    };
}

export const {
    routineAddedInternal,
    routineDeletedInternal,
    routineUpdated,
    routineDuplicatedInternal,
    routineRenamed
} = routinesSlice.actions;

export function selectRoutineSlice(state: RootState) {
    return state.history.present.routines;
}

// Runtime selectors
export const {
    selectById: selectRoutineById,
    selectByValidId: selectRoutineByValidId,
    selectIds: selectRoutineIds,
    selectAll: selectAllRoutines,
    selectEntities: selectRoutineDictionary
} = addValidIdSelector(routinesAdapter.getSelectors<RootState>(selectRoutineSlice));

/**
 * Selects the routine which owns a given path.
 * @param pathId - The item id to use.
 * @param itemType - The ItemType to use.
 */
export function selectOwnerRoutine(state: RootState, pathId: EntityId): Routine {
    return selectOwnerRoutineInternal(selectRoutineSlice(state), pathId);
}

function selectOwnerRoutineInternal(routineState: EntityState<Routine>, pathId: EntityId) {
    const routine = simpleSelectors.selectAll(routineState).find(routine => routine.pathIds.includes(pathId));
    return assertValid(routine);
}
