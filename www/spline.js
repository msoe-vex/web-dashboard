/*
 * Represents a location of the robot on the field
 * Contains the coordinates (x, y) and the speed of the robot
 */
function point(x, y, speed, time, theta, omega) {
	this.x = x;
	this.y = y;
	this.speed = speed;
	this.time = time;
	this.theta = theta;
	this.omega = omega;

	this.toJSON = function () {
		return {
			x: this.x === undefined ? 0 : Number.parseFloat(this.x.toFixed(2)),
			y: this.y === undefined ? 0 : Number.parseFloat(this.y.toFixed(2)),
			speed: this.speed === undefined ? 0 : Number.parseFloat(this.speed.toFixed(2)),
			time: this.time === undefined ? 0 : Number.parseFloat(this.time.toFixed(2)),
			theta: this.theta === undefined ? 0 : Number.parseFloat(this.theta.toFixed(2)),
			omega: this.omega === undefined ? 0 : Number.parseFloat(this.omega.toFixed(2))
		}
	};
}

/*
 * Function takes two waypoints and returns generated points in a spline between the two given waypoints
 */
class Spline {
	constructor(w1, w2) {
		this.startAngle = w1.spline_angle;
		// endAngle = angle of waypoint 2 in degrees
		this.endAngle = w2.spline_angle;
		// knot = distance between the two waypoints
		this.getKnot = function() {
			return Math.sqrt((w2.x - w1.x) * (w2.x - w1.x) + (w2.y - w1.y) * (w2.y - w1.y));
		}
		// angleOff = angle between the starting waypoint and the ending waypoint in radians
		// angleOff has nothing to do with rotation of robot
		this.getAngleOff = function() {
			return Math.atan2(w2.y - w1.y, w2.x - w1.x);
		}

		// represents relationship between startAngle and the angleOff
		let getA0 = function (spline) {
			let a0 = -toRadians(spline.startAngle + 90) - spline.getAngleOff();
			while (a0 > Math.PI * 2) {
				a0 -= Math.PI * 2;
			}
			a0 = Math.tan(a0);
			return a0;
		};

		// represents relationship between endAngle and the angleOff
		let getA1 = function (spline) {
			let a1 = -toRadians(spline.endAngle + 90) - spline.getAngleOff();
			while (a1 > Math.PI * 2) {
				a1 -= Math.PI * 2;
			}
			a1 = Math.tan(a1);
			return a1;
		};

		// a = relationship 1 between angles and the distance of the waypoints
		// Used in calculating the point locations in the spline
		this.getA = function() {
			return (getA0(this) + getA1(this)) / (this.getKnot() * this.getKnot());
		};
	
		// b = relationship 2 between angles and the distance of the waypoints
		// Used in calculating the point locations in the spline
		this.getB = function() {
			return -(2 * getA0(this) + getA1(this)) / this.getKnot();
		}

		// function returns the point in the spline based on the location percentage given
		this.get = function (percentage) {
			// Console logs used for testing
			//console.log('a0 = ' + getA0(this));
			//console.log('a1 = ' + getA1(this));
			//console.log('Start angle = ' + this.startAngle);
			//console.log('End Angle = ' + this.endAngle);
			//console.log('Angle Off = ' + this.angleOff)
			percentage = Math.max(Math.min(percentage, 1), 0);
			let x = percentage * this.getKnot();
			let y = (this.getA() * x + this.getB()) * (x * x) + getA0(this) * x;
			let cosTheta = Math.cos(this.getAngleOff());
			let sinTheta = Math.sin(this.getAngleOff());

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
