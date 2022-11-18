import { KonvaEventObject } from "konva/lib/Node";
import { ControlWaypoint } from "../Tree/waypointsSlice";

import { sortedIndex } from "lodash-es";

/**
 * Constants defining basic unit conversions.
 * By default, all lengths should be in meters, and angles in radians.
 * To convert any value to the default value, multiply by the appropriate constant:
 * @example 5 * INCH to represent 5 inches in meters.
 * @example 90 * DEGREE to represent 90 degrees in radians.
 * To convert from meters or radians, divide by the appropriate constant:
 * @example 1 / INCH to convert 1 meter to inches.
 */
export const METER = 1;
export const INCH = 0.0254;
export const MILLIMETER = 0.001;
export const FEET = 0.3048;
export const CENTIMETER = 0.01;

export const RADIAN = 1;
export const DEGREE = Math.PI / 180;

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

export function makePoint(x: number, y: number): Point {
    return { x, y };
}
export function makeZeroPoint(): Point {
    return makePoint(0, 0);
}

/**
 * Constructs a point from a polar specification.
 */
export function makePolarPoint(basePoint: Point, angle: number, radius: number): Point {
    return add(basePoint, makePoint(Math.cos(angle) * radius, Math.sin(angle) * radius));
}

/**
 * Constructs a point from a Konva event.
 */
export function makeKonvaEventPoint(e: KonvaEventObject<MouseEvent>): Point {
    return makePoint(e.target.x(), e.target.y());
}

export function add(...points: Point[]): Point {
    return points.reduce((result, point) => {
        result.x += point.x;
        result.y += point.y;
        return result;
    }, { x: 0, y: 0 })
}

export function subtract(lhs: Point, rhs: Point): Point {
    return makePoint(lhs.x - rhs.x, lhs.y - rhs.y);
}


export function multiply(input: Point, val: number): Point {
    return makePoint(input.x * val, input.y * val);
}

export function divide(input: Point, val: number): Point {
    return makePoint(input.x / val, input.y / val);
}

export function distance(start: Point, end: Point): number {
    return Math.sqrt((start.x - end.x) * (start.x - end.x) + (start.y - end.y) * (start.y - end.y));
}

export function angle(point: Point): number {
    return Math.atan2(point.y, point.x);
}

export function normalize(point: Point): Point {
    const length = distance(point, makeZeroPoint());
    return makePoint(point.x / length, point.y / length);
}

export function flatten(...points: Point[]): number[] {
    return points.flatMap(point => [point.x, point.y]);
}

export function makeCurve(startWaypoint: ControlWaypoint, endWaypoint: ControlWaypoint): Curve {
    const startPoint = startWaypoint.point;
    const endPoint = endWaypoint.point;
    const startControlPoint = makePolarPoint(startPoint, startWaypoint.angle, startWaypoint.startMagnitude);
    const endControlPoint = makePolarPoint(endPoint, endWaypoint.angle, endWaypoint.startMagnitude);
    return new Curve(startPoint, startControlPoint, endPoint, endControlPoint);
}

/**
 * @returns `count` parameters evenly spaced in the range [0, 1].
 */
export function parameterRange(count: number): number[] {
    return Array.from<number>({ length: count }).map((_val, i) => i / (count - 1));
}

export class Curve {
    public constructor(
        public readonly startPoint: Point,
        public readonly startControlPoint: Point,
        public readonly endPoint: Point,
        public readonly endControlPoint: Point
    ) { }

    public arcLength(): number {
        const points = parameterRange(ParameterizedCurve.DIVISIONS).map(parameter => this.point(parameter));
        // array containing distance between each successive point
        return points.reduce((curr, point, i, points) => {
            if (i === 0) { return 0; }
            return curr + distance(point, points[i - 1]);
        }, 0);

    }

    /**
     * @returns a point on the curve at the specified parameter.
     */
    public point(parameter: number): Point {
        const startTerm = Math.pow(1 - parameter, 3);
        const startControlTerm = 3 * (1 - parameter) * (1 - parameter) * parameter;
        const endControlTerm = 3 * (1 - parameter) * parameter * parameter;
        const endTerm = Math.pow(parameter, 3);
        return add(
            multiply(this.startPoint, startTerm),
            multiply(this.startControlPoint, startControlTerm),
            multiply(this.endControlPoint, endControlTerm),
            multiply(this.endPoint, endTerm)
        );
    }

