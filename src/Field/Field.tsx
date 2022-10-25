import React from "react";
import { EntityId } from "@reduxjs/toolkit";

import { KonvaEventObject } from "konva/lib/Node";
import { Circle, Layer, Line, Rect, Stage } from "react-konva";

import { Colors } from "@blueprintjs/core/lib/esm/common";
import { ContextMenu2, MenuItem2 } from "@blueprintjs/popover2";
import { Menu } from "@blueprintjs/core";

import { Provider, ReactReduxContext } from "react-redux";
import { useAppDispatch, useAppSelector } from "../Store/hooks";
import { AppDispatch, RootState, Store } from "../Store/store";

import { selectPathById } from "../Tree/pathsSlice";
import { selectActiveRoutine, selectHiddenWaypointIds } from "../Tree/uiSlice";
import { isControlWaypoint, MagnitudePosition, selectWaypointById, waypointMagnitudeMoved as waypointMagnitudeChanged, waypointMoved, waypointRobotRotated } from "../Tree/waypointsSlice";
import { FieldDimensions, selectFieldDimensions } from "./fieldSlice";
import { Point, PointUtils, Transform, Units } from "./mathUtils";
import { allItemsDeselected, selectHoveredWaypointIds, selectSelectedWaypointIds, ItemType, itemMouseEnter, itemMouseLeave, selectSelectedSplineIds, selectHoveredSplineIds, splineSelected, splineMouseEnter, splineMouseLeave, itemSelected } from "../Tree/tempUiSlice";
import { MenuLocation, WaypointContextMenu, wrapContextMenu } from "../Tree/TreeContextMenu";

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
    return (
        <div id="field">
            {/* Consumer is a component which takes a function as a child */}
            <ReactReduxContext.Consumer>
                {({ store }) => {
                    return (<FieldStage store={store} />);
                }}
            </ReactReduxContext.Consumer>
        </div >
    );
}

type ContextMenuHandler = (contextMenu: JSX.Element) => (e: KonvaEventObject<MouseEvent>) => void;
const ContextMenuHandlerContext = React.createContext<ContextMenuHandler>(() => () => { });

interface FieldStageProps {
    store: Store;
}

