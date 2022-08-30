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
 * @property {EntityId} activeRoutine - The currently active routine.
 * @property {EntityId[]} highlightedWaypointIds - A list of waypoints which should be highlighted.
 *      Takes precedence over activeWaypoints.
 * @property {EntityId[]} hiddenWaypointIds - A list of waypoints which are currently hidden.
 * @property {boolean} editMenuActive - A boolean describing whether an editMenu is currently active.
 */
export interface UI {
    activeRoutineId: EntityId,
    hoveredWaypointIds: EntityId[],
    highlightedWaypointIds: EntityId[],
    hiddenWaypointIds: EntityId[],
    collapsedIds: EntityId[],
    editMenuActive: boolean,
}

export enum ItemType {
    PATH, FOLDER, WAYPOINT // CONTROL_WAYPOINT, FOLLOWER_WAYPOINT
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
        hoveredWaypointIds: [],
        highlightedWaypointIds: [],
        hiddenWaypointIds: [],
        collapsedIds: [],
        folders: [],
        editMenuActive: false
    } as UI,
    reducers: {
        selectedActiveRoutine(uiState, action: PayloadAction<EntityId>) {
            uiState.activeRoutineId = action.payload;
            uiState.hoveredWaypointIds = [];
            uiState.highlightedWaypointIds = [];
            uiState.hiddenWaypointIds = [];
        },
        treeItemBatchSelectedInternal(uiState, action: PayloadAction<{
            treeWaypointIds: EntityId[],
            containedWaypointIds: EntityId[],
        }>) {
            // cases:
            // if tree is empty, do nothing
            // if no waypoints are currently highlighted, select the entire tree
            // If all waypoitns are currently highlighted, deselect the entire tree
            // if the last highlighted waypoint isn't in the tree (should be impossible), do nothing
            // If shift selected waypoint does not exist, do nothing (should be impossible)
            const { treeWaypointIds, containedWaypointIds } = action.payload;
            if (treeWaypointIds.length === 0) { return; }
            // If nothing is selected, select all
            else if (uiState.highlightedWaypointIds.length === 0) {
                uiState.highlightedWaypointIds = treeWaypointIds;
                return;
                // If everything is already selected, deselect all
            } else if (treeWaypointIds.every(treeWaypointId => uiState.highlightedWaypointIds.includes(treeWaypointId))) {
                uiState.highlightedWaypointIds = [];
                return;
            }

            const lastSelectedId = uiState.highlightedWaypointIds[uiState.highlightedWaypointIds.length - 1];

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
                uiState.highlightedWaypointIds.push(...slice);
            } else {
                // container = 1, 2, 3, lastSelected = 5, we want 4, 3, 2, 1
                // slice is 4
                const slice = treeWaypointIds.slice(index + 1, lastSelectedIndex).reverse();
                // copy is 1, 2, 3
                const copy: EntityId[] = [];
                containedWaypointIds.forEach(containedId => copy.unshift(containedId));
                uiState.highlightedWaypointIds.push(...slice);
                uiState.highlightedWaypointIds.push(...copy);
            }
        },
        treeItemSelectedInternal(uiState, action: PayloadAction<{
            controlKeyHeld: boolean,
            containedWaypointIds: EntityId[]
        }>) {
            const { controlKeyHeld, containedWaypointIds } = action.payload;
            // If every containedWaypointId is already selected
            if (containedWaypointIds.every(containedId => uiState.highlightedWaypointIds.includes(containedId))) {
                uiState.highlightedWaypointIds = controlKeyHeld ?
                    uiState.highlightedWaypointIds.filter(highlightedId => !containedWaypointIds.includes(highlightedId)) : [];
            } else {
                if (controlKeyHeld) {
                    // reverse so shift click is based on first element
                    const reversed: EntityId[] = [];
                    containedWaypointIds.forEach(containedId => reversed.unshift(containedId));
                    uiState.highlightedWaypointIds.push(...reversed);
                }
                else {
                    uiState.highlightedWaypointIds = containedWaypointIds;
                }
            }
        },
        deselectedWaypoints(uiState, _action: PayloadAction) {
            uiState.highlightedWaypointIds = [];
        },
        treeItemVisibilityToggledInternal(uiState, action: PayloadAction<{
            containedWaypointIds: EntityId[]
        }>) {
            const { containedWaypointIds } = action.payload;
            // if every contained waypoint is already hidden, nowHidden is false
            const nowHidden = !containedWaypointIds.every(containedId => uiState.hiddenWaypointIds.includes(containedId));

            // If the clicked eye icon is currently part of a selection:
            if (containedWaypointIds.every(containedId => uiState.highlightedWaypointIds.includes(containedId))) {
                if (nowHidden) {
                    // hide selection (which is guaranteed to contain container children)
                    uiState.hiddenWaypointIds.push(...uiState.highlightedWaypointIds);
                } else {
                    uiState.hiddenWaypointIds =
                        // hide selection (which is guaranteed to contain container children)
                        uiState.hiddenWaypointIds.filter(hiddenId => !uiState.highlightedWaypointIds.includes(hiddenId));
                }
            } else {
                if (nowHidden) {
                    uiState.hiddenWaypointIds.push(...containedWaypointIds);
                } else {
                    uiState.hiddenWaypointIds = uiState.hiddenWaypointIds.filter(hiddenId => !containedWaypointIds.includes(hiddenId));
                }
            }
        },
        allTreeItemsShown(uiState, _action: PayloadAction) {
            uiState.hiddenWaypointIds = [];
        },
        allTreeItemsHiddenInternal(uiState, action: PayloadAction<EntityId[]>) {
            uiState.hiddenWaypointIds = action.payload;
        },
        treeItemSelectionShown(uiState, _action: PayloadAction) {
            uiState.hiddenWaypointIds =
                uiState.hiddenWaypointIds.filter(hiddenId => !uiState.highlightedWaypointIds.includes(hiddenId));
        },
        treeItemSelectionHidden(uiState, _action: PayloadAction) {
            uiState.hiddenWaypointIds.push(...uiState.highlightedWaypointIds);
        },
        treeItemExpanded(uiState, action: PayloadAction<EntityId>) {
            uiState.collapsedIds = uiState.collapsedIds.filter(collapsedId => collapsedId !== action.payload);
        },
        treeItemCollapsed(uiState, action: PayloadAction<EntityId>) {
            uiState.collapsedIds.push(action.payload);
        },
        treeItemsExpanded(uiState, action: PayloadAction<EntityId[]>) {
            uiState.collapsedIds = uiState.collapsedIds.filter(collapsedId => !action.payload.includes(collapsedId));
        },
        treeItemsCollapsed(uiState, action: PayloadAction<EntityId[]>) {
            uiState.collapsedIds.push(...action.payload);
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

export const allTreeItemsHidden = (): AppThunk => {
    return (dispatch, getState) =>
        dispatch(uiSlice.actions.allTreeItemsHiddenInternal(
            selectAllTreeWaypointIds(getState())
        ));
};

export const treeItemSelected = (
    selectedItemId: EntityId,
    itemType: ItemType,
    shiftKeyHeld: boolean,
    controlKeyHeld: boolean
): AppThunk => {
    return (dispatch, getState) => {
        const state = getState();
        const containedWaypointIds = selectContainedWaypointIds(state, selectedItemId, itemType);
        if (shiftKeyHeld) {
            dispatch(uiSlice.actions.treeItemBatchSelectedInternal({
                treeWaypointIds: selectAllTreeWaypointIds(state),
                containedWaypointIds
            }));
        } else {
            dispatch(uiSlice.actions.treeItemSelectedInternal({
                controlKeyHeld,
                containedWaypointIds
            }));
        }
    };
};

export const treeItemVisibilityToggled = (itemId: EntityId, itemType: ItemType): AppThunk => {
    return (dispatch, getState) =>
        dispatch(uiSlice.actions.treeItemVisibilityToggledInternal({
            containedWaypointIds: selectContainedWaypointIds(getState(), itemId, itemType)
        }));
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
    deselectedWaypoints,
    allTreeItemsShown,
    treeItemSelectionHidden,
    treeItemSelectionShown,
    treeItemCollapsed,
    treeItemExpanded,
    treeItemsCollapsed,
    treeItemsExpanded
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
        // case ItemType.FOLLOWER_WAYPOINT:
    };
    return [];
};

export const selectActiveRoutineId = (state: RootState) => state.ui.activeRoutineId;
export const selectActiveRoutine = (state: RootState) => selectRoutineById(state, selectActiveRoutineId(state));

export const selectHoveredWaypointIds = (state: RootState) => state.ui.hoveredWaypointIds;

export const selectHighlightedWaypointIds = (state: RootState) => state.ui.highlightedWaypointIds;

export const selectHiddenWaypointIds = (state: RootState) => state.ui.hiddenWaypointIds;

export const selectCollapsedIds = (state: RootState) => state.ui.collapsedIds;