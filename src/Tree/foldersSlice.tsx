import { createSlice, createEntityAdapter, PayloadAction, EntityId, nanoid, isAnyOf, EntityState } from "@reduxjs/toolkit";

import { AppThunk, RootState } from "../Store/store";
import { routineDeletedInternal, routineDuplicatedInternal } from "../Navbar/routinesSlice";
import { pathDeletedInternal, selectOwnerPath } from "../Navbar/pathsSlice";
import { waypointDeletedInternal, waypointDuplicatedInternal } from "./waypointsSlice";
import { ItemType, selectionDeletedInternal } from "./tempUiSlice";
import { addValidIdSelector, assertValid, getNextName, getSimpleSelectors, makeUpdate } from "../Store/storeUtils";

export interface Folder {
    id: EntityId;
    name: string;
    // should be ordered
    waypointIds: EntityId[];
}

const foldersAdapter = createEntityAdapter<Folder>();
const simpleSelectors = getSimpleSelectors(foldersAdapter);

export const foldersSlice = createSlice({
    name: "folders",
    initialState: foldersAdapter.getInitialState(),
    reducers: {
        /**
         * @param index : @optional
         *      The index to insert at. The existing folder at the index is shifted back to make room.
         */
        folderAddedInternal: (folderState, action: PayloadAction<{
            id: EntityId,
            pathId: EntityId,
            waypointIds: EntityId[]
        }>) => {
            foldersAdapter.addOne(folderState, {
                ...action.payload,
                name: getNextName(simpleSelectors.selectAll(folderState), "Folder")
            });
        },
        folderDeletedInternal: (folderState, action: PayloadAction<{
            id: EntityId,
            waypointIds: EntityId[]
        }>) => {
            foldersAdapter.removeOne(folderState, action.payload.id);
        },
        folderUpdated: foldersAdapter.updateOne,
        folderRenamed(folderState, action: PayloadAction<{ id: EntityId, newName: string }>) {
            foldersAdapter.updateOne(folderState, makeUpdate(action.payload.id, { name: action.payload.newName }));
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(waypointDeletedInternal, (folderState, action) => {
                handleWaypointDeleted(folderState, action.payload.id);
            })
            .addCase(selectionDeletedInternal, (folderState, action) => {
                action.payload.updateWaypointIds.forEach(waypointId => { handleWaypointDeleted(folderState, waypointId); });
            })
            .addCase(waypointDuplicatedInternal, (folderState, action) => {
                const existingFolder = simpleSelectors.selectAll(folderState).find(folder => folder.waypointIds.includes(action.payload.waypointId));
                if (existingFolder) {
                    const newWaypointIds = existingFolder.waypointIds.slice();
                    const index = newWaypointIds.findIndex(waypointId => waypointId === action.payload.waypointId);
                    newWaypointIds.splice(index, 0, action.payload.newWaypointId);
                    foldersAdapter.updateOne(folderState, { id: existingFolder.id, changes: { waypointIds: newWaypointIds } });
                }
            })
            .addCase(routineDuplicatedInternal, (folderState, action) => {
                foldersAdapter.addMany(folderState, action.payload.folders);
            })
            .addMatcher(isAnyOf(routineDeletedInternal, pathDeletedInternal),
                (folderState, action) => foldersAdapter.removeMany(folderState, action.payload.folderIds))
    }
});

function handleWaypointDeleted(folderState: EntityState<Folder>, waypointId: EntityId) {
    const ownerFolder = selectOwnerFolderInternal(folderState, waypointId);
    if (ownerFolder) {
        if (ownerFolder.waypointIds.length === 1) {
            foldersAdapter.removeOne(folderState, ownerFolder.id);
        }
        else {
            const waypointIds = ownerFolder.waypointIds.filter(containedId => containedId !== waypointId);
            foldersAdapter.updateOne(folderState, makeUpdate(ownerFolder.id, { waypointIds }));
        }
    }
}

export function folderAdded(waypointIds: EntityId[]): AppThunk {
    return (dispatch, getState) => {
        const path = selectOwnerPath(getState(), waypointIds[0], ItemType.WAYPOINT);

        var orderedIds: EntityId[] = [];
        path.waypointIds.forEach(waypointId => {
            if (waypointIds.includes(waypointId)) { orderedIds.push(waypointId); }
        });

        dispatch(foldersSlice.actions.folderAddedInternal({
            id: nanoid(),
            pathId: path.id,
            waypointIds: orderedIds
        }));
    };
}

export function folderDeleted(folderId: EntityId): AppThunk {
    return (dispatch, getState) => {
        const folder = assertValid(selectFolderById(getState(), folderId));
        dispatch(folderDeletedInternal({ id: folderId, waypointIds: folder.waypointIds }))
    };
}

// Only difference between unpack and deleted is unpack leaves waypoints
export function folderUnpacked(folderId: EntityId): AppThunk {
    return (dispatch) => {
        dispatch(folderDeletedInternal({ id: folderId, waypointIds: [] }));
    }
}

export const {
    folderAddedInternal,
    folderDeletedInternal,
    folderRenamed
} = foldersSlice.actions;

export function selectFolderSlice(state: RootState) {
    return state.history.present.folders;
}

// Runtime selectors
export const {
    selectById: selectFolderById,
    selectByValidId: selectFolderByValidId,
    selectIds: selectFolderIds,
    selectAll: selectAllFolders,
    selectEntities: selectFolderDictionary,
} = addValidIdSelector(foldersAdapter.getSelectors<RootState>(selectFolderSlice));

export function selectFolderWaypointIds(state: RootState, folderId: EntityId): EntityId[] {
    return selectFolderByValidId(state, folderId).waypointIds;
}

/**
 * Returns the folder which owns a given waypointId, or undefined if it does not exist.
 * Note that it can return undefined, unlike most other selectOwner functions.
 * @param waypointId - The waypoint id to use.
 */
export function selectOwnerFolder(state: RootState, waypointId: EntityId): Folder | undefined {
    return selectOwnerFolderInternal(selectFolderSlice(state), waypointId);
}

export function selectOwnerFolderInternal(folderState: EntityState<Folder>, waypointId: EntityId): Folder | undefined {
    return simpleSelectors.selectAll(folderState).find(folder => folder.waypointIds.includes(waypointId));
}

/**
 * Returns true if a waypointId is in a folder, and false otherwise.
 * @param waypointId - The waypoint id to use.
 */
export function selectIsWaypointIdInFolder(state: RootState, waypointId: EntityId): boolean {
    return selectOwnerFolder(state, waypointId) !== undefined;
}
