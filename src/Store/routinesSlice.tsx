import { createSlice, createEntityAdapter, nanoid, PayloadAction, EntityId } from '@reduxjs/toolkit';

export interface Routine {
    readonly id: EntityId;
    readonly name: string;
    readonly pathIds: EntityId[];
}

export const routinesAdapter = createEntityAdapter<Routine>({
    // selectId: (routine: Routine) => { return routine.id; },
    sortComparer: (a, b) => (a.name.localeCompare(b.name))
});

export const routinesSlice = createSlice({
    name: 'routines',
    initialState: routinesAdapter.getInitialState({ activeRoutineId: "" as EntityId }),
    reducers: {
        addedRoutine: {
            reducer(state, action: PayloadAction<Routine>) {
                routinesAdapter.addOne(state, action.payload);
                state.activeRoutineId = action.payload.id;
            },
            prepare(name: string) {
                return {
                    payload: {
                        id: nanoid(),
                        name: name,
                        pathIds: []
                    }
                };
            }
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