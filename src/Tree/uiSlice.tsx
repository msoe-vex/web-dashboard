import { createSlice, PayloadAction, EntityId } from "@reduxjs/toolkit";
import { routineAddedInternal, routineDeletedInternal, Routine, selectRoutineByValidId } from "../Navbar/routinesSlice";
import { AppThunk, RootState } from "../Store/store";
import { includesAll, removeAll } from "../Store/storeUtils";
import { selectSelectedWaypointIds, selectContainedWaypointIds, ItemType } from "./tempUiSlice";
import { selectAllTreeWaypointIds } from "./treeActions";

/**
 * @typedef Ui
 * @property activeRoutineId - The id of the currently active routine.
 * @property hiddenWaypointIds - A list of waypoints which are currently hidden.
 */
export interface Ui {
    activeRoutineId?: EntityId;
    hiddenWaypointIds: EntityId[];
}

const defaultUiState: Ui = {
    activeRoutineId: undefined,
    hiddenWaypointIds: []
};

/**
 * Stores UI state and related actions.
 * Notably is responsible for handling UI options like selecting waypoints (which highlights them in the window)
 * and showing/hiding waypoints. 
 * Although some of these behaviors could be feasibly captured directly in waypoints, it breaks "UI logic" away
 * from information which has no effect on the generated path.
 */
export const uiSlice = createSlice({
    name: "ui",
    initialState: defaultUiState,
    reducers: {
        activeRoutineSelected(uiState, action: PayloadAction<EntityId>) {
            uiState.activeRoutineId = action.payload;
        },
        itemVisibilityToggledInternal(uiState, action: PayloadAction<{
            containedWaypointIds: EntityId[],
            selectedWaypointIds: EntityId[]
        }>) {
            const { containedWaypointIds, selectedWaypointIds } = action.payload;
            // if every contained waypoint is already hidden, nowHidden is false
            const nowHidden = !includesAll(uiState.hiddenWaypointIds, containedWaypointIds);

            // If the clicked eye icon is currently part of a selection:
            if (includesAll(selectedWaypointIds, containedWaypointIds)) {
                // hide selection (which is guaranteed to contain container children)
                if (nowHidden) { uiState.hiddenWaypointIds.push(...selectedWaypointIds); }
                else {
                    // hide selection (which is guaranteed to contain container children)
                    uiState.hiddenWaypointIds = removeAll(uiState.hiddenWaypointIds, selectedWaypointIds);
                }
            } else {
                if (nowHidden) { uiState.hiddenWaypointIds.push(...containedWaypointIds); }
                else {
                    uiState.hiddenWaypointIds = removeAll(uiState.hiddenWaypointIds, containedWaypointIds);
                }
            }
        },
        allItemsShown(uiState) { uiState.hiddenWaypointIds = []; },
        allItemsHiddenInternal(uiState, action: PayloadAction<EntityId[]>) {
            uiState.hiddenWaypointIds = action.payload;
        },
        itemSelectionShownInternal(uiState, action: PayloadAction<EntityId[]>) {
            uiState.hiddenWaypointIds = removeAll(uiState.hiddenWaypointIds, action.payload);
        },
        itemSelectionHiddenInternal(uiState, action: PayloadAction<EntityId[]>) {
            uiState.hiddenWaypointIds.push(...action.payload);
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(routineDeletedInternal, (uiState, action) => {
                uiState.activeRoutineId = action.payload.newActiveRoutineId;
            })
            .addCase(routineAddedInternal, (uiState, action) => { uiState.activeRoutineId = action.payload.routineId; })
    }
});

export function itemSelectionShown(): AppThunk {
    return (dispatch, getState) => {
        dispatch(itemSelectionShownInternal(selectSelectedWaypointIds(getState())));
    }
}

export function itemSelectionHidden(): AppThunk {
    return (dispatch, getState) => {
        dispatch(itemSelectionHiddenInternal(selectSelectedWaypointIds(getState())));
    }
}

export function allItemsHidden(): AppThunk {
    return (dispatch, getState) => {
        dispatch(uiSlice.actions.allItemsHiddenInternal(
            selectAllTreeWaypointIds(getState())
        ));
    }
}

export function itemVisibilityToggled(id: EntityId | EntityId[], itemType: ItemType): AppThunk {
    return (dispatch, getState) => {
        const state = getState();
        dispatch(uiSlice.actions.itemVisibilityToggledInternal({
            containedWaypointIds: selectContainedWaypointIds(state, id, itemType),
            selectedWaypointIds: selectSelectedWaypointIds(state)
        }));
    };
}

export const {
    allItemsShown,
    itemSelectionHiddenInternal,
    itemSelectionShownInternal,
    activeRoutineSelected
} = uiSlice.actions;

export function selectActiveRoutineId(state: RootState) { return state.history.present.ui.activeRoutineId; }
export function selectActiveRoutine(state: RootState): Routine | undefined {
    const activeRoutineId = selectActiveRoutineId(state);
    // undefined if activeRoutineId is undefined
    return activeRoutineId && selectRoutineByValidId(state, activeRoutineId);
}
export function selectHiddenWaypointIds(state: RootState) { return state.history.present.ui.hiddenWaypointIds; }