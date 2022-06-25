import { createSlice, createEntityAdapter, nanoid, PayloadAction, EntityId } from "@reduxjs/toolkit";
import { DUMMY_ID } from "../Store/dummyId";

// JavaScript handles circular imports like a champ
import { RootState } from "../Store/store";

export interface Routine {
    readonly id: EntityId;
    readonly name: string;
    // should probably be two pathIds only
    readonly pathIds: EntityId[];
}

export const routinesAdapter = createEntityAdapter<Routine>({
    sortComparer: (a, b) => (a.name.localeCompare(b.name))
});

// Selectors which can be used in the reducer
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
        addedRoutine(routineState, action: PayloadAction<undefined>) {
            const routine = {
                id: nanoid(),
                name: getNextName(simpleSelectors.selectAll(routineState)),
                pathIds: []
            };
            routinesAdapter.addOne(routineState, routine);
            routineState.activeRoutineId = routine.id;
        },
        changedRoutine: routinesAdapter.updateOne,
        deletedRoutine(routineState, action: PayloadAction<EntityId>) {
            routinesAdapter.removeOne(routineState, action);
            if (action.payload === routineState.activeRoutineId) {
                // what happens if state.ids is empty?
                routineState.activeRoutineId = routineState.ids[0];
            }
        },
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
    }
});

export const {
    addedRoutine,
    deletedRoutine,
    changedRoutine,
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