import { Dictionary, EntityId } from "@reduxjs/toolkit";
import { number } from "prop-types";
import React from "react";

// import { useAppSelector } from "../Store/hooks";
// import { selectAllTreeWaypointIds } from "../Tree/treeActions";
// import { selectHighlightedWaypointIds } from "../Tree/uiSlice";
// import { isControlWaypoint, selectWaypointDictionary } from "../Tree/waypointsSlice";
// import { FieldCanvas, Units } from "./mathUtils";

import { Layer, Rect, Stage } from "react-konva";
import { Routine } from "../Navbar/routinesSlice";
import { useAppSelector } from "../Store/hooks";
import { RootState } from "../Store/store";
import { Path, selectPathById } from "../Tree/pathsSlice";
import { selectActiveRoutine } from "../Tree/uiSlice";
import { isControlWaypoint, selectWaypointDictionary, Waypoint } from "../Tree/waypointsSlice";
import { selectFieldHeight, selectFieldWidth } from "./fieldSlice";
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

    const robotElements = getRobotElements(paths, waypointDict);

    return (<div id="field" >
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
                {robotElements}
            </Layer>
        </Stage>
    </div >);
};

const getRobotElements = (paths: Path[], waypointDict: Dictionary<Waypoint>): JSX.Element[] => {
    return paths.flatMap(path => {
        return path.waypointIds.map(waypointId => {
            const waypoint = waypointDict[waypointId];
            if (!waypoint) { throw Error("Field expected valid waypoint."); }

            if (isControlWaypoint(waypoint)) {
                return (<Rect
                    x={waypoint.x}
                    y={waypoint.y}
                    rotation={waypoint.robotAngle ? waypoint.robotAngle / Units.RADIAN : 0}
                    strokeWidth={0.25 * Units.INCH}
                    stroke="black"
                    draggable={true}
                />);
            }
            else {
                return (<Rect />);
            }
        });
    });
};