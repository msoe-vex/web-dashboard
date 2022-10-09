import React from "react";
import { Colors } from "@blueprintjs/core/lib/esm/common";
import { EntityId } from "@reduxjs/toolkit";
import { KonvaEventObject } from "konva/lib/Node";
import { Circle, Layer, Line, Rect, Stage } from "react-konva";
import { Provider, ReactReduxContext } from "react-redux";

import { useAppDispatch, useAppSelector } from "../Store/hooks";
import { AppDispatch, RootState, Store } from "../Store/store";
import { selectPathById } from "../Tree/pathsSlice";
import { selectActiveRoutine, selectHiddenWaypointIds } from "../Tree/uiSlice";
import { isControlWaypoint, MagnitudePosition, selectWaypointById, waypointMagnitudeMoved, waypointMoved } from "../Tree/waypointsSlice";
import { FieldDimensions, selectFieldDimensions } from "./fieldSlice";
import { Transform, Units } from "./mathUtils";
import { allItemsDeselected, selectHoveredWaypointIds, selectSelectedWaypointIds, ItemType, itemMouseEnter, itemMouseLeave, selectSelectedSplineIds, selectHoveredSplineIds, splineSelected, splineMouseEnter, splineMouseLeave, itemSelected } from "../Tree/tempUiSlice";


/**
 * We need a couple manipulators
 * Control waypoint:
 * Position (x, y, and square)
 * Angle (could be tied to position manipulator, ala Onshape sketch transform)
 * Robot angle (custom rotation manipulator, rendered as a dot?)
 */
export function Field(): JSX.Element {

    // Konva does not like Redux, so some shenanigans are required to make the store available inside the Konva stage
    // https://github.com/konvajs/react-konva/issues/311#issuecomment-536634446
    return (<div id="field">
        {/* Consumer is a component which takes a function as a child */}
        <ReactReduxContext.Consumer>
            {({ store }) => {
                // Avoid using useAppSelector to prevent issues with react hooks

                return (<FieldStage
                    store = {store}
                />);
            }}
        </ReactReduxContext.Consumer>
    </div >);
}

function computeFieldTransform(canvasHeight: number, canvasWidth: number, dimensions: FieldDimensions): Transform {
    const heightToWidth = dimensions.width / dimensions.height;
    const widthToHeight = dimensions.height / dimensions.width;

    const height = Math.min(
        canvasHeight,
        canvasWidth * widthToHeight
    );
    const width = height * heightToWidth;
    const PIXEL = height / dimensions.height;

    const xShift = (canvasWidth - width) / 2;
    const yShift = (canvasHeight - height) / 2 + height;
    return { x: xShift, y: yShift, scaleX: PIXEL, scaleY: -PIXEL };
}

interface FieldStageProps {
    store: Store;
}

function FieldStage(props: FieldStageProps): JSX.Element {
    const dispatch = useAppDispatch();
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
    const fieldDimensions = selectFieldDimensions(props.store.getState());
    const fieldTransform = computeFieldTransform(height, width, fieldDimensions);

    return (<Stage 
        width = {width} 
        height = {height}
        onClick={(e: KonvaEventObject<MouseEvent>) => {
            if (!e.cancelBubble) { dispatch(allItemsDeselected()); }
        }}
    >
        {/* Make store available again inside stage */}
        <Provider store={props.store}>
            <FieldLayer
                fieldTransform={fieldTransform}
                dimensions={fieldDimensions}
            />
            <ElementLayer
                fieldTransform={fieldTransform}
            />
        </Provider>
        </Stage>);
    }

        interface FieldLayerProps {
            fieldTransform: Transform;
        dimensions: FieldDimensions;
}

        function FieldLayer(props: FieldLayerProps): JSX.Element {
    return (<Layer {...props.fieldTransform}>
            <Rect
                x={0.5 * Units.INCH}
                y={0.5 * Units.INCH}
                width={props.dimensions.width - 1 * Units.INCH}
                height={props.dimensions.height - 1 * Units.INCH}
                strokeWidth={1 * Units.INCH}
                stroke={Colors.BLACK}
                fill={Colors.GRAY1}
            />
        </Layer>);
}

        interface ElementLayerProps {
            fieldTransform: Transform;
}

        function ElementLayer(props: ElementLayerProps): JSX.Element {
    return (<Layer {...props.fieldTransform}
            onClick={(e: KonvaEventObject<MouseEvent>) => { e.cancelBubble = true; }}
        >
            <RobotElements />
        </Layer>)
}

