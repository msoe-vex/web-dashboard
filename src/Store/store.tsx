import { configureStore, nanoid, ThunkAction, AnyAction } from "@reduxjs/toolkit";

import { routinesSlice } from "../Navbar/routinesSlice";
import { pathsSlice } from "../Tree/pathsSlice";
import { waypointsSlice } from "../Tree/waypointsSlice"

const preloadedId = nanoid();
const preloadedState = {
    routines: {
        ids: [preloadedId],
        entities: {
            [preloadedId]: { id: preloadedId, name: "Routine 1", pathIds: [] },
        },
        activeRoutineId: preloadedId
    },
    // paths: {
    //     ids: [],
    //     entities: {}
    // },
    // waypoints: {
    //     ids: [],
    //     entities: {}
    // },
    // endWaypoints: {
    //     ids: [],
    //     entities: {}
    // }
}

export const store = configureStore({
    preloadedState: preloadedState,
    reducer: {
        routines: routinesSlice.reducer,
        // robots: robotsSlice.reducer,
        paths: pathsSlice.reducer,
        waypoints: waypointsSlice.reducer,
    }
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export type AppThunk<ReturnType = void> = ThunkAction<ReturnType, RootState, unknown, AnyAction>;