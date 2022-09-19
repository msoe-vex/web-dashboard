import { configureStore, ThunkAction, AnyAction, combineReducers } from "@reduxjs/toolkit";

import { fieldSlice } from "../Field/fieldSlice";
import { foldersSlice } from "../Tree/foldersSlice";
import { robotsSlice } from "../Tree/robotsSlice";
import { allItemsDeselected, splineMouseEnter, splineMouseLeave, uiSlice } from "../Tree/uiSlice";
import undoable, { excludeAction, groupByActionTypes } from "redux-undo";
import { routinesSlice } from "../Navbar/routinesSlice";
import { pathsSlice } from "../Tree/pathsSlice";
import { waypointMagnitudeMoved, waypointMoved, waypointsSlice } from "../Tree/waypointsSlice";

const rootReducer = combineReducers({
    field: fieldSlice.reducer,
    routines: routinesSlice.reducer,
    robots: robotsSlice.reducer,
    paths: pathsSlice.reducer,
    waypoints: waypointsSlice.reducer,
    folders: foldersSlice.reducer,
    ui: uiSlice.reducer
});

const undoableReducer = undoable(rootReducer, {
    limit: 100,
    // ignoreInitialState: true
    filter: excludeAction([
        uiSlice.actions.itemMouseEnterInternal.type,
        uiSlice.actions.itemMouseLeaveInternal.type,
        uiSlice.actions.itemBatchSelectedInternal.type,
        uiSlice.actions.itemSelectedInternal.type,
        splineMouseEnter.type,
        splineMouseLeave.type,
        allItemsDeselected.type,
    ]),
    groupBy: groupByActionTypes([waypointMagnitudeMoved.type, waypointMoved.type]),
    // neverSkipReducer: true,
    syncFilter: true
});

export const store = configureStore({ reducer: undoableReducer });

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export type AppThunk<ReturnType = void> = ThunkAction<ReturnType, RootState, unknown, AnyAction>;