    public firstDerivative(parameter: number): Point {
        const firstTerm = 3 * (1 - parameter) * (1 - parameter);
        const secondTerm = 6 * (1 - parameter) * parameter;
        const thirdTerm = 3 * parameter * parameter;
        return add(
            multiply(subtract(this.startControlPoint, this.startPoint), firstTerm),
            multiply(subtract(this.endControlPoint, this.startControlPoint), secondTerm),
            multiply(subtract(this.endPoint, this.endControlPoint), thirdTerm)
        );
    }

    public secondDerivative(parameter: number): Point {
        const firstPoint = add(
            subtract(this.endControlPoint, multiply(this.startControlPoint, 2)),
            this.startPoint);
        const secondPoint = add(
            subtract(this.endPoint, multiply(this.endControlPoint, 2)),
            this.startControlPoint);
        return add(
            multiply(firstPoint, 6 * (1 - parameter)),
            multiply(secondPoint, 6 * parameter)
        );
    }

    public curvature(parameter: number): number {
        const firstDerivative = this.firstDerivative(parameter);
        const secondDerivative = this.secondDerivative(parameter);
        const numerator = firstDerivative.x * secondDerivative.y - secondDerivative.x * firstDerivative.y;
        const denominator = Math.pow((firstDerivative.x * firstDerivative.x +
            firstDerivative.y * firstDerivative.y), 3 / 2);
        if (denominator === 0) { return 0; }
        return numerator / denominator;
    }

    /**
     * @returns a `Point` representing the curvature at a point specified by a given parameter.
     */
    public curvaturePoint(parameter: number): Point {
        return add(this.point(parameter), this.normalPoint(parameter, -this.curvature(parameter)));
    }

    private normalPoint(parameter: number, distance: number): Point {
        let direction = normalize(this.firstDerivative(parameter));
        let normalPoint = makePoint(-direction.y, direction.x);
        return multiply(normalPoint, distance);
    }

    protected static DIVISIONS = 100;


}

/**
 * An extension of Curve which adds arc length and angular information.
 */
export class ParameterizedCurve extends Curve {
    public constructor(
        curve: Curve,
        protected readonly startRobotAngle: number,
        protected readonly endRobotAngle: number
    ) {
        super(curve.startPoint, curve.startControlPoint, curve.endPoint, curve.endControlPoint);

        const props = this.computeArcLengthProperties();
        this.totalArcLength = props.arcLength;
        this.arcLengths = props.arcLengths;
    }

    private computeArcLengthProperties(): { arcLength: number, arcLengths: number[] } {
        const points = parameterRange(Curve.DIVISIONS).map(parameter => this.point(parameter));
        // array containing distance between each successive point
        let arcLength = 0;
        const arcLengths = points.map((point, i, points) => {
            if (i === 0) { return 0; }
            arcLength += distance(point, points[i - 1]);
            return arcLength;
        });

        return {
            arcLength,
            arcLengths
        };
    }

    /**
     * @returns a parameter corresponding to points on the curve with an even distribution.
     * Uses arc-length parameterization, so 0.5 is the middle of the curve.
     */
    public arcLengthParameter(parameter: number): number {
        const targetArcLength = parameter * this.totalArcLength;
        const index = sortedIndex(this.arcLengths, targetArcLength);
        if (this.arcLengths[index] === targetArcLength) {
            return index / (Curve.DIVISIONS - 1);
        }
        else {
            const segmentFraction = (targetArcLength - this.arcLengths[index - 1])
                / this.arcLengths[index];
            return (index + segmentFraction) / (Curve.DIVISIONS - 1);
        }
    }

    /**
     * @returns the angle of the robot at the specified point.
     */
    public angle(parameter: number): number {
        let angleDifference = this.shortestRotationTo(this.startRobotAngle, this.endRobotAngle);
        return this.startRobotAngle + (parameter * angleDifference);
    }

    private shortestRotationTo(target: number, current: number): number {
        let counterClockwiseMove = current - target;
        let clockwiseMove = target - current;
        // normalize to positive range
        clockwiseMove += (clockwiseMove < 0 ? 360 : 0) * DEGREE;
        counterClockwiseMove += (counterClockwiseMove < 0 ? 360 : 0) * DEGREE;
        return (clockwiseMove < counterClockwiseMove ? -clockwiseMove : counterClockwiseMove);
    }

    /**
     * A list of arc lengths taken in context of the total arc length.
     */
    private arcLengths: number[];
    private totalArcLength: number;
}