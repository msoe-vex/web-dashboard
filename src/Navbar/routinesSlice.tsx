import { createSlice, createEntityAdapter, nanoid, PayloadAction, EntityId, Dictionary } from "@reduxjs/toolkit";
import undoable from "redux-undo";
import { DUMMY_ID } from "../Store/dummyId";

// JavaScript handles circular imports like a champ
import { AppThunk, RootState } from "../Store/store";
import { Folder, selectFolderById } from "../Tree/foldersSlice";
import { Path, selectPathById } from "../Tree/pathsSlice";
import { selectActiveRoutineId } from "../Tree/uiSlice";
import { getNextName } from "../Tree/Utils";
import { selectWaypointById, Waypoint } from "../Tree/waypointsSlice";

export interface Routine {
    id: EntityId;
    name: string;
    pathIds: EntityId[];
}

const routinesAdapter = createEntityAdapter<Routine>({
    sortComparer: (a, b) => (a.name.localeCompare(b.name))
});

// Selectors which take routineState as an argument
const simpleSelectors = routinesAdapter.getSelectors();

export const routinesSlice = createSlice({
    name: "routines",
    initialState: routinesAdapter.getInitialState(),
    reducers: {
        addedRoutineInternal(routineState, action: PayloadAction<{
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
        deletedRoutineInternal(routineState, action: PayloadAction<{
            routineId: EntityId,
            pathIds: EntityId[],
            waypointIds: EntityId[],
            folderIds: EntityId[],
            newActiveRoutineId: EntityId
        }>) {
            routinesAdapter.removeOne(routineState, action.payload.routineId);
        },
        updatedRoutine: routinesAdapter.updateOne,
        duplicatedRoutineInternal(routineState, action: PayloadAction<{
            routine: Routine,
            paths: Path[],
            waypoints: Waypoint[],
            folders: Folder[]
        }>) {
            routinesAdapter.addOne(routineState, action.payload.routine);
        },
        renamedRoutine(routineState, action: PayloadAction<{ newName: string, id: EntityId }>) {
            let routine = simpleSelectors.selectById(routineState, action.payload.id);
            if (routine !== undefined) {
                routinesAdapter.updateOne(routineState, { id: action.payload.id, changes: { name: action.payload.newName } });
            }
        }
    },
});

/**
 * This is a redux thunk which wraps deletedRoutineInternal.
 * It also adds additional logic to delete paths as well.
 */
export function deletedRoutine(routineId: EntityId): AppThunk {
    return (dispatch, getState) => {
        let arg = {
            routineId,
            pathIds: [] as EntityId[],
            folderIds: [] as EntityId[],
            waypointIds: [] as EntityId[],
            newActiveRoutineId: DUMMY_ID
        };

        const state = getState();

        const routineToDelete = selectRoutineById(state, routineId);
        if (routineToDelete !== undefined) {
            arg.pathIds = routineToDelete.pathIds;
            arg.pathIds.forEach(pathId => {
                const path = selectPathById(state, pathId);
                if (path !== undefined) {
                    arg.waypointIds.push(...path.waypointIds);
                    arg.folderIds.push(...path.folderIds);
                }
            });
        }

        if (selectActiveRoutineId(state) === routineId) {
            const routineIds = selectRoutineIds(state);
            arg.newActiveRoutineId = routineIds[0] === routineId ? routineIds[1] : routineIds[0];
        }
        dispatch(deletedRoutineInternal(arg));
    };
}

export function addedRoutine(): AppThunk {
    return (dispatch) => {
        dispatch(addedRoutineInternal({
            routineId: nanoid(),
            robotId: DUMMY_ID, // selectFirstRobotId(getState())
            // only a single pathId
            pathId: nanoid(),
            waypointIds: [nanoid(), nanoid()]
        }));
    };
}

export function duplicatedRoutine(id: EntityId): AppThunk {
    return (dispatch, getState) => {
        // create copies of each path's waypoints and folders
        // assign the new waypoint ids and folder ids to copies of each path
        // create a copied routine with updated name and new paths
        // Each slice will then add the new objects to their state
        const state = getState();
        const routine = selectRoutineById(state, id);
        const paths = routine?.pathIds.map(pathId => selectPathById(state, pathId));
        const waypointIds = paths?.flatMap(path => path?.waypointIds);

        const waypoints = paths?.flatMap(path => path?.waypointIds.map(waypointId => selectWaypointById(state, waypointId)));

        let waypointDictionary: Dictionary<EntityId> = {};
        waypointIds?.forEach(waypointId => {
            if (waypointId) { waypointDictionary[waypointId] = nanoid(); }
        });

        const routineCopy = Object.assign({}, routine);
        routineCopy.name = "Copy of " + routine?.name;
        let arg = {
            routine: routineCopy,
            paths: [] as Path[],
            waypoints: [] as Waypoint[],
            folders: [] as Folder[]
        };

        waypoints?.forEach(waypoint => {
            if (!waypoint) { throw new Error("Expected valid waypoint."); }
            const waypointCopy = Object.assign({}, waypoint);
            waypointCopy.id = waypointDictionary[waypoint.id] as EntityId;
            arg.waypoints.push(waypointCopy);
        });

        paths?.forEach(path => {
            if (!path) { throw new Error("Expected valid path."); }
            const pathCopy = Object.assign({}, path);
            pathCopy.id = nanoid();

            pathCopy.waypointIds = pathCopy.waypointIds.map(waypointId => waypointDictionary[waypointId]) as EntityId[];
            pathCopy.folderIds = pathCopy.folderIds.map(folderId => {
                const folderCopy = Object.assign({}, selectFolderById(state, folderId));
                folderCopy.id = nanoid();

                folderCopy.waypointIds = folderCopy.waypointIds.map(waypointId => waypointDictionary[waypointId]) as EntityId[];
                arg.folders.push(folderCopy);
                return folderCopy.id;
            });
            arg.paths.push(pathCopy);
        });

        arg.routine.id = nanoid();
        arg.routine.pathIds = arg.paths.map(path => path.id);

        dispatch(duplicatedRoutineInternal(arg));
    };
}

export const {
    addedRoutineInternal,
    deletedRoutineInternal,
    updatedRoutine,
    duplicatedRoutineInternal,
    renamedRoutine
} = routinesSlice.actions;

export const routinesSliceReducer = undoable(routinesSlice.reducer);

// Runtime selectors
export const {
    selectById: selectRoutineById,
    selectIds: selectRoutineIds,
    selectAll: selectAllRoutines,
    selectEntities: selectRoutineDictionary
} = routinesAdapter.getSelectors<RootState>(state => state.history.present.routines);