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
		this.speed = speed ?? 0;
		this.time = 0;
		this.theta = 0;
		this.omega = 0;
	}
		
	toJSON() {
		return {
			x: this.x === undefined ? 0 : Number.parseFloat(this.x.toFixed(2)),
			y: this.y === undefined ? 0 : Number.parseFloat(this.y.toFixed(2)),
			speed: this.speed === undefined ? 0 : Number.parseFloat(this.speed.toFixed(2)),
			time: this.time === undefined ? 0 : Number.parseFloat(this.time.toFixed(2)),
			theta: this.theta === undefined ? 0 : Number.parseFloat(this.theta.toFixed(2)),
			omega: this.omega === undefined ? 0 : Number.parseFloat(this.omega.toFixed(2))
		}
	}

    equals(otherPoint: Point) {
        return this.x === otherPoint.x && 
               this.y === otherPoint.y &&
               this.speed === otherPoint.speed &&
               this.time === otherPoint.time && 
               this.theta === otherPoint.theta &&
               this.omega === otherPoint.omega;
    }
}