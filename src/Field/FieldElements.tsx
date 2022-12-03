import React, { useContext, useMemo, useState } from "react";

import { EntityId } from "@reduxjs/toolkit";
import { KonvaEventObject } from "konva/lib/Node";
import { Colors, Menu } from "@blueprintjs/core";
import { Line, Circle, Rect } from "react-konva";

import { useAppSelector, useAppDispatch } from "../Store/hooks";
import { AppDispatch } from "../Store/store";
import { selectPathByValidId } from "../Navbar/pathsSlice";
import { selectHoveredWaypointIds, selectSelectedWaypointIds, itemSelected, ItemType, itemMouseEnter, itemMouseLeave, selectSelectedSplineIds, selectHoveredSplineIds, splineSelected, splineMouseEnter, splineMouseLeave } from "../Tree/tempUiSlice";
import { MenuLocation, WaypointContextMenu, SplineContextMenu } from "../Tree/ContextMenu";
import { selectActiveRoutine, selectHiddenWaypointIds } from "../Tree/uiSlice";
import { isControlWaypoint, waypointMoved, waypointRobotRotated, MagnitudePosition, waypointMagnitudeMoved, selectWaypointById, ControlWaypoint } from "../Tree/waypointsSlice";
import { Point, makeCurve, parameterRange, INCH, DEGREE, FEET, flatten, makePointFromKonvaEvent, makePointFromPolar } from "./mathUtils";
import { MenuItem2 } from "@blueprintjs/popover2";
import { ContextMenuHandlerContext, getKonvaContextMenuHandler } from "./AppContextMenu";

export function FieldElements(): null | JSX.Element {
    const paths = useAppSelector(state => {
        return selectActiveRoutine(state)?.pathIds.map(pathId => selectPathByValidId(state, pathId));
    });

    return (!paths ? null : <>
        {paths.flatMap(path => path.waypointIds.map(waypointId =>
            <RobotElement
                key={waypointId}
                waypointId={waypointId}
            />))}
        {paths.flatMap(path =>
            path.waypointIds.map((waypointId, i, waypointIds) =>
                (i === 0) ? null : (<SplineElement
                    key={waypointId}
                    waypointId={waypointId}
                    previousWaypointId={waypointIds[i - 1]}
                />)))}
    </>);
}

const shadowProps = {
    shadowColor: Colors.ORANGE3,
    shadowBlur: 3 * INCH,
    shadowOpacity: 1
}

interface RobotElementProps {
    waypointId: EntityId;
}

function RobotElement(props: RobotElementProps): JSX.Element | null {
    const dispatch = useAppDispatch();
    const konvaContextMenuHandler = getKonvaContextMenuHandler(useContext(ContextMenuHandlerContext));

    const waypoint = useAppSelector(state => selectWaypointById(state, props.waypointId));

    const hoveredWaypointIds = useAppSelector(selectHoveredWaypointIds);
    const hiddenWaypointIds = useAppSelector(selectHiddenWaypointIds);
    const selectedWaypointIds = useAppSelector(selectSelectedWaypointIds);

    if (!waypoint) { return null; }

    const isHidden = hiddenWaypointIds.includes(waypoint.id);
    const isSelected = selectedWaypointIds.includes(waypoint.id);

    if (isControlWaypoint(waypoint)) {
        const onWaypointDrag = (e: KonvaEventObject<MouseEvent>) => {
            dispatch(waypointMoved(waypoint.id, makePointFromKonvaEvent(e)));
        };

        // Several different behaviors depending on state
        // Not hidden:
        // Yellow shadow on hover and highlight on click (with robot)

        // Hidden:
        // Still yellow shadow on hover and highlight on click (but no robot)

        let fill;
        if (isHidden) { fill = isSelected ? Colors.ORANGE3 : undefined; }
        else { fill = isSelected ? Colors.ORANGE1 : Colors.BLUE1; }

        const robotRectangle = (<Rect
            {...waypoint.point}
            offset={{ x: 9 * INCH, y: 9 * INCH }}
            width={18 * INCH}
            height={18 * INCH}
            rotation={(waypoint.robotAngle ?? 0) / DEGREE}
            strokeWidth={0.5 * INCH}
            stroke={isHidden ? undefined : Colors.BLACK}
            fill={fill}
            shadowEnabled={hoveredWaypointIds.includes(waypoint.id)}
            {...shadowProps} //Takes key : value pairs from shadowProps.
            onClick={(e: KonvaEventObject<MouseEvent>) => { dispatch(itemSelected(waypoint.id, ItemType.WAYPOINT, e.evt.shiftKey, e.evt.ctrlKey)); }}
            draggable={!isHidden}
            onDragMove={onWaypointDrag}
            onDragEnd={onWaypointDrag}
            onMouseEnter={() => { dispatch(itemMouseEnter(waypoint.id, ItemType.WAYPOINT)); }}
            onMouseLeave={() => { dispatch(itemMouseLeave(waypoint.id, ItemType.WAYPOINT)); }}
            onContextMenu={konvaContextMenuHandler(
                <WaypointContextMenu
                    id={waypoint.id}
                    menuLocation={MenuLocation.FIELD}
                />)
            }
        />);

        const ballPoint = makePointFromPolar(waypoint.point, waypoint.robotAngle ?? 0, 2 * FEET);
        const rotationManipulator = !isSelected ? null :
            (<BallManipulator
                startPoint={waypoint.point}
                currentPoint={ballPoint}
                handleManipulatorDrag={(e: KonvaEventObject<MouseEvent>) => {
                    dispatch(waypointRobotRotated({
                        id: waypoint.id,
                        point: makePointFromKonvaEvent(e)
                    }))
                }}
            />);

        return (<>
            {robotRectangle}
            {rotationManipulator}
        </>);
    }
    else {
        return null;
    }
}

