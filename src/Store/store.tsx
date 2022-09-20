import { configureStore, ThunkAction, AnyAction, combineReducers } from "@reduxjs/toolkit";

import { fieldSlice } from "../Field/fieldSlice";
import { foldersSlice, renamedFolder } from "../Tree/foldersSlice";
import { robotsSlice } from "../Tree/robotsSlice";
import { allItemsDeselected, splineMouseEnter, splineMouseLeave, splineSelected, treeItemsCollapsed, treeItemsExpanded, uiSlice } from "../Tree/uiSlice";
import undoable, { excludeAction, GroupByFunction } from "redux-undo";
import { renamedRoutine, routinesSlice } from "../Navbar/routinesSlice";
import { pathsSlice } from "../Tree/pathsSlice";
import { renamedWaypoint, waypointMagnitudeMoved, waypointMoved, waypointsSlice } from "../Tree/waypointsSlice";

const rootReducer = combineReducers({
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
    waypointMoved.type,
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
            (action.type === waypointMoved.type ||
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

const undoableReducer = undoable(rootReducer, {
    limit: 200,
    filter: excludeAction([
        uiSlice.actions.itemMouseEnterInternal.type,
        uiSlice.actions.itemMouseLeaveInternal.type,
        uiSlice.actions.itemBatchSelectedInternal.type,
        uiSlice.actions.itemSelectedInternal.type,
        splineMouseEnter.type,
        splineMouseLeave.type,
        splineSelected.type,
        allItemsDeselected.type,
        // tree expand/collapse doesn't go in state
        treeItemsCollapsed.type,
        treeItemsExpanded.type
    ]),
    groupBy: groupActions
    // neverSkipReducer: true
});

export const store = configureStore({ reducer: undoableReducer });

// manual declaration of RootState, to prevent issues with ciruclar references
// export type RootState = StateWithHistory<CombinedState<{
//     field: Field;
//     routines: EntityState<Routine>;
//     robots: EntityState<Robot>;
//     paths: EntityState<Path>;
//     waypoints: EntityState<Waypoint>;
//     folders: EntityState<Folder>;
//     ui: UI;
// }>>;
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export type AppThunk<ReturnType = void> = ThunkAction<ReturnType, RootState, unknown, AnyAction>;