// interface RobotElementsProps {
// }

export function RobotElements(): JSX.Element {
    const paths = useAppSelector((state: RootState) => {
        const activeRoutine = selectActiveRoutine(state);
        if (!activeRoutine) { throw new Error("Field expected valid active routine."); }

        return activeRoutine.pathIds.map(pathId => {
            const path = selectPathById(state, pathId);
        if (!path) { throw new Error("Field expected valid paths."); }
        return path;
        });
    });

        return (<>
            {paths.flatMap(path => path.waypointIds.map(waypointId =>
                <RobotElement
                    key={waypointId}
                    waypointId={waypointId}
                />))}
            {paths.flatMap(path => {
                var elements = [];
                for (let i = 1; i < path.waypointIds.length; ++i) {
                    elements.push(<SplineElement
                        key={path.waypointIds[i]}
                        previousWaypointId={path.waypointIds[i - 1]}
                        waypointId={path.waypointIds[i]}
                    />);
                }
                return elements;
            })}
        </>);
}

        interface RobotElementProps {waypointId: EntityId; }

        export function RobotElement(props: RobotElementProps): JSX.Element | null {
    const dispatch = useAppDispatch();

    const waypoint = useAppSelector(state => selectWaypointById(state, props.waypointId));
        if (!waypoint) { throw new Error("Path spline expected valid waypoint."); }

        const hoveredWaypointIds = useAppSelector(selectHoveredWaypointIds);
        const hiddenWaypointIds = useAppSelector(selectHiddenWaypointIds);
        const selectedWaypointIds = useAppSelector(selectSelectedWaypointIds);

        const isHidden = hiddenWaypointIds.includes(waypoint.id);
        const isSelected = selectedWaypointIds.includes(waypoint.id);

        if (isControlWaypoint(waypoint)) {
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
            if (isHidden) {fill = isSelected ? Colors.ORANGE3 : undefined; }
            else {fill = isSelected ? Colors.ORANGE1 : Colors.BLUE1; }

            return (<Rect
                x={waypoint.x - 9 * Units.INCH}
                y={waypoint.y - 9 * Units.INCH}
                width={18 * Units.INCH}
                height={18 * Units.INCH}
                rotation={waypoint.robotAngle ? waypoint.robotAngle / Units.DEGREE : 0}
                strokeWidth={0.5 * Units.INCH}
                stroke={isHidden ? undefined : Colors.BLACK}
                fill={fill}
                shadowEnabled={hoveredWaypointIds.includes(waypoint.id)}
                shadowColor={Colors.ORANGE3}
                shadowBlur={3 * Units.INCH}
                shadowOpacity={1}
                onClick={(e: KonvaEventObject<MouseEvent>) => { dispatch(itemSelected(waypoint.id, ItemType.WAYPOINT, e.evt.shiftKey)); }}
                draggable={!isHidden && isSelected}
                onDragMove={onWaypointDrag}
                onDragEnd={onWaypointDrag}
                onMouseEnter={() => { dispatch(itemMouseEnter(waypoint.id, ItemType.WAYPOINT)); }}
                onMouseLeave={() => { dispatch(itemMouseLeave(waypoint.id, ItemType.WAYPOINT)); }}
            />);
    }
            else {
        return null;
    }
}

            interface SplineElementProps {
                previousWaypointId: EntityId;
            waypointId: EntityId;
}

            export function SplineElement(props: SplineElementProps): JSX.Element | null {
    const dispatch = useAppDispatch();

    const previousWaypoint = useAppSelector(state => selectWaypointById(state, props.previousWaypointId));
    const waypoint = useAppSelector(state => selectWaypointById(state, props.waypointId));

            if (!previousWaypoint || !waypoint) { throw new Error("Path spline expected valid waypoint."); }
            if (!isControlWaypoint(previousWaypoint) || !isControlWaypoint(waypoint)) {
        throw new Error("Follower waypoints are not supported by SplineElement.");
    }

            const hiddenWaypointIds = useAppSelector(selectHiddenWaypointIds);
            const selectedSplineIds = useAppSelector(selectSelectedSplineIds);
            const hoveredSplineIds = useAppSelector(selectHoveredSplineIds);

            if (hiddenWaypointIds.includes(previousWaypoint.id) && hiddenWaypointIds.includes(waypoint.id)) { return null; }

            const prevControlX = previousWaypoint.x + Math.cos(previousWaypoint.angle) * previousWaypoint.startMagnitude;
            const prevControlY = previousWaypoint.y + Math.sin(previousWaypoint.angle) * previousWaypoint.startMagnitude;

            const currControlX = waypoint.x + Math.cos(waypoint.angle) * -waypoint.endMagnitude;
            const currControlY = waypoint.y + Math.sin(waypoint.angle) * -waypoint.endMagnitude;

    const isSelected = selectedSplineIds.some(splineIds => splineIds.every(splineId => [previousWaypoint.id, waypoint.id].includes(splineId)));

            const line = (<Line
                points={[previousWaypoint.x, previousWaypoint.y, prevControlX, prevControlY, currControlX, currControlY, waypoint.x, waypoint.y]}
                bezier={true}
                strokeWidth={0.5 * Units.INCH}
                stroke={isSelected ? Colors.ORANGE1 : Colors.BLACK}
                hitStrokeWidth={3 * Units.INCH}
                shadowEnabled={hoveredSplineIds.some(splineIds => splineIds.every(splineId => [previousWaypoint.id, waypoint.id].includes(splineId)))}
                shadowColor={Colors.ORANGE3}
                shadowBlur={3 * Units.INCH}
                shadowOpacity={1}
                onClick={() => { dispatch(splineSelected([previousWaypoint.id, waypoint.id])); }}
                onMouseEnter={() => { dispatch(splineMouseEnter([previousWaypoint.id, waypoint.id])); }}
                onMouseLeave={() => { dispatch(splineMouseLeave([previousWaypoint.id, waypoint.id])); }}
            />);

            const manipulators = isSelected ? (<>
                <MagnitudeManipulator
                    startX={previousWaypoint.x}
                    startY={previousWaypoint.y}
                    x={prevControlX}
                    y={prevControlY}
                    handleManipulatorDrag={getManipulatorDragHandler(dispatch, previousWaypoint.id, MagnitudePosition.START)}
                />
                <MagnitudeManipulator
                    startX={waypoint.x}
                    startY={waypoint.y}
                    x={currControlX}
                    y={currControlY}
                    handleManipulatorDrag={getManipulatorDragHandler(dispatch, waypoint.id, MagnitudePosition.END)}
                />
            </>) : (null);

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
                    x: e.target.x(),
                    y: e.target.y(),
                }));
    };
}

                interface MagnitudeManipulatorProps {
                    startX: number;
                startY: number;
                x: number;
                y: number;
                handleManipulatorDrag: (e: KonvaEventObject<MouseEvent>) => void;
}

                    function MagnitudeManipulator(props: MagnitudeManipulatorProps): JSX.Element {
    const [isHovered, setHovered] = React.useState<boolean>(false);
                        const [isSelected, setSelected] = React.useState<boolean>(false);

                            const line = (<Line
                                points={[props.startX, props.startY, props.x, props.y]}
                                strokeWidth={0.25 * Units.INCH}
                                stroke={isSelected ? Colors.ORANGE1 : Colors.BLACK}
                            />);

                            return (<>
                                <Circle
                                    radius={2 * Units.INCH}
                                    x={props.x}
                                    y={props.y}
                                    hitStrokeWidth={3 * Units.INCH}
                                    fill={isSelected ? Colors.ORANGE1 : Colors.BLACK}
                                    shadowEnabled={isHovered}
                                    shadowColor={Colors.ORANGE3}
                                    shadowBlur={3 * Units.INCH}
                                    shadowOpacity={1}
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