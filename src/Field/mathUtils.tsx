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

/**
 * Defines information and utility functions for working with canvases that represent the field.
 */
export class FieldCanvas {
    private _fieldHeight: number;
    private _fieldWidth: number;
    private _canvasHeight: number;
    private _canvasWidth: number;
    private _PIXEL: number;

    private _fieldTransform: DOMMatrix;

    constructor(canvasHeight: number, canvasWidth: number, fieldHeight: number, fieldWidth: number) {
        this._fieldHeight = fieldHeight;
        this._fieldWidth = fieldWidth;
        this._canvasHeight = canvasHeight;
        this._canvasWidth = canvasWidth;

        // maps the height to width. If max height is 3, 3 * heightToWidth is the max width.
        const heightToWidth = fieldWidth / fieldHeight;
        const widthToHeight = fieldHeight / fieldWidth;

        const height = Math.min(
            canvasWidth * widthToHeight,
            canvasHeight
        );
        const width = canvasHeight * heightToWidth;

        this._PIXEL = height / fieldHeight;

        this._fieldTransform = new DOMMatrix();
        this.updateFieldTransform(height, width);
    }

    public get PIXEL(): number { return this._PIXEL; }

    public get fieldHeight(): number { return this._fieldHeight; }
    public get fieldWidth(): number { return this._fieldWidth; }

    public get canvasHeight(): number { return this._canvasHeight; }
    public get canvasWidth(): number { return this._canvasWidth; }

    public getX(x: number = 0) {
        
    }

    public toField(x: number = 0, y: number = 0, angle: number = 0) {

    }

    private updateFieldTransform(height: number, width: number) {
        const xShift = (this._canvasWidth - width) / 2;
        const yShift = (this._canvasHeight - height) / 2 + height;
        this._fieldTransform.translateSelf(xShift, yShift);
        // flip y axis
        this._fieldTransform.scaleSelf(this.PIXEL, -this.PIXEL);

        // current robot coord transforms
        // const xShift = (context.canvas.clientWidth - this.width) / 2;
        // const yShift = (context.canvas.clientHeight - this.height) / 2;
        // this._toFieldCanvas.translateSelf(xShift, yShift);
        // this._toFieldCanvas.rotateSelf(0, 0, 90);
        // // flip y axis
        // this._toFieldCanvas.scaleSelf(this.PIXEL, -this.PIXEL);
        // this._toFieldCanvas.translateSelf(this._fieldHeight / 2, 0);
    }

    /**
     * Sets the current transform of the field equal to the transform
     * specified by `fieldTransform` plus the specified offsets. 
     * Offsets are relative to the robot coord system.
     * @param x {number} - The x offset.
     * @param y {number} - The y offset.
     * @param angle {number} - The angle in radians to rotate by.
     */
    public applyTransform(x: number = 0, y: number = 0, angle: number = 0) {
        // const transformCopy = new DOMMatrix(this._fieldTransform.toString());
        // transformCopy.translateSelf(x, y);
        // transformCopy.rotateSelf(0, 0, angle / Units.DEGREE);
        // this.context.setTransform(transformCopy);
    }
}

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