import { configureStore, EntityState, EntityId, nanoid } from '@reduxjs/toolkit';

import { routinesSlice, routinesAdapter, Routine } from './routinesSlice';

export interface RootState {
    readonly routines: EntityState<Routine> & { activeRoutineId: EntityId };
}

const preloadedId = nanoid();
const secondId = nanoid();

const preloadedState: RootState = {
    routines: {
        ids: [preloadedId, secondId],
        entities: {
            [preloadedId]: { id: preloadedId, name: "Hello", pathIds: [] as EntityId[] },
            [secondId]: { id: secondId, name: "Second routine", pathIds: [] as EntityId[] }
        },
        activeRoutineId: preloadedId
    }

}

export const store = configureStore({
    preloadedState: preloadedState,
    reducer: {
        routines: routinesSlice.reducer,
        // robots: robotsSlice.reducer,
    }
});



export const {
    selectById: selectRoutine,
    selectIds: selectRoutineIds,
    selectAll: selectAllRoutines,
} = routinesAdapter.getSelectors<RootState>((state) => state.routines);

export const selectActiveRoutineId = (state: RootState) => state.routines.activeRoutineId;

// export const selectActiveRoutine = routinesSelectors.selectById(store.getState(), store.getState().routines.activeRoutineId);
// export const selectRoutineIds = routinesSelectors.selectIds(store.getState());
// export const selectRoutine = (id: EntityId) => { return routinesSelectors.selectById(store.getState(), id); }

// export const selectRoutine = (id: EntityId) => { return routineSelectors.selectById(store.getState(), id); }
