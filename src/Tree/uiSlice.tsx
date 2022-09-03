import { createSlice, PayloadAction, EntityId } from "@reduxjs/toolkit";
import { addedRoutineInternal, deletedRoutineInternal, selectRoutineById } from "../Navbar/routinesSlice";
import { DUMMY_ID } from "../Store/dummyId";
import { AppThunk, RootState } from "../Store/store";
import { selectFolderWaypointIds } from "./foldersSlice";
import { selectPathById } from "./pathsSlice";
import { selectAllTreeWaypointIds } from "./treeActions";
import { selectWaypointById } from "./waypointsSlice";

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
    PATH, FOLDER, WAYPOINT
}

/**
 * Stores UI state and related actions.
 * Notably is responsible for handling UI options like selecting waypoints (which highlights them in the window)
 * and showing/hiding waypoints. 
 * Although some of these behaviors could be feasibly captured directly in waypoints, it breaks "UI logic" away
 * from information which has no effect on the generated path.
 */
export const uiSlice = createSlice({
    name: "ui",
    initialState: {
        activeRoutineId: DUMMY_ID,
        hoveredWaypointIds: [],
        selectedWaypointIds: [],
        hiddenWaypointIds: [],
        collapsedIds: [],
        hoveredSplineIds: [],
        selectedSplineIds: []
    } as UI,
    reducers: {
        selectedActiveRoutine(uiState, action: PayloadAction<EntityId>) {
            uiState.activeRoutineId = action.payload;
            uiState.hoveredWaypointIds = [];
            uiState.selectedWaypointIds = [];
            uiState.hiddenWaypointIds = [];
        },
        itemBatchSelectedInternal(uiState, action: PayloadAction<{
            treeWaypointIds: EntityId[],
            containedWaypointIds: EntityId[],
        }>) {
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
            // should be impossible - need to sanitise UI when switching routines though
            if (lastSelectedIndex === -1) { throw Error("Expected last selected index to exist in tree."); }

            const index = treeWaypointIds.findIndex(treeId => treeId === containedWaypointIds[containedWaypointIds.length - 1]);

            if (index === -1) { throw Error("Expected id to exist in tree."); }
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
                uiState.selectedWaypointIds.push(...slice);
                uiState.selectedWaypointIds.push(...copy);
            }
        },
        itemSelectedInternal(uiState, action: PayloadAction<EntityId[]>) {
            const containedWaypointIds = action.payload;
            // If every containedWaypointId is already selected
            if (containedWaypointIds.every(containedId => uiState.selectedWaypointIds.includes(containedId))) {
                uiState.selectedWaypointIds = uiState.selectedWaypointIds.filter(selectedId => !containedWaypointIds.includes(selectedId));
            } else {
                // reverse so shift click is based on first element
                const reversed: EntityId[] = [];
                containedWaypointIds.forEach(containedId => reversed.unshift(containedId));
                uiState.selectedWaypointIds.push(...reversed);
            }
        },
        allWaypointsDeselected(uiState, _action: PayloadAction) { uiState.selectedWaypointIds = []; },
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
        allItemsShown(uiState, _action: PayloadAction) { uiState.hiddenWaypointIds = []; },
        allItemsHiddenInternal(uiState, action: PayloadAction<EntityId[]>) { uiState.hiddenWaypointIds = action.payload; },
        itemSelectionShown(uiState, _action: PayloadAction) {
            uiState.hiddenWaypointIds =
                uiState.hiddenWaypointIds.filter(hiddenId => !uiState.selectedWaypointIds.includes(hiddenId));
        },
        itemSelectionHidden(uiState, _action: PayloadAction) { uiState.hiddenWaypointIds.push(...uiState.selectedWaypointIds); },
        treeItemsExpanded(uiState, action: PayloadAction<EntityId[]>) {
            uiState.collapsedIds = uiState.collapsedIds.filter(collapsedId => !action.payload.includes(collapsedId));
        },
        treeItemsCollapsed(uiState, action: PayloadAction<EntityId[]>) { uiState.collapsedIds.push(...action.payload); },
        itemMouseEnterInternal(uiState, action: PayloadAction<EntityId[]>) { uiState.hoveredWaypointIds.push(...action.payload); },
        itemMouseLeaveInternal(uiState, action: PayloadAction<EntityId[]>) {
            uiState.hoveredWaypointIds = uiState.hoveredWaypointIds.filter(hoveredWaypointId => !action.payload.includes(hoveredWaypointId));
        },

        // waypointHovered(uiState, action: PayloadAction<EntityId>) {
        //     uiState.hoveredWaypointIds.push(action.payload);
        // },
        // waypointMouseLeave(uiState, action: PayloadAction<EntityId>) {
        //     uiState.hoveredWaypointIds = uiState.hoveredWaypointIds.filter(hoveredId => hoveredId != action.payload);
        // }
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

export const allItemsHidden = (): AppThunk => {
    return (dispatch, getState) =>
        dispatch(uiSlice.actions.allItemsHiddenInternal(
            selectAllTreeWaypointIds(getState())
        ));
};

export const itemSelected = (
    selectedItemId: EntityId,
    itemType: ItemType,
    shiftKeyHeld: boolean
): AppThunk => {
    return (dispatch, getState) => {
        const state = getState();
        const containedWaypointIds = selectContainedWaypointIds(state, selectedItemId, itemType);
        if (shiftKeyHeld) {
            dispatch(uiSlice.actions.itemBatchSelectedInternal({
                treeWaypointIds: selectAllTreeWaypointIds(state),
                containedWaypointIds
            }));
        } else {
            dispatch(uiSlice.actions.itemSelectedInternal(containedWaypointIds));
        }
    };
};

export const itemVisibilityToggled = (itemId: EntityId, itemType: ItemType): AppThunk => {
    return (dispatch, getState) =>
        dispatch(uiSlice.actions.itemVisibilityToggledInternal(selectContainedWaypointIds(getState(), itemId, itemType)));
};

export const itemMouseEnter = (itemId: EntityId, itemType: ItemType): AppThunk => {
    return (dispatch, getState) =>
        dispatch(uiSlice.actions.itemMouseEnterInternal(selectContainedWaypointIds(getState(), itemId, itemType)));
};

export const itemMouseLeave = (itemId: EntityId, itemType: ItemType): AppThunk => {
    return (dispatch, getState) =>
        dispatch(uiSlice.actions.itemMouseLeaveInternal(selectContainedWaypointIds(getState(), itemId, itemType)));
};

// export const allTreeItemsCollapsed = (): AppThunk => {
//     return (dispatch, getState) =>
//         dispatch(uiSlice.actions.allTreeItemsCollapsedInternal(selectAllTreeContainerIds(getState())));
// };

// export const allTreeItemsExpanded = (): AppThunk => {
//     return (dispatch, getState) =>
//         dispatch(uiSlice.actions.allTreeItemsExpandedInternal(selectAllTreeContainerIds(getState())));
// };

export const {
    selectedActiveRoutine,
    allWaypointsDeselected,
    allItemsShown,
    itemSelectionHidden,
    itemSelectionShown,
    treeItemsCollapsed,
    treeItemsExpanded,
} = uiSlice.actions;

/**
 * Returns an array containing the waypointIds contained by a treeItem.
 */
export const selectContainedWaypointIds = (state: RootState, id: EntityId, itemType: ItemType): EntityId[] => {
    switch (itemType) {
        case ItemType.FOLDER:
            return selectFolderWaypointIds(state, id) ?? [];
        case ItemType.PATH:
            return selectPathById(state, id)?.waypointIds ?? [];
        case ItemType.WAYPOINT:
            const waypointId = selectWaypointById(state, id)?.id;
            return waypointId ? [waypointId] : [];
    };
};

export const selectActiveRoutineId = (state: RootState) => state.ui.activeRoutineId;
export const selectActiveRoutine = (state: RootState) => selectRoutineById(state, selectActiveRoutineId(state));

export const selectHoveredWaypointIds = (state: RootState) => state.ui.hoveredWaypointIds;

export const selectSelectedWaypointIds = (state: RootState) => state.ui.selectedWaypointIds;

export const selectHiddenWaypointIds = (state: RootState) => state.ui.hiddenWaypointIds;

export const selectCollapsedIds = (state: RootState) => state.ui.collapsedIds;