import { createSlice, createEntityAdapter, nanoid, EntityId, PayloadAction } from "@reduxjs/toolkit";
import { Units } from "../Field/mathUtils";

import { RootState } from "../Store/store";
import { selectOwnerPath, selectPathById } from "./pathsSlice";
import { ItemType, TreeItemType } from "./tempUiSlice";
import { getNextName } from "./Utils";

export interface Robot {
    id: EntityId;
    name: string;
    robotType: RobotType;
    width: number;
    length: number;
}

export enum RobotType {
    SWERVE,
    TANK
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
                    robotType: RobotType.SWERVE,
                    width: 18 * Units.INCH,
                    length: 18 * Units.INCH
                });
            },
            prepare: () => { return { payload: nanoid() }; }
        }
    },
    // extraReducers: (builder) => { }
});

export const { addedRobot } = robotsSlice.actions;

// Runtime selectors
export const {
    selectById: selectRobotById,
    selectIds: selectRobotIds,
    selectAll: selectAllRobots,
    selectEntities: selectRobotDictionary,
} = robotsAdapter.getSelectors<RootState>((state) => state.history.present.robots);

/**
 * Selects the robot which owns (is associated with) a given item.
 */
export function selectOwnerRobot(state: RootState, itemId: EntityId, itemType: TreeItemType): Robot {
    let path;
    switch (itemType) {
        case ItemType.WAYPOINT:
        case ItemType.FOLDER:
            path = selectOwnerPath(state, itemId, itemType);
            break;
        case ItemType.PATH:
            path = selectPathById(state, itemId);
            break;
        default:
            throw new Error("selectOwnerPath item type is not defined.");
    }

    if (!path) { throw new Error("Expected valid pathId."); }
    const robot = selectRobotById(state, path.robotId);
    if (!robot) { throw new Error("Expected valid robotId."); }
    return robot;
}