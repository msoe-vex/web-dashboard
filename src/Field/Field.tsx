import React from "react";

// import { useAppSelector } from "../Store/hooks";
// import { selectAllTreeWaypointIds } from "../Tree/treeActions";
// import { selectHighlightedWaypointIds } from "../Tree/uiSlice";
// import { isControlWaypoint, selectWaypointDictionary } from "../Tree/waypointsSlice";
// import { FieldCanvas, Units } from "./mathUtils";

import { Layer, Rect, Stage } from "react-konva";
import { FieldCanvas, Units } from "./mathUtils";

// const app = new Application({
//     backgroundColor: 0x000000,
//     width: 800,
//     height: 1000,
//     resizeTo: document.getElementById("field") ?? undefined
// });

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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    React.useEffect(() => {
        resizeCanvas();
        window.addEventListener("resize", resizeCanvas);
        return () => window.removeEventListener("resize", resizeCanvas);
    }, [resizeCanvas]);

    const fieldCanvas = new FieldCanvas(height, width, 12 * Units.FEET, 12 * Units.FEET);

    return (<div id="field">
        <Stage width={width} height={height}>
            <Layer>
                <Rect width={width - 5} height={height - 5} fill="red" />
            </Layer>
        </Stage >
    </div >);
};

interface FieldLayerProps {
    children: JSX.Element;
}

function FieldLayer(props: FieldLayerProps): JSX.Element {
    return (<Layer

    />);
};

const computeFieldTransform = () => {
    
}


// const initializeContext = (canvasRef: React.RefObject<HTMLCanvasElement>, setContext: (value: CanvasRenderingContext2D) => void) => {
//     if (canvasRef.current) {
//         const currentContext = canvasRef.current.getContext('2d');
//         if (currentContext) { setContext(currentContext); }
//     }
// };

// const addResizeEventListener = (draw: () => void): (() => void) => {
//     window.addEventListener("resize", draw);
//     return () => window.removeEventListener("resize", draw);
// }

// interface BaseCanvasProps {
//     draw: (fieldCanvas: FieldCanvas) => void;
//     id: string;
// }

// export const BaseCanvas = (props: BaseCanvasProps): JSX.Element => {
//     const baseCanvasRef = React.useRef<HTMLCanvasElement>(null);
//     const [context, setContext] = React.useState<CanvasRenderingContext2D | null>(null);

//     const { draw } = props;
//     React.useEffect(() => {
//         initializeContext(baseCanvasRef, setContext);

//         const baseDraw = () => {
//             if (!context) { return; }
//             resizeCanvas(context.canvas);
//             const fieldCanvas = new FieldCanvas(12 * Units.FEET, 12 * Units.FEET, context);
//             draw(fieldCanvas);
//         }

//         baseDraw();
//         return addResizeEventListener(baseDraw);
//     }, [context, baseCanvasRef, draw]);

//     return (<canvas
//         className={"base-canvas"}
//         id={props.id}
//         ref={baseCanvasRef}
//     />);
// };