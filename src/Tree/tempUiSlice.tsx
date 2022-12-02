import { createSlice, PayloadAction, EntityId, isAnyOf } from "@reduxjs/toolkit";
import { WritableDraft } from "immer/dist/internal";
import { selectPathByValidId } from "../Navbar/pathsSlice";
import { routineRenamed } from "../Navbar/routinesSlice";
import { AppThunk, RootState } from "../Store/store";
import { addReversedArray, includesAll, includesArray, removeAll, removeArray } from "../Store/storeUtils";
import { folderRenamed, selectFolderWaypointIds, selectOwnerFolder } from "./foldersSlice";
import { robotRenamed } from "./robotsSlice";
import { selectAllTreeWaypointIds } from "./treeActions";
import { activeRoutineSelected } from "./uiSlice";
import { waypointMovedInternal, waypointRenamed } from "./waypointsSlice";

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
 * @property robotDialogId - The id of the robot dialog which is currently open, or `DUMMY_ID` if none is.
 * @property renamingId - The id of the item currently being renamed.
 */
export interface TempUi {
    collapsedFolderIds: EntityId[];
    selectedWaypointIds: EntityId[];
    hoveredWaypointIds: EntityId[];
    selectedSplineIds: EntityId[][];
    hoveredSplineIds: EntityId[][];
    isExportDialogOpen: boolean;
    robotDialogId?: EntityId;
    renamingId?: EntityId;
}

export enum ItemType {
    PATH = 0,
    ROBOT = 1,
    WAYPOINT = 2,
    SPLINE = 3,
    FOLDER = 4,
    ROUTINE = 5
}

export interface Item {
    id: EntityId;
    itemType: ItemType.WAYPOINT | ItemType.FOLDER | ItemType.PATH;
}

const defaultTempUiState: TempUi = {
    collapsedFolderIds: [],
    hoveredWaypointIds: [],
    selectedWaypointIds: [],
    hoveredSplineIds: [],
    selectedSplineIds: [],
    isExportDialogOpen: false,
    robotDialogId: undefined,
    renamingId: undefined
};

export function assertValidSplineId(splineId: EntityId | EntityId[]): EntityId[] {
    if (!Array.isArray(splineId) || splineId.length !== 2) { throw new Error("Expected spline id size to be 2."); }
    return splineId;
}

