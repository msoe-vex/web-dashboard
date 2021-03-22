import { Waypoint } from "./Waypoint";
import { toRadians } from "./Math.js";

/*
 * Represents a location of the robot on the field
 * Contains the coordinates (x, y) and the speed of the robot
 */
export class Point { 
	x: number;
	y: number;
	speed: number;
	time: number;
	theta: number;
	omega: number;

	constructor(x: number, y: number, speed?: number) {
		this.x = x;
		this.y = y;
		this.speed = speed;
		this.time = 0;
		this.theta = 0;
		this.omega = 0;
	}
		

	toJSON () {
		return {
			x: this.x === undefined ? 0 : Number.parseFloat(this.x.toFixed(2)),
			y: this.y === undefined ? 0 : Number.parseFloat(this.y.toFixed(2)),
			speed: this.speed === undefined ? 0 : Number.parseFloat(this.speed.toFixed(2)),
			time: this.time === undefined ? 0 : Number.parseFloat(this.time.toFixed(2)),
			theta: this.theta === undefined ? 0 : Number.parseFloat(this.theta.toFixed(2)),
			omega: this.omega === undefined ? 0 : Number.parseFloat(this.omega.toFixed(2))
		}
	}
}
/*
 * Function takes two waypoints and returns generated points in a spline between the two given waypoints
 */
export class Spline {
	w1: Waypoint;
	w2: Waypoint;
	startAngle: number;
	endAngle: number;
	knot: number;

	constructor(w1, w2) {
		this.w1 = w1;
		this.w2 = w2;
		this.startAngle = w1.spline_angle;
		this.endAngle = w2.spline_angle;
	}

	/**
	 * Calculate the distance between two waypoints
	 * @returns Distance between two waypoints
	 */
	getKnot() {
		return Math.sqrt((this.w2.x - this.w1.x) * (this.w2.x - this.w1.x) + (this.w2.y - this.w1.y) * (this.w2.y - this.w1.y));
	}

	/**
	 * Calculates the angle between the starting and ending waypoints in radians. This is not related to the robot's orientation.
	 * @returns The angle between the starting and ending waypoints, in radians
	 */
	getAngleOff() {
		return Math.atan2(this.w2.y - this.w1.y, this.w2.x - this.w1.x);
	}

	/**
	 * This function gets the relationship between startAngle and angleOff
	 * @param spline Spline to calculate from
	 * @returns Relatopship between startAngle and angleOff
	 */
	getA0(spline: Spline) {
		let a0 = -toRadians(spline.startAngle + 90) - spline.angleOff;
		while (a0 > Math.PI * 2) {
			a0 -= Math.PI * 2;
		}
		a0 = Math.tan(a0);
		return a0;
	};

		// represents relationship between endAngle and the angleOff
		let getA1 = function (spline) {
			let a1 = -toRadians(spline.endAngle + 90) - spline.angleOff;
			while (a1 > Math.PI * 2) {
				a1 -= Math.PI * 2;
			}
			a1 = Math.tan(a1);
			return a1;
		};

		// a = relationship 1 between angles and the distance of the waypoints
		// Used in calculating the point locations in the spline
		Object.defineProperty(this, "a", { enumerable: true, get: function () { return (getA0(this) + getA1(this)) / (this.knot * this.knot); } });
		// b = relationship 2 between angles and the distance of the waypoints
		// Used in calculating the point locations in the spline
		Object.defineProperty(this, "b", { enumerable: true, get: function () { return -(2 * getA0(this) + getA1(this)) / this.knot; } });

		// function returns the point in the spline based on the location percentage given
		this.get = function (percentage) {
			// Console logs used for testing
			//console.log('a0 = ' + getA0(this));
			//console.log('a1 = ' + getA1(this));
			//console.log('Start angle = ' + this.startAngle);
			//console.log('End Angle = ' + this.endAngle);
			//console.log('Angle Off = ' + this.angleOff)
			percentage = Math.max(Math.min(percentage, 1), 0);
			let x = percentage * this.knot;
			let y = (this.a * x + this.b) * (x * x) + getA0(this) * x;
			let cosTheta = Math.cos(this.angleOff);
			let sinTheta = Math.sin(this.angleOff);

			let speedAtPoint = undefined;

			if (percentage === 0) {
				speedAtPoint = w1.speed;
			} else if (percentage === 1) {
				speedAtPoint = w2.speed;
			} 

			return new point(x * cosTheta - y * sinTheta + w1.x, x * sinTheta + y * cosTheta + w1.y, speedAtPoint);
		};
	}
}
