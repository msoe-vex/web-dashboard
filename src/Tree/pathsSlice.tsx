import { createSlice, createEntityAdapter, nanoid, PayloadAction, EntityId } from "@reduxjs/toolkit";
import { batch } from "react-redux";
import { addedRoutineInternal, deletedRoutineInternal } from "../Navbar/routinesSlice";
import { DUMMY_ID } from "../Store/dummyId";

import { AppThunk, RootState } from "../Store/store";
import { addedWaypoint, deletedWaypoint } from "./waypointsSlice";

export interface Path {
    readonly id: EntityId;

    readonly robotId: EntityId | undefined;
    readonly waypointIds: EntityId[];
}

export const pathsAdapter = createEntityAdapter<Path>();
const simpleSelectors = pathsAdapter.getSelectors();

export const pathsSlice = createSlice({
    name: "paths",
    initialState: pathsAdapter.getInitialState(),
    reducers: {
        addedPathInternal(pathState, action: PayloadAction<{
            id: EntityId,
            routineId: EntityId,
            robotId: EntityId,
            waypointIds: EntityId[]
        }>) {
            pathsAdapter.addOne(pathState, {
                ...action.payload // not routineId
            });
        },
        deletedPathInternal: pathsAdapter.removeOne,
        changedPath: pathsAdapter.updateOne,
    },
    extraReducers: (builder) => {
        builder
            .addCase(addedRoutineInternal, (pathState, action) => {
                pathsAdapter.addOne(pathState, {
                    ...action.payload,
                    id: action.payload.pathId,
                    waypointIds: action.payload.waypointIds
                });
            })
            .addCase(deletedRoutineInternal, (pathState, action) => {
                pathsAdapter.removeMany(pathState, action.payload.pathIds);
            })
            .addCase(addedWaypoint, (pathState, action) => {
                const path = simpleSelectors.selectById(pathState, action.payload.pathId);
                if (path !== undefined) {
                    if (action.payload.index !== undefined && action.payload.index < path.waypointIds.length) {
                        // this inserts into the array (after deleting 0 items). Yay jaascript!
                        path.waypointIds.splice(action.payload.index, 0, action.payload.waypointId);
                    }
                    else {
                        path.waypointIds.push(action.payload.waypointId);
                    }
                }
            })
            .addCase(deletedWaypoint, (pathState, action) => {
                simpleSelectors.selectAll(pathState).forEach(path => {
                    const index = path.waypointIds.findIndex(waypointId => waypointId === action.payload);
                    if (index !== -1) {
                        path.waypointIds.splice(index, 1);
                    }
                });
            })
    }
});

export const deletedPath = (pathId: EntityId): AppThunk => {
    return (dispatch, getState) => {
        batch(() => {
            const path = selectPathById(getState(), pathId);
            if (path !== undefined) {
                path.waypointIds.forEach(waypointId => {
                    // dispatch(deletedWaypoint(waypointId));
                });
            }
            dispatch(pathsSlice.actions.deletedPathInternal(pathId));
        });
    };
};

export const addedPath = (routineId: EntityId): AppThunk => {
    return (dispatch, getState) => {
        dispatch(pathsSlice.actions.addedPathInternal({
            id: nanoid(),
            routineId,
            robotId: DUMMY_ID, // selectFirstRobotId(getState(),
            // set waypoints as ends
            waypointIds: [nanoid(), nanoid()]
        }));
    };
};

export const {
    changedPath
} = pathsSlice.actions;

// Runtime selectors
export const {
    selectById: selectPathById,
    selectIds: selectPathIds,
    selectAll: selectAllPaths,
} = pathsAdapter.getSelectors<RootState>((state) => state.paths);