function FieldStage(props: FieldStageProps): JSX.Element {
    const dispatch = useAppDispatch();
    const [canvasWidth, setCanvasWidth] = React.useState<number>(0);
    const [canvasHeight, setCanvasHeight] = React.useState<number>(0);

    const resizeCanvas = React.useCallback(() => {
        const div = document.getElementById("field");
        if (div) {
            if (canvasHeight !== div.offsetHeight ||
                canvasWidth !== div.offsetWidth) {
                setCanvasHeight(div.offsetHeight);
                setCanvasWidth(div.offsetWidth);
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

    // context menu hooks
    const [contextMenu, setContextMenu] = React.useState<JSX.Element>(<></>);
    const getContextMenu = React.useCallback((): JSX.Element => (contextMenu), [contextMenu]);

    const getContextMenuHandler = (contextMenu: JSX.Element) => {
        return (e: KonvaEventObject<MouseEvent>) => {
            setContextMenu(wrapContextMenu(e.evt, contextMenu));
        };
    };

    const fieldDimensions = selectFieldDimensions(props.store.getState());
    const fieldTransform = computeFieldTransform(canvasHeight, canvasWidth, fieldDimensions);

    return (
        <ContextMenu2
            content={getContextMenu}
            className={"App-context-menu"}
        >
            <Stage
                width={canvasWidth}
                height={canvasHeight}
                onClick={(e: KonvaEventObject<MouseEvent>) => {
                    if (!e.cancelBubble) { dispatch(allItemsDeselected()); }
                }}
                onContextMenu={(e: KonvaEventObject<MouseEvent>) => {
                    if (!e.cancelBubble) {
                        getContextMenuHandler(<Menu>
                            <MenuItem2 label="Generic (outside)" />
                        </Menu>);
                    }
                }}
            >
                {/* Make store available again inside stage */}
                <Provider store={props.store}>
                    <ContextMenuHandlerContext.Provider value={getContextMenuHandler}>
                        <FieldLayer
                            fieldTransform={fieldTransform}
                            fieldDimensions={fieldDimensions}
                        />
                        <ElementLayer
                            fieldTransform={fieldTransform}
                        />
                    </ContextMenuHandlerContext.Provider>
                </Provider>
            </Stage>
        </ContextMenu2>
    );
}

function computeFieldTransform(canvasHeight: number, canvasWidth: number, fieldDimensions: FieldDimensions): Transform {
    const heightToWidth = fieldDimensions.width / fieldDimensions.height;
    const widthToHeight = fieldDimensions.height / fieldDimensions.width;

    const height = Math.min(
        canvasHeight,
        canvasWidth * widthToHeight
    );
    const width = height * heightToWidth;
    const PIXEL = height / fieldDimensions.height;

    const xShift = (canvasWidth - width) / 2;
    const yShift = (canvasHeight - height) / 2 + height;
    return { x: xShift, y: yShift, scaleX: PIXEL, scaleY: -PIXEL };
}

interface FieldLayerProps {
    fieldTransform: Transform;
    fieldDimensions: FieldDimensions;
}

function FieldLayer(props: FieldLayerProps): JSX.Element {
    const getContextMenuHandler = React.useContext(ContextMenuHandlerContext);
    return (<Layer
        {...props.fieldTransform}
        onContextMenu={getContextMenuHandler(<Menu >
            <MenuItem2 label="Generic" />
        </Menu>)}
    >
        <Rect
            x={0.5 * Units.INCH}
            y={0.5 * Units.INCH}
            width={props.fieldDimensions.width - 1 * Units.INCH}
            height={props.fieldDimensions.height - 1 * Units.INCH}
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

const shadowProps = {
    shadowColor: Colors.ORANGE3,
    shadowBlur: 3 * Units.INCH,
    shadowOpacity: 1
}

interface RobotElementProps {
    waypointId: EntityId;
}

export function RobotElement(props: RobotElementProps): JSX.Element | null {
    const dispatch = useAppDispatch();
    const getContextMenuHandler = React.useContext(ContextMenuHandlerContext);

    const waypoint = useAppSelector(state => selectWaypointById(state, props.waypointId));
    if (!waypoint) { throw new Error("Path spline expected valid waypoint."); }

    const hoveredWaypointIds = useAppSelector(selectHoveredWaypointIds);
    const hiddenWaypointIds = useAppSelector(selectHiddenWaypointIds);
    const selectedWaypointIds = useAppSelector(selectSelectedWaypointIds);

    const isHidden = hiddenWaypointIds.includes(waypoint.id);
    const isSelected = selectedWaypointIds.includes(waypoint.id);

    if (isControlWaypoint(waypoint)) {
        const onWaypointDrag = (e: KonvaEventObject<MouseEvent>) => {
            dispatch(waypointMoved(waypoint.id, PointUtils.KonvaEventPoint(e)));
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
            offset={{ x: 9 * Units.INCH, y: 9 * Units.INCH }}
            width={18 * Units.INCH}
            height={18 * Units.INCH}
            rotation={waypoint.robotAngle ? waypoint.robotAngle / Units.DEGREE : 0}
            strokeWidth={0.5 * Units.INCH}
            stroke={isHidden ? undefined : Colors.BLACK}
            fill={fill}
            shadowEnabled={hoveredWaypointIds.includes(waypoint.id)}
            {...shadowProps} //Takes key : value pairs from shadowProps.
            onClick={(e: KonvaEventObject<MouseEvent>) => { dispatch(itemSelected(waypoint.id, ItemType.WAYPOINT, e.evt.shiftKey)); }}
            draggable={!isHidden && isSelected}
            onDragMove={onWaypointDrag}
            onDragEnd={onWaypointDrag}
            onMouseEnter={() => { dispatch(itemMouseEnter(waypoint.id, ItemType.WAYPOINT)); }}
            onMouseLeave={() => { dispatch(itemMouseLeave(waypoint.id, ItemType.WAYPOINT)); }}
            onContextMenu={getContextMenuHandler(<WaypointContextMenu
                id={waypoint.id}
                menuLocation={MenuLocation.FIELD} handleRenameClick={() => { }}
            />)}
        />);

        const ballPoint = PointUtils.PolarPoint(waypoint.point, waypoint.robotAngle ?? 0, 2 * Units.FEET);
        const rotationManipulator = isSelected ? (<BallManipulator
            startPoint={waypoint.point}
            currentPoint={ballPoint}
            handleManipulatorDrag={(e: KonvaEventObject<MouseEvent>) => {
                dispatch(waypointRobotRotated({
                    id: waypoint.id,
                    point: PointUtils.KonvaEventPoint(e)
                }))
            }}
        />) : (null);

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

export function SplineElement(props: SplineElementProps): JSX.Element | null {
    const dispatch = useAppDispatch();
    const getContextMenuHandler = React.useContext(ContextMenuHandlerContext);

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

    const prevControl = PointUtils.PolarPoint(previousWaypoint.point, previousWaypoint.angle, previousWaypoint.startMagnitude);
    const currControl = PointUtils.PolarPoint(waypoint.point, waypoint.angle, -waypoint.endMagnitude);

    const isSelected = selectedSplineIds.some(splineIds => splineIds.every(splineId => [previousWaypoint.id, waypoint.id].includes(splineId)));

    const line = (<Line
        points={PointUtils.flatten([previousWaypoint.point, prevControl, currControl, waypoint.point])}
        bezier={true}
        strokeWidth={0.5 * Units.INCH}
        stroke={isSelected ? Colors.ORANGE1 : Colors.BLACK}
        hitStrokeWidth={3 * Units.INCH}
        shadowEnabled={hoveredSplineIds.some(splineIds => splineIds.every(splineId => [previousWaypoint.id, waypoint.id].includes(splineId)))}
        {...shadowProps}
        onClick={() => { dispatch(splineSelected([previousWaypoint.id, waypoint.id])); }}
        onMouseEnter={() => { dispatch(splineMouseEnter([previousWaypoint.id, waypoint.id])); }}
        onMouseLeave={() => { dispatch(splineMouseLeave([previousWaypoint.id, waypoint.id])); }}
        onContextMenu={getContextMenuHandler(<Menu>
            <MenuItem2 label="Spline" />
        </Menu>)}
    />);

    const manipulators = isSelected ? (<>
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
    </>) : (null);

    return (<>
        {line}
        {manipulators}
    </>);
}

function getManipulatorDragHandler(dispatch: AppDispatch, id: EntityId, magnitudePosition: MagnitudePosition) {
    return (e: KonvaEventObject<MouseEvent>) => {
        dispatch(waypointMagnitudeChanged({
            id,
            magnitudePosition,
            point: PointUtils.KonvaEventPoint(e)
        }));
    };
}

interface BallManipulatorProps {
    startPoint: Point;
    currentPoint: Point;
    handleManipulatorDrag: (e: KonvaEventObject<MouseEvent>) => void;
}

function BallManipulator(props: BallManipulatorProps): JSX.Element {
    const [isHovered, setHovered] = React.useState<boolean>(false);
    const [isSelected, setSelected] = React.useState<boolean>(false);

    const line = (<Line
        points={PointUtils.flatten([props.startPoint, props.currentPoint])}
        strokeWidth={0.25 * Units.INCH}
        stroke={isSelected ? Colors.ORANGE1 : Colors.BLACK}
    />);

    return (<>
        <Circle
            {...props.currentPoint}
            radius={2 * Units.INCH}
            hitStrokeWidth={3 * Units.INCH}
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