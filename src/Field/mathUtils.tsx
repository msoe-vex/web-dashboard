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

    static subtract(lhs: Point, rhs: Point): Point {
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