export const tempUiSlice = createSlice({
    name: "tempUi",
    initialState: defaultTempUiState,
    reducers: {
        itemBatchSelectedInternal(uiState, action: PayloadAction<{
            treeWaypointIds: EntityId[],
            containedWaypointIds: EntityId[],
            controlKeyHeld: boolean
        }>) {
            uiState.selectedSplineIds = []; // deselect splines
            // cases:
            // if tree is empty, do nothing
            // if no waypoints are currently selected, select the entire tree
            // If all waypoints are currently selected, deselect the entire tree
            // if the last selected waypoint isn't in the tree (should be impossible), do nothing
            // If shift selected waypoint does not exist, do nothing (should be impossible)
            const { treeWaypointIds, containedWaypointIds, controlKeyHeld } = action.payload;
            if (treeWaypointIds.length === 0) { return; }
            // If everything is already selected, deselect all
            else if (includesAll(uiState.selectedWaypointIds, treeWaypointIds)) {
                uiState.selectedWaypointIds = [];
                return;
            }
            // If nothing is selected or control key held, select all
            else if (controlKeyHeld || uiState.selectedWaypointIds.length === 0) {
                uiState.selectedWaypointIds = treeWaypointIds;
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
                addReversedArray(uiState.selectedWaypointIds, containedWaypointIds);
            }
        },
        itemMultiSelectedInternal(uiState, action: PayloadAction<EntityId[]>) {
            const containedWaypointIds = action.payload;
            // If every containedWaypointId is already selected
            if (includesAll(uiState.selectedWaypointIds, containedWaypointIds)) {
                // filter each waypoint from selection
                uiState.selectedWaypointIds = removeAll(uiState.selectedWaypointIds, containedWaypointIds);
            } else {
                // reverse so shift click is based on first element
                addReversedArray(uiState.selectedWaypointIds, containedWaypointIds);
                uiState.selectedSplineIds = []; // remove spline id selection
            }
        },
        itemSelectedInternal(uiState, action: PayloadAction<EntityId[]>) {
            const containedWaypointIds = action.payload;
            // If the only thing selected is clicked, delete the selection.
            // Otherwise change the selection to the thing clicked.
            // Something is not already clicked when at least part of it is not selected.
            if (uiState.selectedWaypointIds.length === containedWaypointIds.length &&
                includesAll(uiState.selectedWaypointIds, containedWaypointIds)) {
                uiState.selectedWaypointIds = [];
            }
            else {
                // reverse so shift click is based on first element
                // .reverse() doesn't work since containedWaypointIds is readonly
                addReversedArray(uiState.selectedWaypointIds, containedWaypointIds);
                uiState.selectedSplineIds = [];
            }
        },
        selectionDeletedInternal(uiState, _action: PayloadAction<{
            waypointIds: EntityId[],
            folderIds: EntityId[],
            updateWaypointIds: EntityId[]
        }>) { uiState.selectedWaypointIds = []; },
        allItemsDeselected(uiState) {
            uiState.selectedWaypointIds = [];
            uiState.selectedSplineIds = [];
        },
        treeItemsCollapsed: arrayAppendAction("collapsedFolderIds"),
        treeItemsExpanded: arrayRemoveAction("collapsedFolderIds"),
        itemMouseEnterInternal: arrayAppendAction("hoveredWaypointIds"),
        itemMouseLeaveInternal: arrayRemoveAction("hoveredWaypointIds"),
        splineMouseEnter: nestedArrayAppendAction("hoveredSplineIds"),
        splineMouseLeave: nestedArrayRemoveAction("hoveredSplineIds"),
        splineSelected(uiState, action: PayloadAction<EntityId[]>) {
            assertValidSplineId(action.payload);
            // already selected
            if (includesArray(uiState.selectedSplineIds, action.payload)) {
                uiState.selectedSplineIds = removeArray(uiState.selectedSplineIds, action.payload);
            } else {
                uiState.selectedSplineIds.push(action.payload);
            }
            uiState.selectedWaypointIds = []; // Remove waypoint selection
        },
        exportDialogOpened(uiState) { uiState.isExportDialogOpen = true; },
        exportDialogClosed(uiState) { uiState.isExportDialogOpen = false; },
        robotDialogOpened(uiState, action: PayloadAction<EntityId>) {
            uiState.robotDialogId = action.payload;
        },
        robotDialogClosed(uiState) { uiState.robotDialogId = undefined; },
        renamingStarted(uiState, action: PayloadAction<EntityId>) {
            uiState.renamingId = action.payload;
        },
        renamingCancelled(uiState) { uiState.renamingId = undefined; }
    },
    extraReducers: (builder) => {
        builder
            .addCase(activeRoutineSelected, (uiState) => {
                // Reset UI state to avoid editing hidden routine
                uiState.hoveredWaypointIds = [];
                uiState.selectedWaypointIds = [];
                uiState.hoveredSplineIds = [];
                uiState.selectedSplineIds = [];
            })
            .addCase(waypointMovedInternal, (uiState, action) => {
                if (!uiState.selectedWaypointIds.includes(action.payload.id)) {
                    uiState.selectedWaypointIds = [action.payload.id];
                }
            })
            .addMatcher(isAnyOf(
                waypointRenamed,
                folderRenamed,
                robotRenamed,
                routineRenamed
            ), (uiState) => { uiState.renamingId = undefined; })
    }
});

type TempUiDraft = WritableDraft<TempUi>;
type TempUiDraftKeys = keyof TempUiDraft;

type TempUiArrayKey = {
    // bug: K in keyof fails for some dumb typescript reason
    [K in TempUiDraftKeys]: TempUiDraft[K] extends EntityId[] ? K : never
}[TempUiDraftKeys];

type TempUiNestedArrayKey = {
    // bug: K in keyof fails for some dumb typescript reason
    [K in TempUiDraftKeys]: TempUiDraft[K] extends EntityId[][] ? K : never
}[TempUiDraftKeys];

function arrayAppendAction(key: TempUiArrayKey) {
    return (uiState: WritableDraft<TempUi>,
        action: PayloadAction<EntityId[]>) => {
        uiState[key].push(...action.payload);
    };
}

function arrayRemoveAction(key: TempUiArrayKey) {
    return (uiState: WritableDraft<TempUi>,
        action: PayloadAction<EntityId[]>) => {
        uiState[key] = removeAll(uiState[key], action.payload);
    };
}

function nestedArrayAppendAction(key: TempUiNestedArrayKey) {
    return (uiState: WritableDraft<TempUi>,
        action: PayloadAction<EntityId[]>) => {
        uiState[key].push(action.payload);
    };
}

function nestedArrayRemoveAction(key: TempUiNestedArrayKey) {
    return (uiState: WritableDraft<TempUi>,
        action: PayloadAction<EntityId[]>) => {
        uiState[key] = removeArray(uiState[key], action.payload);
    };
}

/**
 * Deletes everything currently selected. Triggered by hitting the delete key while stuff is selected.
 * Generally, this function preserves paths but not folders.
 */
