import { KonvaEventObject } from "konva/lib/Node";
import { ControlWaypoint } from "../Tree/waypointsSlice";

import { sortedIndex } from "lodash-es";

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
    public static Point(x: number, y: number): Point {
        return { x, y };
    }

    public static PolarPoint(base: Point, angle: number, magnitude: number): Point {
        return this.add(base, this.Point(Math.cos(angle) * magnitude, Math.sin(angle) * magnitude));
    }

    public static KonvaEventPoint(e: KonvaEventObject<MouseEvent>): Point {
        return this.Point(e.target.x(), e.target.y());
    }

    public static add(...point: Point[]): Point {
        let x = 0, y = 0;
        point.forEach(point => {
            x += point.x;
            y += point.y;
        });
        return { x, y };
    }

    public static subtract(lhs: Point, rhs: Point): Point {
        return {
            x: lhs.x - rhs.x,
            y: lhs.y - rhs.y
        };
    }

    public static multiply(point: Point, val: number): Point {
        return {
            x: point.x * val,
            y: point.y * val
        };
    }

    public static distance(start: Point, end: Point): number {
        return Math.sqrt((start.x - end.x) * (start.x - end.x) + (start.y - end.y) * (start.y - end.y));
    }

    public static angle(point: Point): number {
        return Math.atan2(point.y, point.x);
    }

    public static normalize(point: Point): Point {
        const distance = this.distance(point, this.Point(0, 0));
        return this.Point(point.x / distance, point.y / distance);
    }

    public static flatten(...points: Point[]): number[] {
        return points.flatMap(point => [point.x, point.y]);
    }
}

export class Curve {
    public constructor(startWaypoint: ControlWaypoint, endWaypoint: ControlWaypoint) {
        this.startPoint = startWaypoint.point;
        this.startControlPoint = PointUtils.PolarPoint(this.startPoint, startWaypoint.angle, startWaypoint.startMagnitude);
        this.endPoint = endWaypoint.point;
        this.endControlPoint = PointUtils.PolarPoint(this.endPoint, endWaypoint.angle, -endWaypoint.endMagnitude);
    }

    public arcLength(): number {
        const points = Curve.parameterRange(ParameterizedCurve.DIVISIONS).map(parameter => this.point(parameter));
        // array containing distance between each successive point
        return points.reduce((curr, point, i, points) => {
            if (i === 0) { return 0; }
            return curr + PointUtils.distance(point, points[i - 1]);
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
        return PointUtils.add(
            PointUtils.multiply(this.startPoint, startTerm),
            PointUtils.multiply(this.startControlPoint, startControlTerm),
            PointUtils.multiply(this.endControlPoint, endControlTerm),
            PointUtils.multiply(this.endPoint, endTerm)
        );
    }

    /**
     * @returns the angle of the robot at the specified point.
     */
    public rotation(parameter: number, startRobotAngle: number, endRobotAngle: number): number {
        let angleDifference = this.shortestRotationTo(startRobotAngle, endRobotAngle);
        return startRobotAngle + (parameter * angleDifference);
    }

    private shortestRotationTo(target: number, current: number): number {
        let counterClockwiseMove = current - target;
        let clockwiseMove = target - current;
        // normalize to positive range
        clockwiseMove += (clockwiseMove < 0 ? 360 : 0) * Units.DEGREE;
        counterClockwiseMove += (counterClockwiseMove < 0 ? 360 : 0) * Units.DEGREE;
        return (clockwiseMove < counterClockwiseMove ? -clockwiseMove : counterClockwiseMove);
    }

    public firstDerivative(parameter: number): Point {
        const firstTerm = 3 * (1 - parameter) * (1 - parameter);
        const secondTerm = 6 * (1 - parameter) * parameter;
        const thirdTerm = 3 * parameter * parameter;
        return PointUtils.add(
            PointUtils.multiply(PointUtils.subtract(this.startControlPoint, this.startPoint), firstTerm),
            PointUtils.multiply(PointUtils.subtract(this.endControlPoint, this.startControlPoint), secondTerm),
            PointUtils.multiply(PointUtils.subtract(this.endPoint, this.endControlPoint), thirdTerm)
        );
    }

    public secondDerivative(parameter: number): Point {
        const firstPoint = PointUtils.add(
            PointUtils.subtract(this.endControlPoint, PointUtils.multiply(this.startControlPoint, 2)),
            this.startPoint);
        const secondPoint = PointUtils.add(
            PointUtils.subtract(this.endPoint, PointUtils.multiply(this.endControlPoint, 2)),
            this.startControlPoint);
        return PointUtils.add(
            PointUtils.multiply(firstPoint, 6 * (1 - parameter)),
            PointUtils.multiply(secondPoint, 6 * parameter)
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
        return PointUtils.add(this.point(parameter), this.normalPoint(parameter, -this.curvature(parameter)));
    }

    private normalPoint(parameter: number, distance: number): Point {
        let direction = PointUtils.normalize(this.firstDerivative(parameter));
        let normalPoint = PointUtils.Point(-direction.y, direction.x);
        return PointUtils.multiply(normalPoint, distance);
    }

    private startPoint: Point;
    private startControlPoint: Point;
    private endPoint: Point;
    private endControlPoint: Point;

    protected static DIVISIONS = 100;

    /**
     * @returns `count` parameters evenly spaced between 0 and 1.
     */
    public static parameterRange(count: number): number[] {
        let result = [];
        for (var i = 0; i < count; ++i) { result.push(i / (count - 1)); }
        return result;
    }

}

/**
 * An extension of Curve which adds arc length
 * and rapid arc-length lookups.
 */
export class ParameterizedCurve extends Curve {
    public constructor(startWaypoint: ControlWaypoint, endWaypoint: ControlWaypoint) {
        super(startWaypoint, endWaypoint);

        const props = this.computeArcLengthProperties();
        this.totalArcLength = props.arcLength;
        this.arcLengths = props.arcLengths;
    }

    private computeArcLengthProperties(): { arcLength: number, arcLengths: number[] } {
        const points = Curve.parameterRange(Curve.DIVISIONS).map(parameter => this.point(parameter));
        // array containing distance between each successive point
        let arcLength = 0;
        const arcLengths = points.map((point, i, points) => {
            if (i === 0) { return 0; }
            arcLength += PointUtils.distance(point, points[i - 1]);
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
     * A list of arc lengths taken in context of the total arc length.
     */
    private arcLengths: number[];
    private totalArcLength: number;
}