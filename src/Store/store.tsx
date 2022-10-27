import { configureStore, ThunkAction, AnyAction, combineReducers } from "@reduxjs/toolkit";

import { fieldSlice } from "../Field/fieldSlice";
import { foldersSlice, renamedFolder } from "../Tree/foldersSlice";
import { robotsSlice } from "../Tree/robotsSlice";
import { uiSlice } from "../Tree/uiSlice";
import undoable, { excludeAction, GroupByFunction } from "redux-undo";
import { renamedRoutine, routinesSlice } from "../Navbar/routinesSlice";
import { pathsSlice } from "../Tree/pathsSlice";
import { renamedWaypoint, waypointMagnitudeMoved, waypointMovedInternal, waypointsSlice } from "../Tree/waypointsSlice";
import {
    tempUiSlice,
} from "../Tree/tempUiSlice";

const stateReducer = combineReducers({
    field: fieldSlice.reducer,
    routines: routinesSlice.reducer,
    robots: robotsSlice.reducer,
    paths: pathsSlice.reducer,
    waypoints: waypointsSlice.reducer,
    folders: foldersSlice.reducer,
    ui: uiSlice.reducer
});

const groupActionTypes = [
    waypointMagnitudeMoved.type,
    waypointMovedInternal.type,
    renamedWaypoint.type,
    renamedRoutine.type,
    renamedFolder.type
];

// let ignoreRapid = false;
let prevAction: AnyAction;
const groupActions: GroupByFunction = (action) => {
    if (groupActionTypes.includes(action.type)) {
        if (prevAction &&
            action.type === prevAction.type &&
            (action.type === waypointMovedInternal.type ||
                action.type === waypointMagnitudeMoved.type) &&
            action.payload.id === prevAction.payload.id) {
            prevAction = action;
            return true;
        }
        prevAction = action;
        return false;
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
    filter: excludeAction([
        // tempUiSlice.actions.itemMouseEnterInternal.type,
        // tempUiSlice.actions.itemMouseLeaveInternal.type,
        // tempUiSlice.actions.itemBatchSelectedInternal.type,
        // tempUiSlice.actions.itemSelectedInternal.type,
        // splineMouseEnter.type,
        // splineMouseLeave.type,
        // splineSelected.type,
        // allItemsDeselected.type,
        // // tree expand/collapse doesn't go in state
        // treeItemsCollapsed.type,
        // treeItemsExpanded.type
    ]),
    groupBy: groupActions
});

export const store = configureStore({
    reducer: combineReducers({
        history: undoableReducer,
        tempUi: tempUiSlice.reducer
    })
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export type AppThunk<ReturnType = void> = ThunkAction<ReturnType, RootState, unknown, AnyAction>;
export type Store = typeof store;