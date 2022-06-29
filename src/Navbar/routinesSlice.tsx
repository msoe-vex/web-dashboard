import { createSlice, createEntityAdapter, nanoid, PayloadAction, EntityId } from "@reduxjs/toolkit";
import { DUMMY_ID } from "../Store/dummyId";

// JavaScript handles circular imports like a champ
import { AppThunk, RootState } from "../Store/store";
import { addedPath, deletedPath, selectPathById } from "../Tree/pathsSlice";

export interface Routine {
    readonly id: EntityId;
    readonly name: string;
    // Should be two pathIds only?
    readonly pathIds: EntityId[];
}

export const routinesAdapter = createEntityAdapter<Routine>({
    sortComparer: (a, b) => (a.name.localeCompare(b.name))
});

// Selectors which take routineState as an argument
const simpleSelectors = routinesAdapter.getSelectors();

function getNextName(routines: Routine[]): string {
    const checkName = (newName: string): boolean =>
        routines.every(routine => routine.name !== newName);

    for (let i = 1; ; ++i) {
        if (checkName("Routine " + i))
            return "Routine " + i;
    }
}

export const routinesSlice = createSlice({
    name: "routines",
    initialState: routinesAdapter.getInitialState({ activeRoutineId: DUMMY_ID }),
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
                name: getNextName(simpleSelectors.selectAll(routineState)),
            };
            routinesAdapter.addOne(routineState, routine);
            routineState.activeRoutineId = routine.id;
        },
        deletedRoutineInternal(routineState, action: PayloadAction<{
            routineId: EntityId,
            pathIds: EntityId[],
            waypointIds: EntityId[]
        }>) {
            routinesAdapter.removeOne(routineState, action.payload.routineId);
            if (action.payload.routineId === routineState.activeRoutineId) {
                // what happens if state.ids is empty?
                routineState.activeRoutineId = routineState.ids[0];
            }
        },
        updatedRoutine: routinesAdapter.updateOne,
        selectedRoutine(routineState, action: PayloadAction<EntityId>) {
            routineState.activeRoutineId = action.payload;
        },
        copiedRoutine(routineState, action: PayloadAction<EntityId>) {
            const routine = Object.assign({}, routineState.entities[action.payload]);
            if (routine !== undefined) {
                routine.id = nanoid();
                routine.name = "Copy of " + routine.name;
                routinesAdapter.addOne(routineState, routine);
                routineState.activeRoutineId = routine.id;
            }
        },
        renamedRoutine(routineState, action: PayloadAction<{ newName: string, id: EntityId }>) {
            let routine = routineState.entities[action.payload.id];
            if (routine !== undefined) {
                routine.name = action.payload.newName;
            }
        }
    },
});

/**
 * This is a redux thunk which wraps deletedRoutineInternal.
 * It also adds additional logic to delete paths as well.
 */
export const deletedRoutine = (routineId: EntityId): AppThunk => {
    return (dispatch, getState) => {
        const routineToDelete = selectRoutineById(getState(), routineId);
        let pathIds: EntityId[] = [];
        let waypointIds: EntityId[] = [];
        if (routineToDelete !== undefined) {
            pathIds = routineToDelete.pathIds;
            pathIds.forEach(pathId => {
                const path = selectPathById(getState(), pathId);
                if (path !== undefined) {
                    waypointIds.concat(path.waypointIds);
                }
            });
        }

        dispatch(deletedRoutineInternal({
            routineId: routineId,
            pathIds: pathIds,
            waypointIds: waypointIds
        }));
    };
}

export const addedRoutine = (): AppThunk => {
    return (dispatch, getState) => {
        dispatch(addedRoutineInternal({
            routineId: nanoid(),
            robotId: DUMMY_ID, // selectFirstRobotId(getState())
            // only a single pathId
            pathId: nanoid(),
            waypointIds: [nanoid(), nanoid()]
        }));
    };
};

export const {
    addedRoutineInternal,
    deletedRoutineInternal,
    updatedRoutine,
    selectedRoutine,
    copiedRoutine,
    renamedRoutine
} = routinesSlice.actions;

// Runtime selectors
export const {
    selectById: selectRoutineById,
    selectIds: selectRoutineIds,
    selectAll: selectAllRoutines,
} = routinesAdapter.getSelectors<RootState>((state) => state.routines);

export const selectActiveRoutineId = (state: RootState) => state.routines.activeRoutineId;