import { Waypoint } from "./Waypoint";
import { Point } from "./Point";
import { toRadians } from "./Math";

/*
 * Function takes two waypoints and returns generated points in a spline between the two given waypoints
 */
export class Spline {
	w1: Waypoint;
	w2: Waypoint;
	startAngle: number;
	endAngle: number;
	points: Point[];

	constructor(w1: Waypoint, w2: Waypoint) {
		this.w1 = w1;
		this.w2 = w2;
		this.startAngle = w1.spline_angle;
		this.endAngle = w2.spline_angle;
		this.points = [];
		this.generatePoints = this.generatePoints.bind(this);
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
	 * @returns Relatopship between startAngle and angleOff
	 */
	getA0() {
		let a0 = -toRadians(this.startAngle + 90) - this.getAngleOff();
		while (a0 > Math.PI * 2) {
			a0 -= Math.PI * 2;
		}
		a0 = Math.tan(a0);
		return a0;
	};

	getA1() {
		let a1 = -toRadians(this.endAngle + 90) - this.getAngleOff();
		while (a1 > Math.PI * 2) {
			a1 -= Math.PI * 2;
		}
		a1 = Math.tan(a1);
		return a1;
	};

	getA() {
		return (this.getA0() + this.getA1()) / (this.getKnot() * this.getKnot());
	};

	getB() {
		return -(2 * this.getA0() + this.getA1()) / this.getKnot();
	};

	get(percentage: number) {
		percentage = Math.max(Math.min(percentage, 1), 0);
		let x = percentage * this.getKnot();
		let y = (this.getA() * x + this.getB()) * (x * x) + this.getA0() * x;
		let cosTheta = Math.cos(this.getAngleOff());
		let sinTheta = Math.sin(this.getAngleOff());

		let speedAtPoint = undefined;

		if (percentage === 0) {
			speedAtPoint = this.w1.speed;
		} else if (percentage === 1) {
			speedAtPoint = this.w2.speed;
		} 

		return new Point(x * cosTheta - y * sinTheta + this.w1.x, x * sinTheta + y * cosTheta + this.w1.y, speedAtPoint);
	}

	generatePoints(samples: number) {
		this.points = [];
		let stepSize = 1 / samples; // Sets the stepSize based on the samples
		console.log(this.points);

		this.points.push(this.get(0)); 
		console.log(this.points);
		this.points[0].theta = this.w1.angle; 

		for (let i = stepSize; i < 1; i += stepSize) {
			this.points.push(this.get(i));
		}

		this.points.push(this.get(1));
		this.points[this.points.length - 1].theta = this.w2.angle;
	}
}
