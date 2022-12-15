import {
    configureStore,
    ThunkAction,
    AnyAction,
    combineReducers,
} from "@reduxjs/toolkit";

import { fieldSlice } from "../Field/fieldSlice";
import { foldersSlice } from "../Tree/foldersSlice";
import { robotsSlice } from "../Tree/robotsSlice";
import { uiSlice } from "../Tree/uiSlice";
import undoable from "redux-undo";
import { routinesSlice } from "../Navbar/routinesSlice";
import { pathsSlice } from "../Navbar/pathsSlice";
import { waypointMagnitudeMoved, waypointMovedInternal, waypointRobotRotated, waypointsSlice } from "../Tree/waypointsSlice";
import { tempUiSlice, } from "../Tree/tempUiSlice";
import { listenerMiddleware } from "./localStorage";

const stateReducer = combineReducers({
    field: fieldSlice.reducer,
    routines: routinesSlice.reducer,
    robots: robotsSlice.reducer,
    paths: pathsSlice.reducer,
    waypoints: waypointsSlice.reducer,
    folders: foldersSlice.reducer,
    ui: uiSlice.reducer
});


const dragActionTypes = [
    waypointMagnitudeMoved.type,
    waypointMovedInternal.type,
    waypointRobotRotated.type,
];
// other args: currentState: any, previousHistory: StateWithHistory<any>
function filterActions(action: AnyAction): boolean {
    if (dragActionTypes.includes(action.type)) {
        return false;
    }
    return true;
};

const undoableReducer = undoable(stateReducer, {
    limit: 200,
    filter: filterActions
});

function getPreloadedState() {
    const store = localStorage.getItem("store");
    if (!store) { return undefined; }
    return {
        tempUi: tempUiSlice.getInitialState(),
        history: {
            present: JSON.parse(store),
            past: [],
            future: []
        }
    };
}

export const store = configureStore({
    preloadedState: getPreloadedState(),
    reducer: combineReducers({
        history: undoableReducer,
        tempUi: tempUiSlice.reducer
    }),
    middleware: (getDefaultMiddleware) => getDefaultMiddleware().prepend(listenerMiddleware.middleware)
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export type AppThunk<ReturnType = void> = ThunkAction<ReturnType, RootState, unknown, AnyAction>;
export type Store = typeof store;