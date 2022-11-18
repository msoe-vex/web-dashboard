import { createSlice, createEntityAdapter, nanoid, EntityId, PayloadAction } from "@reduxjs/toolkit";

import { RootState } from "../Store/store";
import { selectOwnerPath, selectPathByValidId } from "../Navbar/pathsSlice";
import { ItemType } from "./tempUiSlice";
import { addValidIdSelector, getNextName, getSimpleSelectors } from "../Store/storeUtils";
import { INCH } from "../Field/mathUtils";

export interface Robot {
    id: EntityId;
    name: string;
    robotType: RobotType;
    width: number;
    length: number;
    maxVelocity: number;
    maxAcceleration: number;
}

export enum RobotType {
    SWERVE,
    TANK
}

const robotsAdapter = createEntityAdapter<Robot>();
const simpleSelectors = getSimpleSelectors(robotsAdapter);

export const robotsSlice = createSlice({
    name: "robots",
    initialState: robotsAdapter.getInitialState(),
    reducers: {
        addedRobot(robotState) {
            robotsAdapter.addOne(robotState, {
                id: nanoid(),
                name: getNextName(simpleSelectors.selectAll(robotState), "Robot"),
                robotType: RobotType.SWERVE,
                width: 18 * INCH,
                length: 18 * INCH,
                maxVelocity: 50,
                maxAcceleration: 100
            });
        },
        renamedRobot(robotState, action: PayloadAction<{ newName: string, id: EntityId }>) {
            robotsAdapter.updateOne(robotState, { id: action.payload.id, changes: { name: action.payload.newName } });
        },
        deletedRobot: robotsAdapter.removeOne,
        updatedRobot: robotsAdapter.updateOne,
        duplicatedRobot(robotState, action: PayloadAction<EntityId>) {
            const robot = simpleSelectors.selectById(robotState, action.payload);
            let copy = Object.assign({}, robot);
            copy.id = nanoid();
            copy.name = "Copy of " + copy.name;
            robotsAdapter.addOne(robotState, copy);
        },
        robotTypeChanged(robotState, action: PayloadAction<{ id: EntityId, robotType: RobotType }>) {
            robotsAdapter.updateOne(robotState, { id: action.payload.id, changes: { ...action.payload } });
        },
        robotMaxVelocityChanged(robotState, action: PayloadAction<{ id: EntityId, value: number }>) {
            robotsAdapter.updateOne(robotState, { id: action.payload.id, changes: { maxVelocity: action.payload.value } });
        },
        robotMaxAccelerationChanged(robotState, action: PayloadAction<{ id: EntityId, value: number }>) {
            robotsAdapter.updateOne(robotState, { id: action.payload.id, changes: { maxAcceleration: action.payload.value } });
        },
    }
    // extraReducers: (builder) => { }
});

export const {
    addedRobot,
    renamedRobot,
    deletedRobot,
    duplicatedRobot,
    updatedRobot,
    robotMaxAccelerationChanged,
    robotMaxVelocityChanged,
    robotTypeChanged
} = robotsSlice.actions;

// Runtime selectors
export const {
    selectById: selectRobotById,
    selectByValidId: selectRobotByValidId,
    selectIds: selectRobotIds,
    selectAll: selectAllRobots,
    selectEntities: selectRobotDictionary
} = addValidIdSelector(robotsAdapter.getSelectors<RootState>((state) => state.history.present.robots));

/**
 * Selects the robot associated with a given item.
 */
export function selectOwnerRobot(state: RootState, id: EntityId, itemType: ItemType): Robot {
    let path;
    switch (itemType) {
        case ItemType.WAYPOINT:
        case ItemType.FOLDER:
            path = selectOwnerPath(state, id, itemType);
            break;
        case ItemType.PATH:
            path = selectPathByValidId(state, id);
            break;
        default:
            throw new Error("selectOwnerPath item type is not defined.");
    }
    return selectRobotByValidId(state, path.robotId);
}