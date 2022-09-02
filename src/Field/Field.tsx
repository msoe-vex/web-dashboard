import { Dictionary, EntityId } from "@reduxjs/toolkit";
import { KonvaEventObject } from "konva/lib/Node";
import React from "react";

import { Layer, Line, Rect, Stage } from "react-konva";
import { Provider, ReactReduxContext } from "react-redux";
import { TypeOfExpression } from "typescript";
import { useAppDispatch, useAppSelector } from "../Store/hooks";
import { AppDispatch, RootState } from "../Store/store";
import { Path, selectPathById } from "../Tree/pathsSlice";
import { selectActiveRoutine, selectHiddenWaypointIds, selectHighlightedWaypointIds, selectHoveredWaypointIds } from "../Tree/uiSlice";
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

    return (<div id="field">
        {/* Consumer is a component which takes a function as a child */}
        <ReactReduxContext.Consumer>
            {
                ({ store }) => {
                    // Avoid using useAppSelector to prevent issues with react hooks
                    const fieldHeight = selectFieldHeight(store.getState());
                    const fieldWidth = selectFieldWidth(store.getState());
                    const fieldTransform = computeFieldTransform(height, width, fieldHeight, fieldWidth);

                    return (
                        <Stage width={width} height={height}>
                            {/* Make store available again inside stage */}
                            <Provider store={store}>
                                <Layer {...fieldTransform}>
                                    <Rect
                                        x={0.5 * Units.INCH}
                                        y={0.5 * Units.INCH}
                                        width={fieldWidth - 1 * Units.INCH}
                                        height={fieldHeight - 1 * Units.INCH}
                                        strokeWidth={1 * Units.INCH}
                                        stroke="black"
                                        fill="grey"
                                    />
                                </Layer>
                                <Layer {...fieldTransform}>
                                    <RobotElements />
                                </Layer>
                            </Provider>
                        </Stage>
                    );
                }
            }
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

export function RobotElements(props: RobotElementsProps): JSX.Element {
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
    const selectedIds = useAppSelector(selectHighlightedWaypointIds);
    const hoveredIds = useAppSelector(selectHoveredWaypointIds);

    const elements = getRobotElements(
        dispatch,
        paths,
        waypointDict,
        hiddenIds,
        selectedIds,
        hoveredIds
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
    hoveredIds: EntityId[]
): JSX.Element[] => {
    return paths.flatMap(path => {
        let elements: JSX.Element[] = [];

        for (let i = 0; i < path.waypointIds.length; i++) {
            const waypoint = waypointDict[path.waypointIds[i]];
            if (!waypoint) { throw Error("Path spline expected valid waypoint."); }

            if (hiddenIds.includes(waypoint.id)) { continue; }

            const onWaypointDrag = (e: KonvaEventObject<MouseEvent>) => {
                dispatch(waypointMoved({
                    id: waypoint.id,
                    x: e.target.x() + 9 * Units.INCH,
                    y: e.target.y() + 9 * Units.INCH
                }));
            };

            if (isControlWaypoint(waypoint)) {
                elements.push(<Rect
                    key={"Robot" + waypoint.id}
                    x={waypoint.x - 9 * Units.INCH}
                    y={waypoint.y - 9 * Units.INCH}
                    width={18 * Units.INCH}
                    height={18 * Units.INCH}
                    rotation={waypoint.robotAngle ? waypoint.robotAngle / Units.DEGREE : 0}
                    strokeWidth={0.5 * Units.INCH}
                    stroke="black"
                    // shadowEnabled={selectedIds.includes(waypoint.id)}
                    draggable={selectedIds.includes(waypoint.id)}
                    onDragMove={onWaypointDrag}
                    onDragEnd={onWaypointDrag}
                />);
            }

            if (i !== 0) {
                const prev = waypointDict[path.waypointIds[i - 1]];
                if (!prev) { throw Error("Path spline expected valid waypoint."); }
                if (!isControlWaypoint(prev) || !isControlWaypoint(waypoint)) {
                    throw Error("Follower waypoints are not supported by getPathSplines.");
                }

                elements.push(<Line
                    key={"spline" + waypoint.id}
                    points={[prev.x, prev.y, waypoint.x, waypoint.y]}
                    strokeWidth={0.5 * Units.INCH}
                    stroke="black"
                />);
            }
        }

        return elements;
    });
};