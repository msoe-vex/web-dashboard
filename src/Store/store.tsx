import { configureStore, EntityState, EntityId, nanoid } from '@reduxjs/toolkit';

import { routinesSlice, Routine } from './routinesSlice';

export interface RootState {
    readonly routines: EntityState<Routine> & { activeRoutineId: EntityId };
}

const preloadedId = nanoid();

const preloadedState: RootState = {
    routines: {
        ids: [preloadedId],
        entities: {
            [preloadedId]: { id: preloadedId, name: "Routine 1", pathIds: [] as EntityId[] },
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