interface SplineElementProps {
    previousWaypointId: EntityId;
    waypointId: EntityId;
}

function SplineElement(props: SplineElementProps): JSX.Element | null {
    const dispatch = useAppDispatch();
    const konvaContextMenuHandler = getKonvaContextMenuHandler(useContext(ContextMenuHandlerContext));

    const previousWaypoint = useAppSelector(state => selectWaypointById(state, props.previousWaypointId));
    const waypoint = useAppSelector(state => selectWaypointById(state, props.waypointId));

    const hiddenWaypointIds = useAppSelector(selectHiddenWaypointIds);
    const selectedSplineIds = useAppSelector(selectSelectedSplineIds);
    const hoveredSplineIds = useAppSelector(selectHoveredSplineIds);

    // const curve = useMemo(() => new Curve(previousWaypoint, waypoint), [previousWaypoint, waypoint]);

    if (!waypoint || !previousWaypoint) { return null; }
    else if (!isControlWaypoint(waypoint) || !isControlWaypoint(previousWaypoint)) { return null; }
    else if (hiddenWaypointIds.includes(previousWaypoint.id) && hiddenWaypointIds.includes(waypoint.id)) { return null; }

    const prevControl = makePointFromPolar(previousWaypoint.point, previousWaypoint.angle, previousWaypoint.startMagnitude);
    const currControl = makePointFromPolar(waypoint.point, waypoint.angle, -waypoint.endMagnitude);

    const isSelected = selectedSplineIds.some(splineIds => splineIds.every(splineId => [previousWaypoint.id, waypoint.id].includes(splineId)));

    const line = (<Line
        points={flatten(previousWaypoint.point, prevControl, currControl, waypoint.point)}
        bezier={true}
        strokeWidth={0.5 * INCH}
        stroke={isSelected ? Colors.ORANGE1 : Colors.BLACK}
        hitStrokeWidth={3 * INCH}
        shadowEnabled={hoveredSplineIds.some(splineIds => splineIds.every(splineId => [previousWaypoint.id, waypoint.id].includes(splineId)))}
        {...shadowProps}
        onClick={() => { dispatch(splineSelected([previousWaypoint.id, waypoint.id])); }}
        onMouseEnter={() => { dispatch(splineMouseEnter([previousWaypoint.id, waypoint.id])); }}
        onMouseLeave={() => { dispatch(splineMouseLeave([previousWaypoint.id, waypoint.id])); }}
        onContextMenu={konvaContextMenuHandler(
            <SplineContextMenu />)}
    />);

    const manipulators = !isSelected ? null : (<>
        <CurveVisualization
            previousWaypoint={previousWaypoint}
            waypoint={waypoint}
        />
        <BallManipulator
            startPoint={previousWaypoint.point}
            currentPoint={prevControl}
            handleManipulatorDrag={getManipulatorDragHandler(dispatch, previousWaypoint.id, MagnitudePosition.START)}
        />
        <BallManipulator
            startPoint={waypoint.point}
            currentPoint={currControl}
            handleManipulatorDrag={getManipulatorDragHandler(dispatch, waypoint.id, MagnitudePosition.END)}
        />
    </>);

    return (<>
        {line}
        {manipulators}
    </>);
}

function getManipulatorDragHandler(dispatch: AppDispatch, id: EntityId, magnitudePosition: MagnitudePosition) {
    return (e: KonvaEventObject<MouseEvent>) => {
        dispatch(waypointMagnitudeMoved({
            id,
            magnitudePosition,
            point: makePointFromKonvaEvent(e)
        }));
    };
}

interface BallManipulatorProps {
    startPoint: Point;
    currentPoint: Point;
    handleManipulatorDrag: (e: KonvaEventObject<MouseEvent>) => void;
}

function BallManipulator(props: BallManipulatorProps): JSX.Element {
    const [isHovered, setHovered] = useState<boolean>(false);
    const [isSelected, setSelected] = useState<boolean>(false);

    const line = (<Line
        points={flatten(props.startPoint, props.currentPoint)}
        strokeWidth={0.25 * INCH}
        stroke={isSelected ? Colors.ORANGE1 : Colors.BLACK}
    />);

    return (<>
        <Circle
            {...props.currentPoint}
            radius={2 * INCH}
            hitStrokeWidth={3 * INCH}
            fill={isSelected ? Colors.ORANGE1 : Colors.BLACK}
            shadowEnabled={isHovered}
            {...shadowProps}
            draggable={true}
            onDragStart={() => { setSelected(true); }}
            onDragMove={props.handleManipulatorDrag}
            onDragEnd={(e: KonvaEventObject<MouseEvent>) => {
                setSelected(false);
                props.handleManipulatorDrag(e);
            }}
            onMouseEnter={() => { setHovered(true); }}
            onMouseLeave={() => { setHovered(false); }}
        />
        {line}
    </>);
}

interface CurveVisualizationProps {
    previousWaypoint: ControlWaypoint;
    waypoint: ControlWaypoint;
}

function CurveVisualization(props: CurveVisualizationProps): JSX.Element {
    const curve = useMemo(() => makeCurve(props.previousWaypoint, props.waypoint), [props]);

    const curvaturePoints = parameterRange(60).map(parameter => curve.curvaturePoint(parameter));
    return (<>
        <Line
            points={flatten(...curvaturePoints)}
            strokeWidth={0.5 * INCH}
            stroke={Colors.RED2}
        />

        {parameterRange(20).map(parameter => <Line
            key={parameter}
            points={flatten(curve.point(parameter), curve.curvaturePoint(parameter))}
            strokeWidth={0.25 * INCH}
            stroke={Colors.ORANGE3}
        />)}
    </>);
}