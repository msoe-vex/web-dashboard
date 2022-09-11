import { createSlice, createEntityAdapter, PayloadAction, EntityId, nanoid, isAnyOf } from "@reduxjs/toolkit";

import { AppThunk, RootState } from "../Store/store";
import { deletedRoutineInternal, duplicatedRoutineInternal } from "../Navbar/routinesSlice";
import { deletedPathInternal, selectOwnerPath } from "./pathsSlice";
import { getNextName } from "./Utils";
import { duplicatedWaypointInternal } from "./waypointsSlice";
import { ItemType } from "./uiSlice";

export interface Folder {
    id: EntityId;
    name: string;
    // should be ordered
    waypointIds: EntityId[];
}

const foldersAdapter = createEntityAdapter<Folder>();

const simpleSelectors = foldersAdapter.getSelectors();

export const foldersSlice = createSlice({
    name: "folders",
    initialState: foldersAdapter.getInitialState(),
    reducers: {
        /**
         * @param index : @optional
         *      The index to insert at. The exisiting folder at the index is shifted back to make room.
         */
        addedFolderInternal: (folderState, action: PayloadAction<{
            id: EntityId,
            pathId: EntityId,
            waypointIds: EntityId[]
        }>) => {
            foldersAdapter.addOne(folderState, {
                ...action.payload,
                name: getNextName(simpleSelectors.selectAll(folderState), "Folder")
            });
        },
        deletedFolderInternal: (folderState, action: PayloadAction<{
            id: EntityId,
            waypointIds: EntityId[]
        }>) => {
            foldersAdapter.removeOne(folderState, action.payload.id);
        },
        changedFolder: foldersAdapter.updateOne,
        renamedFolder(folderState, action: PayloadAction<{ newName: string, id: EntityId }>) {
            let folder = simpleSelectors.selectById(folderState, action.payload.id);
            if (folder !== undefined) {
                foldersAdapter.updateOne(folderState, { id: action.payload.id, changes: { name: action.payload.newName } });
            }
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(duplicatedRoutineInternal, (folderState, action) => {
                foldersAdapter.addMany(folderState, action.payload.folders);
            })
            .addCase(duplicatedWaypointInternal, (folderState, action) => {
                const existingFolder = simpleSelectors.selectAll(folderState).find(folder => folder.waypointIds.includes(action.payload.waypointId));
                if (existingFolder) {
                    const newWaypointIds = existingFolder.waypointIds.slice();
                    const index = newWaypointIds.findIndex(waypointId => waypointId === action.payload.waypointId);
                    newWaypointIds.splice(index, 0, action.payload.newWaypointId);
                    foldersAdapter.updateOne(folderState, { id: existingFolder.id, changes: { waypointIds: newWaypointIds } });
                }
            })
            .addMatcher(isAnyOf(deletedRoutineInternal, deletedPathInternal),
                (folderState, action) => foldersAdapter.removeMany(folderState, action.payload.folderIds))
    }
});

export function addedFolder(waypointIds: EntityId[]): AppThunk {
    return (dispatch, getState) => {
        const path = selectOwnerPath(getState(), waypointIds[0], ItemType.WAYPOINT);
        if (!path) { throw new Error("Expected valid path in addedFolder."); }

        var orderedIds: EntityId[] = [];
        path.waypointIds.forEach(waypointId => {
            if (waypointIds.includes(waypointId)) { orderedIds.push(waypointId); }
        });

        dispatch(foldersSlice.actions.addedFolderInternal({
            id: nanoid(),
            pathId: path.id,
            waypointIds: orderedIds
        }));
    };
};

export function deletedFolder(folderId: EntityId): AppThunk {
    return (dispatch, getState) => {
        const folder = selectFolderById(getState(), folderId);
        dispatch(deletedFolderInternal({ id: folderId, waypointIds: folder?.waypointIds ?? [] }))
    };
};

// Only difference between unpack and deleted is unpack leaves waypoints
export function unpackedFolder(folderId: EntityId): AppThunk {
    return (dispatch) => {
        dispatch(deletedFolderInternal({ id: folderId, waypointIds: [] }));
    }
};

export const {
    addedFolderInternal,
    deletedFolderInternal,
    changedFolder,
    renamedFolder
} = foldersSlice.actions;

// Runtime selectors
export const {
    selectById: selectFolderById,
    selectIds: selectFolderIds,
    selectAll: selectAllFolders,
    selectEntities: selectFolderDictionary,
} = foldersAdapter.getSelectors<RootState>((state) => state.folders);

export function selectFolderWaypointIds(state: RootState, folderId: EntityId): EntityId[] {
    return selectFolderById(state, folderId)?.waypointIds ?? [];
}

// /**
//  * Returns the folder which owns a given waypointId, or undefined if it does not exist.
//  * @param waypointId - The waypoint id to use.
//  * @returns {Folder | undefined}
//  */
// export function selectOwnerFolder(state: RootState, waypointId: EntityId): Folder | undefined {
//     return selectAllFolders(state).find(folder => folder.waypointIds.includes(waypointId));
// }

/**
 * Returns true if a waypointId is in a folder, and false otherwise.
 * @param {EntityId} waypointId - The waypoint id to use.
 * @returns {boolean}
 */
export function checkIfWaypointIdIsInFolder(state: RootState, waypointId: EntityId): boolean {
    // alternative method - get owner path, then search only relevant folders
    return selectAllFolders(state).every(folder => !folder.waypointIds.includes(waypointId));
}