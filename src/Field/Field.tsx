import React from "react";

import { KonvaEventObject } from "konva/lib/Node";
import { Layer, Rect, Stage } from "react-konva";

import { Colors } from "@blueprintjs/core/lib/esm/common";
import { ContextMenu2, MenuItem2 } from "@blueprintjs/popover2";
import { Menu } from "@blueprintjs/core";

import { Provider, ReactReduxContext } from "react-redux";
import { useAppDispatch } from "../Store/hooks";
import { Store } from "../Store/store";

import { FieldDimensions, selectFieldDimensions } from "./fieldSlice";
import { Transform, Units } from "./mathUtils";
import { allItemsDeselected } from "../Tree/tempUiSlice";
import { wrapContextMenu } from "../Tree/TreeContextMenu";
import { FieldElements } from "./FieldElements";

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
export const ContextMenuHandlerContext = React.createContext<ContextMenuHandler>(() => () => { });

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
        <FieldElements />
    </Layer>)
}