export function selectionDeleted(): AppThunk {
    return (dispatch, getState) => {
        const state = getState();
        const waypointIds = selectSelectedWaypointIds(state);

        let updateWaypointIds = [] as EntityId[];
        const folderIds = waypointIds.reduce((folderIds, waypointId) => {
            const ownerFolder = selectOwnerFolder(state, waypointId);
            if (ownerFolder) {
                if (includesAll(ownerFolder.waypointIds, waypointIds)) {
                    folderIds.push(ownerFolder.id);
                }
                else if (!folderIds.includes(ownerFolder.id)) {
                    updateWaypointIds.push(waypointId);
                }
            }
            return folderIds;
        }, [] as EntityId[]);

        dispatch(selectionDeletedInternal({
            waypointIds,
            folderIds,
            updateWaypointIds
        }));
    };
}

/**
 * Handles the selection of a given item.
 * If a given item is selected, we need to do a couple things.
 * Mark the container as selected (if it exists).
 * Does clicking every waypoint in a container also select the container?
 * Hell no, deleting shouldn't touch the container
 * 
 */
export function itemSelected(
    id: EntityId,
    itemType: ItemType,
    shiftKeyHeld: boolean,
    controlKeyHeld: boolean
): AppThunk {
    return (dispatch, getState) => {
        const state = getState();
        const containedWaypointIds = selectContainedWaypointIds(state, id, itemType);
        if (shiftKeyHeld) {
            dispatch(itemBatchSelectedInternal({
                containedWaypointIds,
                treeWaypointIds: selectAllTreeWaypointIds(state),
                controlKeyHeld
            }));
        }
        else if (controlKeyHeld) { dispatch(itemMultiSelectedInternal(containedWaypointIds)); }
        else { dispatch(itemSelectedInternal(containedWaypointIds)); }
    };
}

export function itemMouseEnter(id: EntityId | EntityId[], itemType: ItemType): AppThunk {
    return (dispatch, getState) => {
        dispatch(itemMouseEnterInternal(selectContainedWaypointIds(getState(), id, itemType)));
    };
}

export function itemMouseLeave(id: EntityId | EntityId[], itemType: ItemType): AppThunk {
    return (dispatch, getState) => {
        dispatch(itemMouseLeaveInternal(selectContainedWaypointIds(getState(), id, itemType)));
    };
}

export const {
    allItemsDeselected,
    itemBatchSelectedInternal,
    itemMultiSelectedInternal,
    selectionDeletedInternal,
    itemSelectedInternal,
    treeItemsCollapsed,
    treeItemsExpanded,
    splineMouseEnter,
    splineMouseLeave,
    splineSelected,
    exportDialogOpened,
    exportDialogClosed,
    robotDialogOpened,
    robotDialogClosed,
    renamingStarted,
    renamingCancelled,
    itemMouseEnterInternal,
    itemMouseLeaveInternal
} = tempUiSlice.actions;

/**
 * Returns an array containing the waypointIds contained by an item specified by id.
 */
export function selectContainedWaypointIds(state: RootState, id: EntityId | EntityId[], itemType: ItemType): EntityId[] {
    // spline contains itself
    if (itemType === ItemType.SPLINE) { return assertValidSplineId(id); }
    else if (Array.isArray(id)) { throw new Error("Expected non spline id to be a single id."); }

    switch (itemType) {
        case ItemType.FOLDER:
            return selectFolderWaypointIds(state, id);
        case ItemType.PATH:
            return selectPathByValidId(state, id).waypointIds;
        case ItemType.WAYPOINT:
            return [id];
        default:
            throw new Error("Cannot select from specified item type.");
    };
}

export function selectCollapsedFolderIds(state: RootState): EntityId[] { return state.tempUi.collapsedFolderIds; }

export function selectHoveredWaypointIds(state: RootState): EntityId[] { return state.tempUi.hoveredWaypointIds; }
export function selectSelectedWaypointIds(state: RootState): EntityId[] { return state.tempUi.selectedWaypointIds; }

export function selectHoveredSplineIds(state: RootState): EntityId[][] { return state.tempUi.hoveredSplineIds; }
export function selectSelectedSplineIds(state: RootState): EntityId[][] { return state.tempUi.selectedSplineIds; }

export function selectIsExportDialogOpen(state: RootState): boolean { return state.tempUi.isExportDialogOpen; }
export function selectRobotDialogId(state: RootState): EntityId | undefined { return state.tempUi.robotDialogId; }

export function selectRenamingId(state: RootState): EntityId | undefined { return state.tempUi.renamingId; }
export function selectIsRenaming(state: RootState, id?: EntityId): boolean {
    return (id !== undefined && state.tempUi.renamingId === id);
}