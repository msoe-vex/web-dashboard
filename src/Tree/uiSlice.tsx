import { createSlice, PayloadAction, EntityId } from "@reduxjs/toolkit";
import { addedRoutineInternal, deletedRoutineInternal, selectRoutineById } from "../Navbar/routinesSlice";
import { DUMMY_ID } from "../Store/dummyId";
import { AppThunk, RootState } from "../Store/store";
import { selectFolderWaypointIds } from "./foldersSlice";
import { selectPathById } from "./pathsSlice";
import { selectAllTreeWaypointIds } from "./treeActions";

/**
 * @typedef {Object} UI
 * @property {EntityId} activeRoutineId - The id of the currently active routine.
 * @property {EntityId[]} hoveredWaypointIds - A list of waypoints which are hovered. 
 *      Triggered by the MouseEnter and MouseLeave events. Hovering is an array to support highlighting folder and path contents.
 * @property {EntityId[]} selectedWaypointIds - A list of waypoints which are selected.
 *      Takes precedence over activeWaypoints.
 * @property {EntityId[]} hiddenWaypointIds - A list of waypoints which are currently hidden.
 * @property {EntityId[]} collapsedIds - A list of folderIds representing collapsed folders.
 * @property {EntityId[][]} hoveredSplineIds - A list of waypointId pairs representing splines which are currently hovered.
 * @property {EntityId[][]} selectedSplineIds - A list of waypointId pairs representing splines which are currently selected.
 */
export interface UI {
    activeRoutineId: EntityId,
    hoveredWaypointIds: EntityId[],
    selectedWaypointIds: EntityId[],
    hiddenWaypointIds: EntityId[],
    collapsedIds: EntityId[],
    hoveredSplineIds: EntityId[][],
    selectedSplineIds: EntityId[][]
}

// Eventually, uiSlice will also store:
// Absolute Menu Position
// Field zoom/position

export enum ItemType {
    PATH = 0,
    ROBOT = 1,
    WAYPOINT = 2,
    SPLINE = 3,
    FOLDER = 4
}

/**
 * Any ItemType which has an explicit entry in the tree.
 */
export type TreeItemType = ItemType.PATH | ItemType.FOLDER | ItemType.WAYPOINT;
export type SelectableItemType = TreeItemType | ItemType.SPLINE;

