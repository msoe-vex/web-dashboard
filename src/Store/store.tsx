import { configureStore, EntityState, EntityId, nanoid } from '@reduxjs/toolkit';

import { routinesSlice, Routine } from '../Navbar/routinesSlice';
import { pathsSlice, Path } from '../Tree/pathsSlice';

export interface RootState {
    readonly routines: EntityState<Routine> & { activeRoutineId: EntityId };
    readonly paths: EntityState<Path>;
}

const preloadedId = nanoid();

const preloadedState: RootState = {
    routines: {
        ids: [preloadedId],
        entities: {
            [preloadedId]: { id: preloadedId, name: "Routine 1", pathIds: [] as EntityId[] },
        },
        activeRoutineId: preloadedId
    },
    paths: {
        ids: [],
        entities: {}
    }
}

export const store = configureStore({
    preloadedState: preloadedState,
    reducer: {
        routines: routinesSlice.reducer,
        // robots: robotsSlice.reducer,
        paths: pathsSlice.reducer,
    }
});