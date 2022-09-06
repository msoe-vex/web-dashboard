import { Colors } from "@blueprintjs/core/lib/esm/common";
import { Dictionary, EntityId } from "@reduxjs/toolkit";
import { KonvaEventObject } from "konva/lib/Node";
import React from "react";

import { Layer, Line, Rect, Stage } from "react-konva";
import { Provider, ReactReduxContext } from "react-redux";
import { useAppDispatch, useAppSelector } from "../Store/hooks";
import { AppDispatch, RootState } from "../Store/store";
import { Path, selectPathById } from "../Tree/pathsSlice";
import {
    selectActiveRoutine,
    selectHiddenWaypointIds,
    selectSelectedWaypointIds,
    selectHoveredWaypointIds,
    itemSelected,
    ItemType,
    itemMouseEnter,
    itemMouseLeave,
    allItemsDeselected,
    splineMouseEnter,
    splineMouseLeave,
    splineSelected,
    selectSelectedSplineIds,
    selectHoveredSplineIds
} from "../Tree/uiSlice";
import { isControlWaypoint, selectWaypointDictionary, Waypoint, waypointMoved } from "../Tree/waypointsSlice";
import { selectFieldHeight, selectFieldWidth } from "./fieldSlice";
import { Transform, Units } from "./mathUtils";

/**
 * We need a couple manipulators
 * Control waypoint:
 * Position (x, y, and square)
 * Angle (could be tied to position manipulator, ala Onshape sketch transform)
 * Robot angle (custom rotation manipulator, rendered as a dot?)
 */
