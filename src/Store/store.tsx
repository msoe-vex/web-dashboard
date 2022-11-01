import {
    configureStore,
    ThunkAction,
    AnyAction,
    combineReducers,
} from "@reduxjs/toolkit";

import { fieldSlice } from "../Field/fieldSlice";
import { foldersSlice, renamedFolder } from "../Tree/foldersSlice";
import { robotsSlice } from "../Tree/robotsSlice";
import { uiSlice } from "../Tree/uiSlice";
import undoable, { GroupByFunction } from "redux-undo";
import { renamedRoutine, routinesSlice } from "../Navbar/routinesSlice";
import { pathsSlice } from "../Tree/pathsSlice";
import { renamedWaypoint, waypointMagnitudeMoved, waypointMovedInternal, waypointRobotRotated, waypointsSlice } from "../Tree/waypointsSlice";
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
    waypointRobotRotated.type
];

const groupActionTypes = [
    renamedWaypoint.type,
    renamedRoutine.type,
    renamedFolder.type
].concat(dragActionTypes);

// let ignoreRapid = false;
let prevAction: AnyAction;
const groupActions: GroupByFunction = (action) => {
    if (groupActionTypes.includes(action.type)) {
        if (prevAction &&
            action.type === prevAction.type &&
            dragActionTypes.includes(action.type) &&
            action.payload.id === prevAction.payload.id) {
            prevAction = action;
            return false;
        }
        else {
            prevAction = action;
            return false;
        }
        // if (!prevAction || action.type !== prevAction.type) {
        //     ignoreRapid = false;
        //     prevAction = action;
        //     return true; // try to group
        // }

        // if (action.type === waypointMoved.type || action.type === waypointMagnitudeMoved.type) {
        //     if (action.payload.id !== prevAction.payload.id) {
        //         return false; // don't batch if different moved
        //     }
        // }

        // if (ignoreRapid) { return false; }

        // ignoreRapid = true;
        // setTimeout(() => { ignoreRapid = false; }, 500)
        // return true;
    }
    return true;
}

const undoableReducer = undoable(stateReducer, {
    limit: 200,
    groupBy: groupActions
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