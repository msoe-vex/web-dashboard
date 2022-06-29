import { createSlice, PayloadAction, EntityId } from "@reduxjs/toolkit";
import { addedRoutineInternal, deletedRoutineInternal } from "../Navbar/routinesSlice";
import { DUMMY_ID } from "../Store/dummyId";
import { RootState } from "../Store/store";

/**
 * @typedef {Object} UI
 * @property {EntityId} activeRoutine - The currently active routine.
 * @property {EntityId[]} highlightedWaypointIds - A list of waypoints which should be highlighted.
 *      Takes precedence over activeWaypoints.
 * @property {EntityId[]} hiddenWaypointIds - A list of waypoints which are currently hidden.
 * @property {boolean} editMenuActive - A boolean describing whether an editMenu is currently active.
 */
export interface UI {
    activeRoutineId: EntityId,
    highlightedWaypointIds: EntityId[],
    hiddenWaypointIds: EntityId[],
    editMenuActive: boolean
}

/**
 * Stores UI state and related actions.
 * Notably is responsible for handling UI options like selecting waypoints (which highlights them in the window)
 * and showing/hiding waypoints. 
 * Although some of these behaviors could be feasibly captured direclty in waypoints, it breaks "UI logic" away
 * from information which has no effect on the generated path.
 */
export const uiSlice = createSlice({
    name: "ui",
    initialState: {
        activeRoutineId: DUMMY_ID,
        highlightedWaypointIds: [],
        hiddenWaypointIds: [],
        editMenuActive: false
    } as UI,
    reducers: {
        selectedActiveRoutine(uiState, action: PayloadAction<EntityId>) {
            uiState.activeRoutineId = action.payload;
        },
        selectedWaypoint(uiState, action: PayloadAction<{
            selectedWaypointId: EntityId,
            controlKeyHeld: boolean,
            shiftKeyHeld: boolean
        }>) {
            if (action.payload.controlKeyHeld) {
                if (uiState.highlightedWaypointIds.includes(action.payload.selectedWaypointId)) {
                    uiState.highlightedWaypointIds =
                        uiState.highlightedWaypointIds.filter(id => id !== action.payload.selectedWaypointId);
                }
                else {
                    uiState.highlightedWaypointIds.push(action.payload.selectedWaypointId);
                }
            }
            else if (action.payload.shiftKeyHeld) {
                // add all highlighted betweeen last selected (last item in highlightedWaypointIds) and current
                // probably need a thunk to read paths state
                // set to all between last selected and shift click location
            }
            else {
                if (uiState.highlightedWaypointIds.includes(action.payload.selectedWaypointId)) {
                    uiState.highlightedWaypointIds = [];
                }
                else {
                    uiState.highlightedWaypointIds = [action.payload.selectedWaypointId];
                }
            }
        },
        deselectedWaypoints(uiState, action: PayloadAction) {
            uiState.highlightedWaypointIds = [];
        },
        waypointVisibilityToggled(uiState, action: PayloadAction<EntityId>) {
            // inverse of whether its currently hidden
            const nowHidden = !uiState.hiddenWaypointIds.includes(action.payload);

            if (uiState.highlightedWaypointIds.includes(action.payload)) {
                if (nowHidden) { // add highlighted to hidden
                    uiState.hiddenWaypointIds =
                        uiState.hiddenWaypointIds.concat(uiState.highlightedWaypointIds);
                }
                else { // remove highlighted from hidden - if highlighted includes existing id, remove it
                    uiState.hiddenWaypointIds =
                        uiState.hiddenWaypointIds.filter(existingId => !uiState.highlightedWaypointIds.includes(existingId));
                }
            }
            else {
                if (nowHidden) {
                    uiState.hiddenWaypointIds.push(action.payload);
                }
                else {
                    uiState.hiddenWaypointIds =
                        uiState.hiddenWaypointIds.filter(id => id !== action.payload);
                }
            }
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(deletedRoutineInternal, (uiState, action) => {
                if (action.payload.newActiveRoutineId) {
                    uiState.activeRoutineId = action.payload.newActiveRoutineId;
                }
            })
            .addCase(addedRoutineInternal, (uiState, action) => {
                uiState.activeRoutineId = action.payload.routineId;
            })
    }
});

export const {
    selectedActiveRoutine,
    selectedWaypoint,
    deselectedWaypoints,
    waypointVisibilityToggled
} = uiSlice.actions;

export const selectActiveRoutineId = (state: RootState): EntityId => state.ui.activeRoutineId;
export const selectHighlightedWaypointIds = (state: RootState): EntityId[] => state.ui.highlightedWaypointIds;
export const selectHiddenWaypointIds = (state: RootState): EntityId[] => state.ui.hiddenWaypointIds;