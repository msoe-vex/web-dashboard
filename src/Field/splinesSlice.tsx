// import { createEntityAdapter, createSlice, EntityId, nanoid } from "@reduxjs/toolkit";
// import { RootState } from "../Store/store";
// import { addedWaypoint } from "../Tree/waypointsSlice";


export interface Spline {
    // startWaypointId: EntityId;
    // endWaypointId: EntityId;
}

// export const splinesAdapter = createEntityAdapter<Spline>();

// export const splinesSlice = createSlice({
//     name: "splines",
//     initialState: splinesAdapter.getInitialState(),
//     reducers: {},
//     extraReducers: (builder) => {
//         builder
//             .addCase(addedWaypoint, (splineState, action) => {
//                 splinesAdapter.addOne(splineState, action.payload)
//             })
//     }
// });

// // export const {
// // } = splinesSlice.actions;

// export const {
//     selectById: selectSplineById,
//     selectIds: selectSplineIds,
//     selectAll: selectAllSplines,
//     selectEntities: selectSplineDictionary
// } = splinesAdapter.getSelectors<RootState>((state) => state.splines);