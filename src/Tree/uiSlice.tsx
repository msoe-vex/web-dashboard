import { createSlice, PayloadAction, EntityId } from "@reduxjs/toolkit";
import { addedRoutineInternal, deletedRoutineInternal, Routine, selectRoutineByValidId } from "../Navbar/routinesSlice";
import { AppThunk, RootState } from "../Store/store";
import { SelectableItemType, selectSelectedWaypointIds, selectContainedWaypointIds } from "./tempUiSlice";
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
    hiddenWaypointIds: [],
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
        selectedActiveRoutine(uiState, action: PayloadAction<EntityId>) {
            uiState.activeRoutineId = action.payload;
        },
        itemVisibilityToggledInternal(uiState, action: PayloadAction<{
            containedWaypointIds: EntityId[],
            selectedWaypointIds: EntityId[]
        }>) {
            const { containedWaypointIds, selectedWaypointIds } = action.payload;
            // if every contained waypoint is already hidden, nowHidden is false
            const nowHidden = !containedWaypointIds.every(containedId => uiState.hiddenWaypointIds.includes(containedId));

            // If the clicked eye icon is currently part of a selection:
            if (containedWaypointIds.every(containedId => selectedWaypointIds.includes(containedId))) {
                if (nowHidden) {
                    // hide selection (which is guaranteed to contain container children)
                    uiState.hiddenWaypointIds.push(...selectedWaypointIds);
                } else {
                    uiState.hiddenWaypointIds =
                        // hide selection (which is guaranteed to contain container children)
                        uiState.hiddenWaypointIds.filter(hiddenId => !selectedWaypointIds.includes(hiddenId));
                }
            } else {
                if (nowHidden) {
                    uiState.hiddenWaypointIds.push(...containedWaypointIds);
                } else {
                    uiState.hiddenWaypointIds = uiState.hiddenWaypointIds.filter(hiddenId => !containedWaypointIds.includes(hiddenId));
                }
            }
        },
        allItemsShown(uiState) { uiState.hiddenWaypointIds = []; },
        allItemsHiddenInternal(uiState, action: PayloadAction<EntityId[]>) { uiState.hiddenWaypointIds = action.payload; },
        itemSelectionShownInternal(uiState, action: PayloadAction<EntityId[]>) {
            uiState.hiddenWaypointIds = uiState.hiddenWaypointIds.filter(hiddenId => !action.payload.includes(hiddenId));
        },
        itemSelectionHiddenInternal(uiState, action: PayloadAction<EntityId[]>) { uiState.hiddenWaypointIds.push(...action.payload); },
    },
    extraReducers: (builder) => {
        builder
            .addCase(deletedRoutineInternal, (uiState, action) => {
                uiState.activeRoutineId = action.payload.newActiveRoutineId;
            })
            .addCase(addedRoutineInternal, (uiState, action) => { uiState.activeRoutineId = action.payload.routineId; })
    }
});

export function itemSelectionShown(): AppThunk {
    return (dispatch, getState) =>
        dispatch(uiSlice.actions.itemSelectionShownInternal(selectSelectedWaypointIds(getState())));
}

export function itemSelectionHidden(): AppThunk {
    return (dispatch, getState) =>
        dispatch(uiSlice.actions.itemSelectionHiddenInternal(selectSelectedWaypointIds(getState())));
}

export function allItemsHidden(): AppThunk {
    return (dispatch, getState) =>
        dispatch(uiSlice.actions.allItemsHiddenInternal(
            selectAllTreeWaypointIds(getState())
        ));
}

export function itemVisibilityToggled(itemId: EntityId | EntityId[], itemType: SelectableItemType): AppThunk {
    return (dispatch, getState) => {
        const state = getState();
        dispatch(uiSlice.actions.itemVisibilityToggledInternal({
            containedWaypointIds: selectContainedWaypointIds(state, itemId, itemType),
            selectedWaypointIds: selectSelectedWaypointIds(state)
        }));
    };
}

export const {
    selectedActiveRoutine,
    allItemsShown,
} = uiSlice.actions;

export function selectActiveRoutineId(state: RootState) { return state.history.present.ui.activeRoutineId; }
export function selectActiveRoutine(state: RootState): Routine | undefined {
    const activeRoutineId = selectActiveRoutineId(state);
    return activeRoutineId ? selectRoutineByValidId(state, activeRoutineId) : undefined;
}

export function selectHiddenWaypointIds(state: RootState) { return state.history.present.ui.hiddenWaypointIds; }