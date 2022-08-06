import React from "react";
import { useAppSelector } from "../Store/hooks";
import { selectAllTreeWaypointIds } from "../Tree/treeActions";
import { selectHighlightedWaypointIds } from "../Tree/uiSlice";
import { isControlWaypoint, selectWaypointDictionary } from "../Tree/waypointsSlice";
import { FieldCanvas, Manipulator, Units } from "./mathUtils";

/**
 * We need a couple manipulators
 * Control waypoint:
 * Position (x, y, and square)
 * Angle (could be tied to position manipulator, ala Onshape sketch transform)
 * Robot angle (custom rotation manipulator, rendered as a dot?)
 */
export const Field = (): JSX.Element => {
    return (
        <div id="field" >
            {/* <BackgroundCanvas /> */}
            <WaypointCanvas />
        </div>
    );
};

const resizeCanvas = (canvas: HTMLCanvasElement) => {
    if (canvas.width !== canvas.clientWidth) { canvas.width = canvas.clientWidth; }
    if (canvas.height !== canvas.clientHeight) { canvas.height = canvas.clientHeight; }
};

const initializeContext = (canvasRef: React.RefObject<HTMLCanvasElement>, setContext: (value: CanvasRenderingContext2D) => void) => {
    if (canvasRef.current) {
        const currentContext = canvasRef.current.getContext('2d');
        if (currentContext) { setContext(currentContext); }
    }
};

const addResizeEventListener = (draw: () => void): (() => void) => {
    window.addEventListener("resize", draw);
    return () => window.removeEventListener("resize", draw);
}

interface BaseCanvasProps {
    draw: (fieldCanvas: FieldCanvas) => void;
    id: string;
}

export const BaseCanvas = (props: BaseCanvasProps): JSX.Element => {
    const baseCanvasRef = React.useRef<HTMLCanvasElement>(null);
    const [context, setContext] = React.useState<CanvasRenderingContext2D | null>(null);

    const { draw } = props;
    React.useEffect(() => {
        initializeContext(baseCanvasRef, setContext);

        const baseDraw = () => {
            if (!context) { return; }
            resizeCanvas(context.canvas);
            const fieldCanvas = new FieldCanvas(12 * Units.FEET, 12 * Units.FEET, context);
            draw(fieldCanvas);
        }

        baseDraw();
        return addResizeEventListener(baseDraw);
    }, [context, baseCanvasRef, draw]);

    return (<canvas
        className={"base-canvas"}
        id={props.id}
        ref={baseCanvasRef}
    />);
};

export const BackgroundCanvas = (): JSX.Element => {
    const drawBackground = (fieldCanvas: FieldCanvas) => {
        const context = fieldCanvas.context;
        fieldCanvas.setTransform();
        context.lineWidth = 1 * Units.INCH;
        context.strokeRect(
            0 * Units.METER + context.lineWidth / 2,
            0 * Units.METER + context.lineWidth / 2,
            fieldCanvas.fieldWidth - context.lineWidth,
            fieldCanvas.fieldHeight - context.lineWidth);
    };

    return (<BaseCanvas
        id="background-canvas"
        draw={drawBackground}
    />);
};

/**
 * A canvas defining the robots and the respective manipulators for moving/adjusting them.
 */
export const WaypointCanvas = (): JSX.Element => {
    // const dispatch = useAppDispatch();
    const waypointDictionary = useAppSelector(selectWaypointDictionary);
    const treeWaypoints = useAppSelector(selectAllTreeWaypointIds)
        .map(waypointId => {
            const waypoint = waypointDictionary[waypointId]
            if (!waypoint) { throw Error("Expected valid waypoint in canvas."); }
            return waypoint;
        });
    const selectedWaypointIds = useAppSelector(selectHighlightedWaypointIds);

    const drawWaypoints = (fieldCanvas: FieldCanvas) => {
        const context = fieldCanvas.context;

        treeWaypoints.forEach(waypoint => {
            if (isControlWaypoint(waypoint)) {
                fieldCanvas.setTransform(waypoint.x, waypoint.y, waypoint.robotAngle ?? waypoint.angle);
                context.lineWidth = 0.5 * Units.INCH;
                context.strokeStyle = "black";
                context.strokeRect(
                    -9 * Units.INCH,
                    -9 * Units.INCH,
                    18 * Units.INCH,
                    18 * Units.INCH);

            } else {

            }
        });

        if (selectedWaypointIds.length === 1) {
            const waypoint = waypointDictionary[selectedWaypointIds[0]];
            if (waypoint) {
                if (isControlWaypoint(waypoint)) {
                    fieldCanvas.setTransform(waypoint.x, waypoint.y, waypoint.robotAngle ?? waypoint.angle);
                    Manipulator.add2dMoveManipulator(fieldCanvas.context, 1 / fieldCanvas.PIXEL);
                } else {

                }
            }
        };
    }

    return (<BaseCanvas
        id="waypoint-canvas"
        draw={drawWaypoints}
    />);
};

export const ManipulatorCanvas = (): JSX.Element => {
    // const selectedWaypointIds = useAppSelector(selectHighlightedWaypointIds);

    const drawManipulators = (fieldCanvas: FieldCanvas) => {

    };

    return (<BaseCanvas
        id="manipulator-canvas"
        draw={drawManipulators}
    />);
};