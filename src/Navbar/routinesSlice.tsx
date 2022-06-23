import { createSlice, createEntityAdapter, nanoid, PayloadAction, EntityId } from '@reduxjs/toolkit';
import { DUMMY_ID } from '../Store/dummyId';

// JavaScript handles circular imports like a champ
import { RootState } from '../Store/store';

export interface Routine {
    readonly id: EntityId;
    readonly name: string;
    readonly pathIds: EntityId[];
}

export const routinesAdapter = createEntityAdapter<Routine>({
    // selectId: (routine: Routine) => { return routine.id; },
    sortComparer: (a, b) => (a.name.localeCompare(b.name))
});

// Selectors which can be used in the reducer
const simpleSelectors = routinesAdapter.getSelectors();

function getNextName(routines: Routine[]): string {
    const checkName = (newName: string): boolean =>
        routines.every(routine => routine.name !== newName);

    let i = 1;
    for (; ; ++i) {
        if (checkName("Routine " + i))
            return "Routine " + i;
    }
}

export const routinesSlice = createSlice({
    name: 'routines',
    initialState: routinesAdapter.getInitialState({ activeRoutineId: DUMMY_ID }),
    reducers: {
        addedRoutine(state, action: PayloadAction<undefined>) {
            const routine = {
                id: nanoid(),
                name: getNextName(simpleSelectors.selectAll(state)),
                pathIds: []
            };
            routinesAdapter.addOne(state, routine);
            state.activeRoutineId = routine.id;
        },
        changedRoutine: routinesAdapter.updateOne,
        deletedRoutine(state, action: PayloadAction<EntityId>) {
            routinesAdapter.removeOne(state, action);
            if (action.payload === state.activeRoutineId) {
                // what happens if state.ids is empty?
                state.activeRoutineId = state.ids[0];
            }
        },
        selectedRoutine(state, action: PayloadAction<EntityId>) {
            state.activeRoutineId = action.payload;
        },
        copiedRoutine(state, action: PayloadAction<EntityId>) {
            const routine = Object.assign({}, state.entities[action.payload]);
            if (routine !== undefined) {
                routine.id = nanoid();
                routine.name = "Copy of " + routine.name;
                routinesAdapter.addOne(state, routine);
                state.activeRoutineId = routine.id;
            }
        },
        renamedRoutine(state, action: PayloadAction<{ newName: string, id: EntityId }>) {
            let routine = state.entities[action.payload.id];
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