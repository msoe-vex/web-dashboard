import { createSlice, createEntityAdapter, nanoid, EntityId, PayloadAction } from "@reduxjs/toolkit";
import { Units } from "../Field/mathUtils";

import { RootState } from "../Store/store";
import { getNextName } from "./Utils";

export interface Robot {
    id: EntityId;
    name: string;
    width: number;
    length: number;
}

const robotsAdapter = createEntityAdapter<Robot>();
const simpleSelectors = robotsAdapter.getSelectors();

export const robotsSlice = createSlice({
    name: "robots",
    initialState: robotsAdapter.getInitialState(),
    reducers: {
        addedRobot: {
            // we can use prepare since nothing else needs to respond to addedRobot
            reducer: (robotState, action: PayloadAction<EntityId>) => {
                robotsAdapter.addOne(robotState, {
                    id: action.payload,
                    name: getNextName(simpleSelectors.selectAll(robotState), "Robot"),
                    width: 18 * Units.INCH,
                    length: 18 * Units.INCH
                });
            },
            prepare: () => { return { payload: nanoid() }; }
        }
    },
    // extraReducers: (builder) => { }
});

export const {
    addedRobot
} = robotsSlice.actions;

// Runtime selectors
export const {
    selectById: selectRobotById,
    selectIds: selectRobotIds,
    selectAll: selectAllRobots,
    selectEntities: selectRobotDictionary,
} = robotsAdapter.getSelectors<RootState>((state) => state.present.robots);
