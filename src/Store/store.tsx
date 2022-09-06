import { configureStore, ThunkAction, AnyAction } from "@reduxjs/toolkit";

import { fieldSlice } from "../Field/fieldSlice";
// import { splinesSlice } from "../Field/splinesSlice";
import { routinesSlice } from "../Navbar/routinesSlice";
import { foldersSlice } from "../Tree/foldersSlice";
import { pathsSlice } from "../Tree/pathsSlice";
import { uiSlice } from "../Tree/uiSlice";
import { waypointsSlice } from "../Tree/waypointsSlice"

// const preloadedId = nanoid();
// const preloadedState = {
//     routines: {
//         ids: [preloadedId],
//         entities: {
//             [preloadedId]: { id: preloadedId, name: "Routine 1", pathIds: [] },
//         },
//         activeRoutineId: preloadedId
//     },
// }

export const store = configureStore({
    // preloadedState: preloadedState,
    reducer: {
        field: fieldSlice.reducer,
        routines: routinesSlice.reducer,
        // robots: robotsSlice.reducer,
        paths: pathsSlice.reducer,
        waypoints: waypointsSlice.reducer,
        folders: foldersSlice.reducer,
        // splines: splinesSlice.reducer,
        ui: uiSlice.reducer
    }
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export type AppThunk<ReturnType = void> = ThunkAction<ReturnType, RootState, unknown, AnyAction>;