import { createSlice, PayloadAction, EntityId } from "@reduxjs/toolkit";
import { DUMMY_ID } from "../Store/storeUtils";
import { AppThunk, RootState } from "../Store/store";
import { selectFolderWaypointIds } from "./foldersSlice";
import { selectPathById } from "../Navbar/pathsSlice";
import { selectAllTreeWaypointIds } from "./treeActions";
import { selectedActiveRoutine } from "./uiSlice";

/**
 * @typedef TempUi
 * @property collapsedFolderIds - A list of folderIds representing collapsed folders.
 * @property hoveredWaypointIds - A list of waypoints which are hovered. 
 *      Triggered by the MouseEnter and MouseLeave events. Hovering is an array to support highlighting folder and path contents.
 * @property selectedWaypointIds - A list of waypoints which are selected.
 *      Takes precedence over activeWaypoints.
 * @property selectedSplineIds - A list of waypointId pairs representing splines which are currently selected.
 * @property hoveredSplineIds - A list of waypointId pairs representing splines which are currently hovered.
 * @property isExportDialogOpen - Whether or not the export menu dialog is currently open.
 * @property robotDialog - The id of the robot dialog which is currently open, or `DUMMY_ID` if none is.
 */
export interface TempUi {
    collapsedFolderIds: EntityId[];
    selectedWaypointIds: EntityId[];
    hoveredWaypointIds: EntityId[];
    selectedSplineIds: EntityId[][];
    hoveredSplineIds: EntityId[][];
    isExportDialogOpen: boolean;
    robotDialog: EntityId;
}

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

const defaultTempUiState: TempUi = {
    collapsedFolderIds: [],
    hoveredWaypointIds: [],
    selectedWaypointIds: [],
    hoveredSplineIds: [],
    selectedSplineIds: [],
    isExportDialogOpen: false,
    robotDialog: DUMMY_ID
};

export const tempUiSlice = createSlice({
    name: "tempUi",
    initialState: defaultTempUiState,
    reducers: {
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
        treeItemsExpanded(uiState, action: PayloadAction<EntityId[]>) {
            uiState.collapsedFolderIds = uiState.collapsedFolderIds.filter(collapsedId => !action.payload.includes(collapsedId));
        },
        treeItemsCollapsed(uiState, action: PayloadAction<EntityId[]>) { uiState.collapsedFolderIds.push(...action.payload); },
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
        },
        exportDialogOpened(uiState) {
            uiState.isExportDialogOpen = true;
        },
        exportDialogClosed(uiState) {
            uiState.isExportDialogOpen = false;
        },
        robotDialogOpened(uiState, action: PayloadAction<EntityId>) {
            uiState.robotDialog = action.payload;
        },
        robotDialogClosed(uiState) {
            uiState.robotDialog = DUMMY_ID;
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(selectedActiveRoutine, (uiState) => {
                // Reset UI state to avoid editing hidden routine
                uiState.hoveredWaypointIds = [];
                uiState.selectedWaypointIds = [];
                uiState.hoveredSplineIds = [];
                uiState.selectedSplineIds = [];
            })
    }
});

export function itemSelected(
    selectedItemId: EntityId,
    itemType: SelectableItemType,
    shiftKeyHeld: boolean
): AppThunk {
    return (dispatch, getState) => {
        const state = getState();
        const containedWaypointIds = selectContainedWaypointIds(state, selectedItemId, itemType);
        if (shiftKeyHeld) {
            dispatch(tempUiSlice.actions.itemBatchSelectedInternal({
                containedWaypointIds,
                treeWaypointIds: selectAllTreeWaypointIds(state)
            }));
        } else {
            dispatch(tempUiSlice.actions.itemSelectedInternal(containedWaypointIds));
        }
    };
}

export function itemMouseEnter(itemId: EntityId | EntityId[], itemType: SelectableItemType): AppThunk {
    return (dispatch, getState) => {
        dispatch(tempUiSlice.actions.itemMouseEnterInternal(selectContainedWaypointIds(getState(), itemId, itemType)));
    };
}

export function itemMouseLeave(itemId: EntityId | EntityId[], itemType: SelectableItemType): AppThunk {
    return (dispatch, getState) => {
        dispatch(tempUiSlice.actions.itemMouseLeaveInternal(selectContainedWaypointIds(getState(), itemId, itemType)));
    };
}

export const {
    allItemsDeselected,
    treeItemsCollapsed,
    treeItemsExpanded,
    splineMouseEnter,
    splineMouseLeave,
    splineSelected,
    exportDialogOpened,
    exportDialogClosed,
    robotDialogOpened,
    robotDialogClosed,
} = tempUiSlice.actions;

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

export function selectCollapsedFolderIds(state: RootState): EntityId[] { return state.tempUi.collapsedFolderIds; }

export function selectHoveredWaypointIds(state: RootState): EntityId[] { return state.tempUi.hoveredWaypointIds; }
export function selectSelectedWaypointIds(state: RootState): EntityId[] { return state.tempUi.selectedWaypointIds; }

export function selectHoveredSplineIds(state: RootState): EntityId[][] { return state.tempUi.hoveredSplineIds; }
export function selectSelectedSplineIds(state: RootState): EntityId[][] { return state.tempUi.selectedSplineIds; }

export function selectIsExportDialogOpen(state: RootState): boolean { return state.tempUi.isExportDialogOpen; }
export function selectIsRobotDialogOpen(state: RootState): boolean { return selectRobotDialogId(state) !== DUMMY_ID; }
export function selectRobotDialogId(state: RootState): EntityId { return state.tempUi.robotDialog; }