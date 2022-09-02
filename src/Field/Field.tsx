import { Dictionary } from "@reduxjs/toolkit";
import { KonvaEventObject } from "konva/lib/Node";
import React from "react";

import { Layer, Line, Rect, Stage } from "react-konva";
import finalPropsSelectorFactory from "react-redux/es/connect/selectorFactory";
import { useAppDispatch, useAppSelector } from "../Store/hooks";
import { AppDispatch, RootState } from "../Store/store";
import { Path, selectPathById } from "../Tree/pathsSlice";
import { selectActiveRoutine } from "../Tree/uiSlice";
import { isControlWaypoint, selectWaypointDictionary, Waypoint, waypointMoved } from "../Tree/waypointsSlice";
import { selectFieldHeight, selectFieldWidth } from "./fieldSlice";
import { FieldCanvas, Units } from "./mathUtils";

/**
 * We need a couple manipulators
 * Control waypoint:
 * Position (x, y, and square)
 * Angle (could be tied to position manipulator, ala Onshape sketch transform)
 * Robot angle (custom rotation manipulator, rendered as a dot?)
 */
export function Field(): JSX.Element {
    const dispatch = useAppDispatch();

    const [width, setWidth] = React.useState<number>(0);
    const [height, setHeight] = React.useState<number>(0);
    // const ref = React.useRef<HTMLDivElement>();

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

    const fieldCanvas = new FieldCanvas(height, width, useAppSelector(selectFieldHeight), useAppSelector(selectFieldWidth));

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

    const robotElements = getRobotRectangles(dispatch, paths, waypointDict, fieldCanvas);
    const pathSplines = getPathSplines(dispatch, paths, waypointDict);

    return (<div id="field">
        <Stage width={width} height={height}>
            {/* <Layer>
                <Rect width={width} height={height} fill="red" />
            </Layer> */}
            <Layer {...fieldCanvas.fieldTransform}>
                <Rect
                    x={0.5 * Units.INCH}
                    y={0.5 * Units.INCH}
                    width={useAppSelector(selectFieldWidth) - 1 * Units.INCH}
                    height={useAppSelector(selectFieldHeight) - 1 * Units.INCH}
                    strokeWidth={1 * Units.INCH}
                    stroke="black"
                    fill="grey"
                />
            </Layer>
            <Layer {...fieldCanvas.fieldTransform}>
                {robotElements}
                {pathSplines}
            </Layer>
            {/* <Layer {...fieldCanvas.fieldTransform}>
            </Layer> */}
        </Stage>
    </div >);
};

const getRobotRectangles = (dispatch: AppDispatch, paths: Path[], waypointDict: Dictionary<Waypoint>, fieldCanvas: FieldCanvas): JSX.Element[] => {
    return paths.flatMap(path => {
        return path.waypointIds.map(waypointId => {
            const waypoint = waypointDict[waypointId];
            if (!waypoint) { throw Error("Field expected valid waypoint."); }

            const onWaypointDrag = (e: KonvaEventObject<MouseEvent>) => {
                dispatch(waypointMoved({
                    id: waypointId,
                    x: e.target.x() + 9 * Units.INCH,
                    y: e.target.y() + 9 * Units.INCH
                }));
            };

            if (isControlWaypoint(waypoint)) {
                return (<Rect
                    key={waypoint.id}
                    x={waypoint.x - 9 * Units.INCH}
                    y={waypoint.y - 9 * Units.INCH}
                    width={18 * Units.INCH}
                    height={18 * Units.INCH}
                    rotation={waypoint.robotAngle ? waypoint.robotAngle / Units.DEGREE : 0}
                    strokeWidth={0.5 * Units.INCH}
                    stroke="black"
                    draggable={true}
                    onDragMove={onWaypointDrag}
                    onDragEnd={onWaypointDrag}
                />);
            }
            else {
                return (<Rect />);
            }
        });
    });
};


const getPathSplines = (dispatch: AppDispatch, paths: Path[], waypointDict: Dictionary<Waypoint>): JSX.Element[] => {
    return paths.flatMap(path => {
        let splines: JSX.Element[] = [];
        for (let i = 1; i < path.waypointIds.length; i++) {
            const prev = waypointDict[path.waypointIds[i - 1]];
            const waypoint = waypointDict[path.waypointIds[i]];
            if (!prev || !waypoint) { throw Error("Path spline expected valid waypoint."); }
            if (!isControlWaypoint(prev) || !isControlWaypoint(waypoint)) { throw Error("Follower waypoints are not supported by getPathSplines."); }

            splines.push(<Line
                key={waypoint.id}
                points={[prev.x, prev.y, waypoint.x, waypoint.y]}
                strokeWidth={0.5 * Units.INCH}
                stroke="black"
            />);
        }
        return splines;
    });
};