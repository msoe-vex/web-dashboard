import { createSlice, createEntityAdapter, nanoid, PayloadAction, EntityId } from "@reduxjs/toolkit";
import { DUMMY_ID } from "../Store/dummyId";

// JavaScript handles circular imports like a champ
import { AppThunk, RootState } from "../Store/store";
import { selectPathById } from "../Tree/pathsSlice";
import { selectActiveRoutineId } from "../Tree/uiSlice";

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
                name: getNextName(simpleSelectors.selectAll(routineState)),
            };
            routinesAdapter.addOne(routineState, routine);
        },
        deletedRoutineInternal(routineState, action: PayloadAction<{
            routineId: EntityId,
            pathIds: EntityId[],
            waypointIds: EntityId[],
            newActiveRoutineId?: EntityId
        }>) {
            routinesAdapter.removeOne(routineState, action.payload.routineId);
        },
        updatedRoutine: routinesAdapter.updateOne,
        copiedRoutine(routineState, action: PayloadAction<EntityId>) {
            const routine = Object.assign({}, routineState.entities[action.payload]);
            if (routine !== undefined) {
                routine.id = nanoid();
                routine.name = "Copy of " + routine.name;
                routinesAdapter.addOne(routineState, routine);
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
        let arg = {
            routineId,
            pathIds: [] as EntityId[],
            waypointIds: [] as EntityId[],
            newActiveRoutineId: undefined as EntityId | undefined
        };

        const routineToDelete = selectRoutineById(getState(), routineId);
        if (routineToDelete !== undefined) {
            arg.pathIds = routineToDelete.pathIds;
            arg.pathIds.forEach(pathId => {
                const path = selectPathById(getState(), pathId);
                if (path !== undefined) {
                    arg.waypointIds = arg.waypointIds.concat(path.waypointIds);
                }
            });
        }

        if (selectActiveRoutineId(getState()) === routineId) {
            arg.newActiveRoutineId = selectAllRoutines(getState())[0].id;
        }
        dispatch(deletedRoutineInternal(arg));
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
    copiedRoutine,
    renamedRoutine
} = routinesSlice.actions;

// Runtime selectors
export const {
    selectById: selectRoutineById,
    selectIds: selectRoutineIds,
    selectAll: selectAllRoutines,
} = routinesAdapter.getSelectors<RootState>((state) => state.routines);