import { Point } from "./Spline";

export const hypot = (x1: number, y1: number, x2: number, y2: number) => {
	return Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));
}

/**
 * This function converts an angle in radians to degrees
 * @param radians Angle to convert in radians
 * @returns The angle in degrees
 */
export const toDegrees = (radians: number) => {
	return radians * (180 / Math.PI);
}

/**
 * This function converts an angle in degrees to radians
 * @param degrees Angle to convert in degrees
 * @returns The angle in radians
 */
export const toRadians = (degrees: number) => {
	return degrees * (Math.PI / 180);
}

/**
 * Calculate the curvature between three points.
 * Borrowed from https://www.chiefdelphi.com/uploads/default/original/3X/b/e/be0e06de00e07db66f97686505c3f4dde2e332dc.pdf
 * @param point1 First point on the curve
 * @param point2 Midpoint of the curve
 * @param point3 Last point on the curve
 * @returns Curvature of the path as a float
 */
export const calculateCurvature = (point1: Point, point2: Point, point3: Point) => {
	if (point1.x === point2.x) {
		point1.x += 0.000001;
	}

	let k1 = 0.5 * (point1.x**2 + point1.y**2 - point2.x**2 - point2.y**2) / (point1.x - point2.x);
	let k2 = (point1.y - point2.y) / (point1.x - point2.x);
	let b = 0.5 * (point2.x**2 - 2 * point2.x * k1 + point2.y**2 - point3.x**2 + 2 * point3.x * k1 - point3.y**2)
					/ (point3.x * k2 - point3.y + point2.y - point2.x * k2);
	let a = k1 - k2 * b;
	let r = Math.sqrt((point1.x - a)**2 + (point1.y - b)**2);
	return 1 / r;
}

/**
 * This function calculates the shortest angle between two positions, in degrees
 * @param target First angle position in degrees
 * @param current Second angle position in degrees
 * @returns Shortest angle between the two angles provided
 */
export const shortestRotationTo = (target: number, current: number) => {
	let counterClockwiseMove = current - target;
	let clockwiseMove = target - current;
	clockwiseMove += (clockwiseMove < 0 ? 360 : 0);
	counterClockwiseMove += (counterClockwiseMove < 0 ? 360 : 0);
	return (Math.abs(clockwiseMove) < Math.abs(counterClockwiseMove) ? clockwiseMove : -counterClockwiseMove);
}