export function Field(): JSX.Element {
    const [width, setWidth] = React.useState<number>(0);
    const [height, setHeight] = React.useState<number>(0);

    const resizeCanvas = React.useCallback(() => {
        const div = document.getElementById("field");
        if (div) {
            if (height !== div.offsetHeight ||
                width !== div.offsetWidth) {
                setHeight(div.offsetHeight);
                setWidth(div.offsetWidth);
            }
        }
        // callback doesn't need to be recalculated when height/width change
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    React.useEffect(() => {
        resizeCanvas();
        window.addEventListener("resize", resizeCanvas);
        return () => window.removeEventListener("resize", resizeCanvas);
    }, [resizeCanvas]);

    // Konva does not like Redux, so some shenanigans are required to make the store available inside the Konva stage
    // https://github.com/konvajs/react-konva/issues/311#issuecomment-536634446
    return (<div id="field">
        {/* Consumer is a component which takes a function as a child */}
        <ReactReduxContext.Consumer>
            {({ store }) => {
                // Avoid using useAppSelector to prevent issues with react hooks
                const dispatch = store.dispatch;
                const fieldHeight = selectFieldHeight(store.getState());
                const fieldWidth = selectFieldWidth(store.getState());
                const fieldTransform = computeFieldTransform(height, width, fieldHeight, fieldWidth);

                return (<Stage
                    width={width}
                    height={height}
                    onClick={(e: KonvaEventObject<MouseEvent>) => {
                        if (!e.cancelBubble) {
                            dispatch(allItemsDeselected());
                        }
                    }}
                >
                    {/* Make store available again inside stage */}
                    <Provider store={store}>
                        <Layer {...fieldTransform}
                        >
                            <Rect
                                x={0.5 * Units.INCH}
                                y={0.5 * Units.INCH}
                                width={fieldWidth - 1 * Units.INCH}
                                height={fieldHeight - 1 * Units.INCH}
                                strokeWidth={1 * Units.INCH}
                                stroke={Colors.BLACK}
                                fill={Colors.GRAY1}
                            />
                        </Layer>
                        <Layer {...fieldTransform}
                            onClick={(e: KonvaEventObject<MouseEvent>) => { e.cancelBubble = true; }}
                        >
                            <RobotElements />
                        </Layer>
                    </Provider>
                </Stage>);
            }}
        </ReactReduxContext.Consumer>
    </div >);
};

function computeFieldTransform(canvasHeight: number, canvasWidth: number, fieldHeight: number, fieldWidth: number): Transform {
    const heightToWidth = fieldWidth / fieldHeight;
    const widthToHeight = fieldHeight / fieldWidth;

    const height = Math.min(
        canvasHeight,
        canvasWidth * widthToHeight
    );
    const width = height * heightToWidth;
    const PIXEL = height / fieldHeight;

    const xShift = (canvasWidth - width) / 2;
    const yShift = (canvasHeight - height) / 2 + height;
    return { x: xShift, y: yShift, scaleX: PIXEL, scaleY: -PIXEL };
}

interface RobotElementsProps {

}

export function RobotElements(_props: RobotElementsProps): JSX.Element {
    const dispatch = useAppDispatch();

    const paths = useAppSelector((state: RootState) => {
        const activeRoutine = selectActiveRoutine(state);
        if (!activeRoutine) { throw Error("Field expected valid active routine."); }

        return activeRoutine.pathIds.map(pathId => {
            const path = selectPathById(state, pathId);
            if (!path) { throw Error("Field expected valid paths."); }
            return path;
        });
    });
    const waypointDict = useAppSelector(selectWaypointDictionary);

    const hiddenIds = useAppSelector(selectHiddenWaypointIds);
    const selectedIds = useAppSelector(selectSelectedWaypointIds);
    const hoveredIds = useAppSelector(selectHoveredWaypointIds);
    const selectedSplineIds = useAppSelector(selectSelectedSplineIds);
    const hoveredSplineIds = useAppSelector(selectHoveredSplineIds);

    const elements = getRobotElements(
        dispatch,
        paths,
        waypointDict,
        hiddenIds,
        selectedIds,
        hoveredIds,
        selectedSplineIds,
        hoveredSplineIds
    );

    return (<>
        {elements}
    </>);
}

const getRobotElements = (
    dispatch: AppDispatch,
    paths: Path[],
    waypointDict: Dictionary<Waypoint>,
    hiddenIds: EntityId[],
    selectedIds: EntityId[],
    hoveredIds: EntityId[],
    selectedSplineIds: EntityId[][],
    hoveredSplineIds: EntityId[][]
): JSX.Element[] => {
    return paths.flatMap(path => {
        let elements: JSX.Element[] = [];

        for (let i = 0; i < path.waypointIds.length; i++) {
            const waypoint = waypointDict[path.waypointIds[i]];
            if (!waypoint) { throw Error("Path spline expected valid waypoint."); }

            if (isControlWaypoint(waypoint)) {
                const isHidden = hiddenIds.includes(waypoint.id);
                const isSelected = selectedIds.includes(waypoint.id);

                const onWaypointDrag = (e: KonvaEventObject<MouseEvent>) => {
                    dispatch(waypointMoved({
                        id: waypoint.id,
                        x: e.target.x() + 9 * Units.INCH,
                        y: e.target.y() + 9 * Units.INCH
                    }));
                };

                // Several different behaviors depending on state
                // Not hidden:
                // Yellow shadow on hover and highlight on click (with robot)

                // Hidden:
                // Still yellow shadow on hover and highlight on click (but no robot)

                let fill;
                if (isHidden) { fill = isSelected ? Colors.ORANGE3 : undefined; }
                else { fill = isSelected ? Colors.ORANGE1 : Colors.BLUE1; }

                elements.push(<Rect
                    key={"Robot" + waypoint.id}
                    x={waypoint.x - 9 * Units.INCH}
                    y={waypoint.y - 9 * Units.INCH}
                    width={18 * Units.INCH}
                    height={18 * Units.INCH}
                    rotation={waypoint.robotAngle ? waypoint.robotAngle / Units.DEGREE : 0}
                    strokeWidth={0.5 * Units.INCH}
                    stroke={isHidden ? undefined : Colors.BLACK}
                    fill={fill}
                    lineJoin={"bevel"}
                    shadowEnabled={hoveredIds.includes(waypoint.id)}
                    shadowColor={Colors.ORANGE3}
                    shadowBlur={3 * Units.INCH}
                    shadowOpacity={1}
                    onClick={(e: KonvaEventObject<MouseEvent>) => {
                        dispatch(itemSelected(waypoint.id, ItemType.WAYPOINT, e.evt.shiftKey));
                    }}
                    draggable={!isHidden && isSelected}
                    onDragMove={onWaypointDrag}
                    onDragEnd={onWaypointDrag}
                    onMouseEnter={() => dispatch(itemMouseEnter(waypoint.id, ItemType.WAYPOINT))}
                    onMouseLeave={() => dispatch(itemMouseLeave(waypoint.id, ItemType.WAYPOINT))}
                />);
            }

            if (i !== 0) {
                const prev = waypointDict[path.waypointIds[i - 1]];
                if (!prev) { throw Error("Path spline expected valid waypoint."); }
                if (!isControlWaypoint(prev) || !isControlWaypoint(waypoint)) {
                    throw Error("Follower waypoints are not supported by getPathSplines.");
                }

                if (hiddenIds.includes(prev.id) && hiddenIds.includes(waypoint.id)) { continue; }

                const prevControlX = prev.x + Math.cos(prev.angle * prev.endMagnitude);
                const prevControlY = prev.y + Math.sin(prev.angle * prev.endMagnitude);

                const currControlX = waypoint.x - Math.cos(waypoint.angle * waypoint.startMagnitude);
                const currControlY = waypoint.y - Math.sin(waypoint.angle * waypoint.startMagnitude);

                elements.push(<Line
                    key={"spline" + waypoint.id}
                    points={[prev.x, prev.y, prevControlX, prevControlY, currControlX, currControlY, waypoint.x, waypoint.y]}
                    bezier={true}
                    strokeWidth={0.5 * Units.INCH}
                    stroke={selectedSplineIds.some(splineIds => splineIds.every(splineId => [prev.id, waypoint.id].includes(splineId))) ? Colors.ORANGE1 : Colors.BLACK}
                    strokeHitEnabled={true}
                    hitStrokeWidth={3 * Units.INCH}
                    shadowEnabled={hoveredSplineIds.some(splineIds => splineIds.every(splineId => [prev.id, waypoint.id].includes(splineId)))}
                    shadowColor={Colors.ORANGE3}
                    shadowBlur={3 * Units.INCH}
                    shadowOpacity={1}
                    onClick={() => dispatch(splineSelected([prev.id, waypoint.id]))}
                    onMouseEnter={() => dispatch(splineMouseEnter([prev.id, waypoint.id]))}
                    onMouseLeave={() => dispatch(splineMouseLeave([prev.id, waypoint.id]))}
                />);
            }
        }

        return elements;
    });
};