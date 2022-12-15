import React, { useCallback, useContext, useEffect, useState } from "react";

import { KonvaEventObject } from "konva/lib/Node";
import { Layer, Rect, Stage } from "react-konva";

import { Colors } from "@blueprintjs/core/lib/esm/common";

import { Provider, ReactReduxContext } from "react-redux";
import { useAppDispatch } from "../Store/hooks";
import { Store } from "../Store/store";

import { FieldDimensions, selectFieldDimensions } from "./fieldSlice";
import { Transform, INCH } from "./mathUtils";
import { allItemsDeselected } from "../Tree/tempUiSlice";
import { FieldElements } from "./FieldElements";
import { ContextMenuHandler, ContextMenuHandlerContext, getKonvaContextMenuHandler } from "./AppContextMenu";
import { OutsideFieldContextMenu, OnFieldContextMenu } from "../Tree/ContextMenu";

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
                {({ store }) =>
                    <ContextMenuHandlerContext.Consumer>
                        {(value) =>
                            <FieldStage store={store as Store} contextMenuHandler={value} />
                        }
                    </ContextMenuHandlerContext.Consumer>
                }
            </ReactReduxContext.Consumer>
        </div>
    );
}

interface FieldStageProps {
    store: Store;
    contextMenuHandler: ContextMenuHandler
}

function FieldStage(props: FieldStageProps): JSX.Element {
    const dispatch = useAppDispatch();
    const [canvasWidth, setCanvasWidth] = useState<number>(0);
    const [canvasHeight, setCanvasHeight] = useState<number>(0);

    const resizeCanvas = useCallback(() => {
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

    useEffect(() => {
        resizeCanvas();
        window.addEventListener("resize", resizeCanvas);
        return () => window.removeEventListener("resize", resizeCanvas);
    }, [resizeCanvas]);

    const fieldDimensions = selectFieldDimensions(props.store.getState());
    const fieldTransform = computeFieldTransform(canvasHeight, canvasWidth, fieldDimensions);

    return (
        <Stage
            width={canvasWidth}
            height={canvasHeight}
            onClick={(e: KonvaEventObject<MouseEvent>) => {
                if (!e.cancelBubble) { dispatch(allItemsDeselected()); }
            }}
            onContextMenu={
                (e: KonvaEventObject<MouseEvent>) => {
                    if (e.currentTarget === e.target) {
                        props.contextMenuHandler(<OutsideFieldContextMenu />, e.evt);
                    }
                }}
        >
            <Provider store={props.store}>
                <ContextMenuHandlerContext.Provider value={props.contextMenuHandler}>
                    <FieldLayer
                        fieldTransform={fieldTransform}
                        fieldDimensions={fieldDimensions}
                    />
                    <ElementLayer fieldTransform={fieldTransform} />
                </ContextMenuHandlerContext.Provider>
            </Provider>
        </Stage>
    );
}

function computeFieldTransform(canvasHeight: number, canvasWidth: number, fieldDimensions: FieldDimensions): Transform {
    const heightToWidth = fieldDimensions.width / fieldDimensions.height;
    const widthToHeight = fieldDimensions.height / fieldDimensions.width;

    const height = Math.min(canvasHeight, canvasWidth * widthToHeight);
    const width = height * heightToWidth;
    const PIXEL = height / fieldDimensions.height;

    const xShift = (canvasWidth - width) / 2;
    const yShift = (canvasHeight - height) / 2 + height;
    return { x: xShift, y: yShift, scaleX: PIXEL, scaleY: -PIXEL };
}

interface FieldTransformProps {
    fieldTransform: Transform;
}

interface FieldLayerProps {
    fieldDimensions: FieldDimensions;
}

function FieldLayer(props: FieldLayerProps & FieldTransformProps): JSX.Element {
    const konvaContextMenuHandler = getKonvaContextMenuHandler(useContext(ContextMenuHandlerContext));
    return (<Layer
        {...props.fieldTransform}
        onContextMenu={konvaContextMenuHandler(<OnFieldContextMenu />)}
    >
        <Rect
            x={0.5 * INCH}
            y={0.5 * INCH}
            width={props.fieldDimensions.width - 1 * INCH}
            height={props.fieldDimensions.height - 1 * INCH}
            strokeWidth={1 * INCH}
            stroke={Colors.BLACK}
            fill={Colors.GRAY1}
        />
    </Layer>);
}

function ElementLayer(props: FieldTransformProps): JSX.Element {
    return (<Layer
        {...props.fieldTransform}
        onClick={(e: KonvaEventObject<MouseEvent>) => { e.cancelBubble = true; }}
    >
        <FieldElements />
    </Layer>)
}