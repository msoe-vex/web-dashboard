import { KonvaEventObject } from "konva/lib/Node";
import { ControlWaypoint } from "../Tree/waypointsSlice";

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

    static KonvaEventPoint(e: KonvaEventObject<MouseEvent>): Point {
        return this.Point(e.target.x(), e.target.y());
    }

    static add(...point: Point[]): Point {
        let x = 0, y = 0;
        point.forEach(point => {
            x += point.x;
            y += point.y;
        });
        return { x, y };
    }

    static subtract(lhs: Point, rhs: Point): Point {
        return {
            x: lhs.x - rhs.x,
            y: lhs.y - rhs.y
        };
    }

    static multiply(point: Point, val: number): Point {
        return {
            x: point.x * val,
            y: point.y * val
        };
    }

    static distance(start: Point, end: Point): number {
        return Math.sqrt((start.x - end.x) * (start.x - end.x) + (start.y - end.y) * (start.y - end.y));
    }

    static angle(point: Point): number {
        return Math.atan2(point.y, point.x);
    }

    static normalize(point: Point): Point {
        const distance = this.distance(point, this.Point(0, 0));
        return this.Point(point.x / distance, point.y / distance);
    }

    static flatten(...points: Point[]): number[] {
        return points.flatMap(point => [point.x, point.y]);
    }
}

export class Curve {
    startPoint: Point;
    startControlPoint: Point;
    endPoint: Point;
    endControlPoint: Point;

    constructor(startWaypoint: ControlWaypoint, endWaypoint: ControlWaypoint) {
        this.startPoint = startWaypoint.point;
        this.startControlPoint = PointUtils.PolarPoint(this.startPoint, startWaypoint.angle, startWaypoint.startMagnitude);
        this.endPoint = endWaypoint.point;
        this.endControlPoint = PointUtils.PolarPoint(this.endPoint, endWaypoint.angle, -endWaypoint.endMagnitude);
    }

    point(parameter: number): Point {
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

    firstDerivative(parameter: number): Point {
        const firstTerm = 3 * (1 - parameter) * (1 - parameter);
        const secondTerm = 6 * (1 - parameter) * parameter;
        const thirdTerm = 3 * parameter * parameter;
        return PointUtils.add(
            PointUtils.multiply(PointUtils.subtract(this.startControlPoint, this.startPoint), firstTerm),
            PointUtils.multiply(PointUtils.subtract(this.endControlPoint, this.startControlPoint), secondTerm),
            PointUtils.multiply(PointUtils.subtract(this.endPoint, this.endControlPoint), thirdTerm)
        );
    }

    normalPoint(parameter: number, distance: number): Point {
        let direction = PointUtils.normalize(this.firstDerivative(parameter));
        let normalPoint = PointUtils.Point(-direction.y, direction.x);
        return PointUtils.multiply(normalPoint, distance);
    }

    // normalFirstDerivative(parameter: number): Point {
    //     let point = this.firstDerivative(parameter);
    //     let normalPoint = PointUtils.Point(-point.y, point.x);
    //     return PointUtils.add(this.point(parameter), normalPoint);
    // }

    secondDerivative(parameter: number): Point {
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

    curvature(parameter: number): number {
        const firstDerivative = this.firstDerivative(parameter);
        const secondDerivative = this.secondDerivative(parameter);
        const numerator = firstDerivative.x * secondDerivative.y - secondDerivative.x * firstDerivative.y;
        const denominator = Math.pow((firstDerivative.x * firstDerivative.x + firstDerivative.y * firstDerivative.y), 3 / 2);
        if (denominator === 0) { return 0; }
        return numerator / denominator;
    }

    curvaturePoint(parameter: number): Point {
        return PointUtils.add(this.point(parameter), this.normalPoint(parameter, -this.curvature(parameter)));
    }
}

export class CurveUtils {
    static parameterRange(count: number): number[] {
        let result = [];
        for (var i = 0; i < count; ++i) {
            result.push(i / (count - 1));
        }
        return result;
    }
}