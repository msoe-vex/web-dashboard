import { createSlice, createEntityAdapter, nanoid, PayloadAction, EntityId, isAnyOf } from "@reduxjs/toolkit";
import { addedRoutineInternal, deletedRoutineInternal, duplicatedRoutineInternal } from "../Navbar/routinesSlice";

import { AppThunk, RootState } from "../Store/store";
import { deletedFolderInternal } from "./foldersSlice";
import { getNextName } from "./Utils";

// We need to add some special types to Waypoint
// Could we create a special configurator class or something?

export enum WaypointType {
    CONTROL, FOLLOWER
}

/**
 * @param {number} robotAngle - The angle of the robot at the waypoint.
 *      Should be undefined for tank drives, as the angle is computed automatically/the same as the waypoint angle.
 */
export interface WaypointBase {
    id: EntityId;
    name: string;
    robotAngle?: number;
}

/**
 * The reference for x and y is as follows. The position is assumed to be relative to the starting position of the robot,
 * so the origin is at the left middle of the screen. y varies from 0 to the width of the field. x varies from -height / 2 to
 * height / 2.
 * 
 * @param {number} x - The x position of the waypoint. Units in meters.
 * @param {number} y - The y position of the waypoint. Units in meters.
 * @param {number} angle - The angle of the waypoint. Units in degrees.
 */
export interface ControlWaypoint extends WaypointBase {
    x: number;
    y: number;
    angle: number;
}

/**
 * @param {number} parameter - The position of the waypoint relative to the spline defined
 *      by the previous and next control waypoints in the path. Is in the range [0, 1].
 */
export interface FollowerWaypoint extends WaypointBase {
    parameter: number;
}

export type Waypoint = ControlWaypoint | FollowerWaypoint;

export const waypointsAdapter = createEntityAdapter<Waypoint>();
const simpleSelectors = waypointsAdapter.getSelectors();

export const waypointsSlice = createSlice({
    name: "waypoints",
    initialState: waypointsAdapter.getInitialState(),
    reducers: {
        /**
         * @param {number} index @optional
         *      The index to insert at. The exisiting waypoint at the index is shifted back to make room.
         */
        addedWaypoint: {
            reducer: (waypointState, action: PayloadAction<{
                waypointId: EntityId,
                index?: number
            }>) => {
                waypointsAdapter.addOne(waypointState, {
                    id: action.payload.waypointId,
                    name: getNextName(simpleSelectors.selectAll(waypointState), "Waypoint"),
                    x: 0,
                    y: 0,
                    angle: 0
                });
            },
            prepare: (index?: number) => {
                return { payload: { waypointId: nanoid(), index } };
            }
        },
        deletedWaypoint: waypointsAdapter.removeOne,
        changedWaypoint: waypointsAdapter.updateOne,
        duplicatedWaypointInternal: (waypointState, action: PayloadAction<{ waypointId: EntityId, newWaypointId: EntityId }>) => {
            const waypoint = simpleSelectors.selectById(waypointState, action.payload.waypointId);
            if (waypoint) {
                let copy = Object.assign({}, waypoint);
                copy.id = action.payload.newWaypointId;
                copy.name = "Copy of " + copy.name;
                waypointsAdapter.addOne(waypointState, copy);
            }
        },
        renamedWaypoint(waypointState, action: PayloadAction<{ newName: string, id: EntityId }>) {
            let waypoint = simpleSelectors.selectById(waypointState, action.payload.id);
            if (waypoint !== undefined) {
                waypointsAdapter.updateOne(waypointState, { id: action.payload.id, changes: { name: action.payload.newName } });
            }
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(addedRoutineInternal, (waypointState, action) => {
                action.payload.waypointIds.forEach(waypointId => {
                    waypointsAdapter.addOne(waypointState, {
                        id: waypointId,
                        name: getNextName(simpleSelectors.selectAll(waypointState), "Waypoint"),
                        x: 0,
                        y: 0,
                        angle: 0
                    })
                });
            })
            .addCase(duplicatedRoutineInternal, (waypointState, action) => {
                waypointsAdapter.addMany(waypointState, action.payload.waypoints);
            })
            // matchers must come last
            .addMatcher(
                isAnyOf(deletedRoutineInternal, deletedFolderInternal),
                (waypointState, action) => waypointsAdapter.removeMany(waypointState, action.payload.waypointIds))
    }
});

/**
 * Made tricky by the need to insert into the correct location in path.
 * Could currently be a prepare function.
 * In the future, could simply dispatch addedWaypointAfter.
 */
export const duplicatedWaypoint = (id: EntityId): AppThunk => {
    return (dispatch, _getState) =>
        dispatch(waypointsSlice.actions.duplicatedWaypointInternal({
            waypointId: id,
            newWaypointId: nanoid()
        }));
};

export const {
    duplicatedWaypointInternal,
    addedWaypoint,
    deletedWaypoint,
    changedWaypoint,
    renamedWaypoint
} = waypointsSlice.actions;

// Runtime selectors
export const {
    selectById: selectWaypointById,
    selectIds: selectWaypointIds,
    selectAll: selectAllWaypoints,
    selectEntities: selectWaypointDictionary,
} = waypointsAdapter.getSelectors<RootState>((state) => state.waypoints);