import { KonvaEventObject } from "konva/lib/Node";

/**
 * A class defining basic unit conversions.
 * By default, all lengths should be in meters, and angles in radians.
 * To convert any value to the default value, multiply by the appropriate constant:
 * @example 5 * Units.INCH to represent 5 inches in meters.
 * @example 90 * Units.DEGREE to represent 90 degrees in radians.
 * To convert from meters or radians, divide by the appropriate constant:
 * @example 1 / Units.INCH to convert 1 meter to inches.
 */
export class Units {
    static METER = 1;
    static INCH = 0.0254;
    static MILLIMETER = 0.001;
    static FEET = 0.3048;
    static CENTIMETER = 0.01;

    static RADIAN = 1;
    static DEGREE = Math.PI / 180;
}

export interface Transform {
    x: number;
    y: number;
    scaleX: number;
    scaleY: number;
}

export interface Point {
    x: number;
    y: number;
}

export class PointUtils {
    static Point(x: number, y: number): Point {
        return { x, y };
    }

    static PolarPoint(base: Point, angle: number, magnitude: number): Point {
        return this.add(base, this.Point(Math.cos(angle) * magnitude, Math.sin(angle) * magnitude));
    }

    static KonvaEventPoint(e: KonvaEventObject<MouseEvent>) {
        return this.Point(e.target.x(), e.target.y());
    }

    static add(lhs: Point, rhs: Point): Point {
        return {
            x: lhs.x + rhs.x,
            y: lhs.y + rhs.y
        };
    }

    static sub(lhs: Point, rhs: Point): Point {
        return {
            x: lhs.x - rhs.x,
            y: lhs.y - rhs.y
        };
    }

    static distance(start: Point, end: Point): number {
        return Math.sqrt((start.x - end.x) * (start.x - end.x) + (start.y - end.y) * (start.y - end.y));
    }

    static angle(point: Point): number {
        return Math.atan2(point.y, point.x);
    }



    static flatten(points: Point[]) {
        return points.flatMap(point => [point.x, point.y]);
    }
}

/**
 * Deprecated
 * Defines information and utility functions for working with canvases that represent the field.
 */
export class FieldCanvas {
    private _fieldHeight: number;
    private _fieldWidth: number;
    private _canvasHeight: number;
    private _canvasWidth: number;

    private _PIXEL: number;

    private _fieldTransform: Transform;
    // private _fieldTransform: DOMMatrix;

    constructor(canvasHeight: number, canvasWidth: number, fieldHeight: number, fieldWidth: number) {
        this._fieldHeight = fieldHeight;
        this._fieldWidth = fieldWidth;
        this._canvasHeight = canvasHeight;
        this._canvasWidth = canvasWidth;

        // maps the height to width. If max height is 3, 3 * heightToWidth is the max width.
        const heightToWidth = fieldWidth / fieldHeight;
        const widthToHeight = fieldHeight / fieldWidth;

        const height = Math.min(
            canvasHeight,
            canvasWidth * widthToHeight
        );
        const width = height * heightToWidth;
        this._PIXEL = height / fieldHeight;

        const xShift = (this._canvasWidth - width) / 2;
        const yShift = (this._canvasHeight - height) / 2 + height;
        this._fieldTransform = { x: xShift, y: yShift, scaleX: this.PIXEL, scaleY: -this.PIXEL };
    }

    public get PIXEL(): number { return this._PIXEL; }

    public get fieldHeight(): number { return this._fieldHeight; }
    public get fieldWidth(): number { return this._fieldWidth; }

    public get canvasHeight(): number { return this._canvasHeight; }
    public get canvasWidth(): number { return this._canvasWidth; }

    public get fieldTransform(): Transform { return this._fieldTransform; }

    public fromWorld(point: Point): Point {
        point.x = (point.x - this.fieldTransform.x) / this.fieldTransform.scaleX;
        point.y = (point.y - this.fieldTransform.y) / this.fieldTransform.scaleY;
        return point;
    }
}

/**
 * Deprecated
 */
export class Manipulator {
    public static add2dMoveManipulator(context: CanvasRenderingContext2D,
        scale: number = 1,
        x: number = 0,
        y: number = 0,
        angle: number = 0) {
        context.lineWidth = 2 * scale;
        context.strokeStyle = "white";
        context.shadowColor = "black";
        context.shadowBlur = 2;

        const circleRadius = 9 * scale;
        const arrowLength = circleRadius * 8.25;
        const tipLength = circleRadius * 3.5;
        const tipWidth = circleRadius * 2.5;

        context.beginPath();
        context.arc(x, y, circleRadius, 0, 360 * Units.DEGREE);
        context.stroke();

        context.beginPath();
        context.moveTo(x + circleRadius, y);
        context.lineTo(x + arrowLength, y);
        context.lineTo(x + arrowLength, y + tipWidth / 2);
        context.lineTo(x + arrowLength + tipLength, y);
        context.lineTo(x + arrowLength, y - tipWidth / 2);
        context.lineTo(x + arrowLength, y);
        context.stroke();

        context.beginPath();
        context.moveTo(x, y + circleRadius);
        context.lineTo(x, y + arrowLength);
        context.lineTo(x + tipWidth / 2, y + arrowLength);
        context.lineTo(x, y + arrowLength + tipLength);
        context.lineTo(x - tipWidth / 2, y + arrowLength);
        context.lineTo(x, y + arrowLength);
        context.stroke();

        const squareOffset = circleRadius * 2.4375;
        const squareWidth = circleRadius * 3;
        context.strokeRect(x + squareOffset, y + squareOffset, squareWidth, squareWidth);

        context.beginPath();
        context.arc(x + arrowLength + tipLength + circleRadius * 1.3125, y, circleRadius, 0, 360 * Units.DEGREE);
        context.stroke();

        context.beginPath();
        context.arc(x, y,
            arrowLength + tipLength + circleRadius * 1.3125,
            -12.5 * Units.DEGREE, -4.39 * Units.DEGREE);
        context.stroke();

        context.beginPath();
        context.arc(x, y,
            arrowLength + tipLength + circleRadius * 1.3125,
            4.39 * Units.DEGREE, 12.5 * Units.DEGREE);
        context.stroke();
    }
}