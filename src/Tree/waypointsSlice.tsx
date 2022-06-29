import { createSlice, createEntityAdapter, nanoid, PayloadAction, EntityId } from "@reduxjs/toolkit";
import { addedRoutineInternal, deletedRoutineInternal } from "../Navbar/routinesSlice";

import { RootState } from "../Store/store";

export interface Waypoint {
    readonly id: EntityId;
    // Whether the waypoint is at the end of a path
    // Causes the velocity to be 0 and prevents it from being marked as a follower
    readonly end: boolean;
}

export const waypointsAdapter = createEntityAdapter<Waypoint>();

export const waypointsSlice = createSlice({
    name: "waypoints",
    initialState: waypointsAdapter.getInitialState(),
    reducers: {
        /**
         * @param index : @optional
         *      The index to insert at. The exisiting waypoint at the index is shifted back to make room.
         */
        addedWaypoint: {
            reducer: (waypointState, action: PayloadAction<{
                waypointId: EntityId,
                pathId: EntityId
                index?: number
            }>) => {
                waypointsAdapter.addOne(waypointState, {
                    id: action.payload.waypointId,
                    end: false,
                    // default waypoint props
                });
            },
            prepare: (pathId: EntityId, index?: number) => {
                return {
                    payload: {
                        waypointId: nanoid(),
                        pathId,
                        index
                    }
                };
            }
        },
        deletedWaypoint: waypointsAdapter.removeOne,
        changedWaypoint: waypointsAdapter.updateOne,
    },
    extraReducers: (builder) => {
        builder
            .addCase(addedRoutineInternal, (waypointState, action) => {
                action.payload.waypointIds.forEach(waypointId => {
                    waypointsAdapter.addOne(waypointState, {
                        id: waypointId,
                        end: true
                    })
                });
            })
            .addCase(deletedRoutineInternal, (waypointState, action) => {
                waypointsAdapter.removeMany(waypointState, action.payload.waypointIds);
            })
    }
});

export const {
    addedWaypoint,
    deletedWaypoint,
    changedWaypoint
} = waypointsSlice.actions;

// Runtime selectors
export const {
    selectById: selectWaypointById,
    selectIds: selectWaypointIds,
    selectAll: selectAllWaypoints,
} = waypointsAdapter.getSelectors<RootState>((state) => state.waypoints);