import { createSlice, PayloadAction, EntityId } from "@reduxjs/toolkit";
import { addedRoutineInternal, deletedRoutineInternal } from "../Navbar/routinesSlice";
import { RootState } from "../Store/store";

/**
 * @typedef {Object} UI
 * @property {EntityId} activeRoutine - The currently active routine.
 * @property {Object} folders - A mapping of pathIds to arrays containing start and end indicies.
 * @property {EntityId[]} highlightedWaypoints - A list of waypoints which should be highlighted.
 *      Takes precedence over activeWaypoints.
 * @property {EntityId[]} activeWaypoints - A list of waypoints which are currently visible.
 * @property {boolean} editMenuActive - A boolean describing whether an editMenu is currently active.
 */
export interface UI {
    activeRoutineId: EntityId,
    folders: {
        EntityId: [{ startIndex: number, endIndex: number }]
    },
    highlightedWaypointIds: EntityId[],
    activeWaypointIds: EntityId[],
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
    } as UI,
    reducers: {
        selectedActiveRoutine(uiState, action: PayloadAction<EntityId>) {
            uiState.activeRoutineId = action.payload;
        },
        selectedWaypoints(uiState, action: PayloadAction<EntityId[]>) {
            if (!uiState.editMenuActive)
                uiState.highlightedWaypointIds = action.payload;
        },
        deselectedWaypoints(uiState, action: PayloadAction) {
            uiState.highlightedWaypointIds = [];
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
    selectedWaypoints,
    deselectedWaypoints,
} = uiSlice.actions;

export const selectActiveRoutineId = (state: RootState) => state.ui.activeRoutineId;