const defaultUIState: UI = {
    activeRoutineId: DUMMY_ID,
    hoveredWaypointIds: [],
    selectedWaypointIds: [],
    hiddenWaypointIds: [],
    collapsedIds: [],
    hoveredSplineIds: [],
    selectedSplineIds: []
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
    initialState: defaultUIState,
    reducers: {
        selectedActiveRoutine(uiState, action: PayloadAction<EntityId>) {
            // Completely reset UI state to avoid editing hidden routine
            const newUIState = defaultUIState;
            // preserve hiddenWaypointIds
            newUIState.hiddenWaypointIds = uiState.hiddenWaypointIds;
            newUIState.activeRoutineId = action.payload;
            return newUIState; // return new state when completely replacing uiState
        },
        itemBatchSelectedInternal(uiState, action: PayloadAction<{
            treeWaypointIds: EntityId[],
            containedWaypointIds: EntityId[],
        }>) {
            uiState.selectedSplineIds = []; // deselect splines
            // cases:
            // if tree is empty, do nothing
            // if no waypoints are currently selected, select the entire tree
            // If all waypoints are currently selected, deselect the entire tree
            // if the last selected waypoint isn't in the tree (should be impossible), do nothing
            // If shift selected waypoint does not exist, do nothing (should be impossible)
            const { treeWaypointIds, containedWaypointIds } = action.payload;
            if (treeWaypointIds.length === 0) { return; }
            // If nothing is selected, select all
            else if (uiState.selectedWaypointIds.length === 0) {
                uiState.selectedWaypointIds = treeWaypointIds;
                return;
                // If everything is already selected, deselect all
            } else if (treeWaypointIds.every(treeWaypointId => uiState.selectedWaypointIds.includes(treeWaypointId))) {
                uiState.selectedWaypointIds = [];
                return;
            }

            const lastSelectedId = uiState.selectedWaypointIds[uiState.selectedWaypointIds.length - 1];
            // If single shift clicked waypoint is already selected, do nothing
            if (containedWaypointIds.length === 1 && containedWaypointIds.includes(lastSelectedId)) { return; }

            let lastSelectedIndex = treeWaypointIds.findIndex(treeId => treeId === lastSelectedId);
            // should be impossible - need to sanitize UI when switching routines though
            if (lastSelectedIndex === -1) { throw new Error("Expected last selected index to exist in tree."); }

            const index = treeWaypointIds.findIndex(treeId => treeId === containedWaypointIds[containedWaypointIds.length - 1]);

            if (index === -1) { throw new Error("Expected id to exist in tree."); }
            // won't be same as index since lastSelectedId is not in containedWaypointIds
            else if (lastSelectedIndex < index) {
                // container = 5, 6 (index = 6), lastSelected = 2, we want 3, 4, 5, 6 (in that order)
                // min handles special case of container = 4, 5, 6, lastSelected = 5
                const slice = treeWaypointIds.slice(Math.min(index + 1 - containedWaypointIds.length, lastSelectedIndex + 1), index + 1);
                uiState.selectedWaypointIds.push(...slice);
            } else {
                // container = 1, 2, 3, lastSelected = 5, we want 4, 3, 2, 1
                // slice is 4
                const slice = treeWaypointIds.slice(index + 1, lastSelectedIndex).reverse();
                // copy is 1, 2, 3
                const copy: EntityId[] = [];
                containedWaypointIds.forEach(containedId => copy.unshift(containedId));
                uiState.selectedWaypointIds.push(...slice, ...copy);
            }
        },
        itemSelectedInternal(uiState, action: PayloadAction<EntityId[]>) {
            const containedWaypointIds = action.payload;
            // If every containedWaypointId is already selected, remove them
            if (containedWaypointIds.every(containedId => uiState.selectedWaypointIds.includes(containedId))) {
                uiState.selectedWaypointIds = uiState.selectedWaypointIds.filter(selectedId => !containedWaypointIds.includes(selectedId));
            } else {
                uiState.selectedSplineIds = []; // remove spline id selection
                // reverse so shift click is based on first element
                const reversed: EntityId[] = [];
                containedWaypointIds.forEach(containedId => reversed.unshift(containedId));
                uiState.selectedWaypointIds.push(...reversed);
            }
        },
        allItemsDeselected(uiState) {
            uiState.selectedWaypointIds = [];
            uiState.selectedSplineIds = [];
        },
        itemVisibilityToggledInternal(uiState, action: PayloadAction<EntityId[]>) {
            const containedWaypointIds = action.payload;
            // if every contained waypoint is already hidden, nowHidden is false
            const nowHidden = !containedWaypointIds.every(containedId => uiState.hiddenWaypointIds.includes(containedId));

            // If the clicked eye icon is currently part of a selection:
            if (containedWaypointIds.every(containedId => uiState.selectedWaypointIds.includes(containedId))) {
                if (nowHidden) {
                    // hide selection (which is guaranteed to contain container children)
                    uiState.hiddenWaypointIds.push(...uiState.selectedWaypointIds);
                } else {
                    uiState.hiddenWaypointIds =
                        // hide selection (which is guaranteed to contain container children)
                        uiState.hiddenWaypointIds.filter(hiddenId => !uiState.selectedWaypointIds.includes(hiddenId));
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
        itemSelectionShown(uiState) {
            uiState.hiddenWaypointIds = uiState.hiddenWaypointIds.filter(hiddenId => !uiState.selectedWaypointIds.includes(hiddenId));
        },
        itemSelectionHidden(uiState) { uiState.hiddenWaypointIds.push(...uiState.selectedWaypointIds); },
        treeItemsExpanded(uiState, action: PayloadAction<EntityId[]>) {
            uiState.collapsedIds = uiState.collapsedIds.filter(collapsedId => !action.payload.includes(collapsedId));
        },
        treeItemsCollapsed(uiState, action: PayloadAction<EntityId[]>) { uiState.collapsedIds.push(...action.payload); },
        itemMouseEnterInternal(uiState, action: PayloadAction<EntityId[]>) { uiState.hoveredWaypointIds.push(...action.payload); },
        itemMouseLeaveInternal(uiState, action: PayloadAction<EntityId[]>) {
            uiState.hoveredWaypointIds = uiState.hoveredWaypointIds.filter(hoveredWaypointId => !action.payload.includes(hoveredWaypointId));
        },
        splineMouseEnter(uiState, action: PayloadAction<EntityId[]>) {
            if (action.payload.length !== 2) { throw new Error("Expected spline to have two waypoints."); }
            uiState.hoveredSplineIds.push(action.payload);
        },
        splineMouseLeave(uiState, action: PayloadAction<EntityId[]>) {
            if (action.payload.length !== 2) { throw new Error("Expected spline to have two waypoints."); }
            // removes array sets that share every id with an id in action.payload
            uiState.hoveredSplineIds = uiState.hoveredSplineIds.filter(splineIds => !splineIds.every(splineId => action.payload.includes(splineId)));
        },
        splineSelected(uiState, action: PayloadAction<EntityId[]>) {
            if (action.payload.length !== 2) { throw new Error("Expected spline to have two waypoints."); }
            if (uiState.selectedSplineIds.some(splineId => splineId.every(splineId => action.payload.includes(splineId)))) {
                uiState.selectedSplineIds = [];
            } else {
                uiState.selectedWaypointIds = []; // Remove waypoint selection
                uiState.selectedSplineIds = [action.payload]; // Only one at a time (for now?)
            }
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(deletedRoutineInternal, (uiState, action) => {
                if (action.payload.newActiveRoutineId) { uiState.activeRoutineId = action.payload.newActiveRoutineId; }
            })
            .addCase(addedRoutineInternal, (uiState, action) => { uiState.activeRoutineId = action.payload.routineId; })
    }
});

export function allItemsHidden(): AppThunk {
    return (dispatch, getState) =>
        dispatch(uiSlice.actions.allItemsHiddenInternal(
            selectAllTreeWaypointIds(getState())
        ));
}

export function itemSelected(
    selectedItemId: EntityId,
    itemType: SelectableItemType,
    shiftKeyHeld: boolean
): AppThunk {
    return (dispatch, getState) => {
        const state = getState();
        const containedWaypointIds = selectContainedWaypointIds(state, selectedItemId, itemType);
        if (shiftKeyHeld) {
            dispatch(uiSlice.actions.itemBatchSelectedInternal({
                containedWaypointIds,
                treeWaypointIds: selectAllTreeWaypointIds(state)
            }));
        } else {
            dispatch(uiSlice.actions.itemSelectedInternal(containedWaypointIds));
        }
    };
}

export function itemVisibilityToggled(itemId: EntityId | EntityId[], itemType: SelectableItemType): AppThunk {
    return (dispatch, getState) => {
        dispatch(uiSlice.actions.itemVisibilityToggledInternal(selectContainedWaypointIds(getState(), itemId, itemType)));
    };
}

export function itemMouseEnter(itemId: EntityId | EntityId[], itemType: SelectableItemType): AppThunk {
    return (dispatch, getState) => {
        dispatch(uiSlice.actions.itemMouseEnterInternal(selectContainedWaypointIds(getState(), itemId, itemType)));
    };
}

export function itemMouseLeave(itemId: EntityId, itemType: SelectableItemType): AppThunk {
    return (dispatch, getState) => {
        dispatch(uiSlice.actions.itemMouseLeaveInternal(selectContainedWaypointIds(getState(), itemId, itemType)));
    };
}

export const {
    selectedActiveRoutine,
    allItemsDeselected,
    allItemsShown,
    itemSelectionHidden,
    itemSelectionShown,
    treeItemsCollapsed,
    treeItemsExpanded,
    splineMouseEnter,
    splineMouseLeave,
    splineSelected
} = uiSlice.actions;

/**
 * Returns an array containing the waypointIds contained by an item specified by id.
 */
export function selectContainedWaypointIds(state: RootState, id: EntityId | EntityId[], itemType: SelectableItemType): EntityId[] {
    if (itemType === ItemType.SPLINE) {
        if (!Array.isArray(id)) { throw new Error("Expected splineId to be an array."); }
        return id;
    }
    else {
        if (Array.isArray(id)) { throw new Error("Expected itemId to be a single id."); }
        switch (itemType) {
            case ItemType.FOLDER:
                return selectFolderWaypointIds(state, id) ?? [];
            case ItemType.PATH:
                return selectPathById(state, id)?.waypointIds ?? [];
            case ItemType.WAYPOINT:
                return [id];
            default:
                throw new Error("Cannot select from specified item type.");
        };
    }
}

export function selectActiveRoutineId(state: RootState) { return state.ui.activeRoutineId; }
export function selectActiveRoutine(state: RootState) { return selectRoutineById(state, selectActiveRoutineId(state)); }

export function selectHoveredWaypointIds(state: RootState) { return state.ui.hoveredWaypointIds; }
export function selectSelectedWaypointIds(state: RootState) { return state.ui.selectedWaypointIds; }
export function selectHiddenWaypointIds(state: RootState) { return state.ui.hiddenWaypointIds; }

export function selectCollapsedIds(state: RootState) { return state.ui.collapsedIds; }

export function selectHoveredSplineIds(state: RootState) { return state.ui.hoveredSplineIds; }
export function selectSelectedSplineIds(state: RootState) { return state.ui.selectedSplineIds; }