import { createSlice, createEntityAdapter, nanoid, PayloadAction, EntityId } from '@reduxjs/toolkit';
import { DUMMY_ID } from '../Store/dummyId';

import { RootState } from '../Store/store';

export interface Path {
    readonly id: EntityId;
    readonly name: string; // maybe not required?

    readonly robotId: EntityId;
    readonly startWaypointId: EntityId;
    readonly endWaypointId: EntityId;
    readonly waypointIds: EntityId[];
}

export const pathsAdapter = createEntityAdapter<Path>({
    sortComparer: (a, b) => (a.name.localeCompare(b.name))
});

// Selectors which can be used in the reducer
const simpleSelectors = pathsAdapter.getSelectors();

function getNextName(paths: Path[]): string {
    const checkName = (newName: string): boolean =>
        paths.every(path => path.name !== newName);

    let i = 1;
    for (; ; ++i) {
        if (checkName("Path " + i))
            return "Path " + i;
    }
}

export const pathsSlice = createSlice({
    name: 'paths',
    initialState: pathsAdapter.getInitialState(),
    reducers: {
        addedPath(state, action: PayloadAction<undefined>) {
            const path = {
                id: nanoid(),
                name: getNextName(simpleSelectors.selectAll(state)),
            };
            // pathsAdapter.addOne(state, path);
        },
        changedPath: pathsAdapter.updateOne,
        deletedPath(state, action: PayloadAction<EntityId>) {
            pathsAdapter.removeOne(state, action);
        },
        copiedPath(state, action: PayloadAction<EntityId>) {
            const path = Object.assign({}, state.entities[action.payload]);
            if (path !== undefined) {
                path.id = nanoid();
                path.name = "Copy of " + path.name;
                pathsAdapter.addOne(state, path);
            }
        },
        renamedPath(state, action: PayloadAction<{ newName: string, id: EntityId }>) {
            let path = state.entities[action.payload.id];
            if (path !== undefined) {
                path.name = action.payload.newName;
            }
        }
    }
});

export const {
    addedPath,
    deletedPath,
    changedPath,
    copiedPath,
    renamedPath
} = pathsSlice.actions;

// Runtime selectors
export const {
    selectById: selectPathById,
    selectIds: selectPathIds,
    selectAll: selectAllPaths,
} = pathsAdapter.getSelectors<RootState>((state) => state.paths);