//const { i } = require("mathjs"); 

/*
 * Represents a location of the robot on the field
 * Contains the coordinates (x, y) and the speed of the robot
 */
function point(x, y, speed, time, theta, omega, splineNum) {
	this.x = x;
	this.y = y;
	this.speed = speed;
	this.time = time;
	this.theta = theta;
	this.omega = omega;
	this.vx = 0;
	this.vy = 0;
	this.splineNum = splineNum;

	this.toJSON = function () {
		return {
			x: this.x === undefined ? 0 : Number.parseFloat(this.x.toFixed(2)),
			y: this.y === undefined ? 0 : Number.parseFloat(this.y.toFixed(2)),
			speed: this.speed === undefined ? 0 : Number.parseFloat(this.speed.toFixed(2)),
			time: this.time === undefined ? 0 : Number.parseFloat(this.time.toFixed(2)),
			theta: this.theta === undefined ? 0 : Number.parseFloat(this.theta.toFixed(2)),
			omega: this.omega === undefined ? 0 : Number.parseFloat(this.omega.toFixed(2)),
			vx: this.vx === undefined ? 0 : Number.parseFloat(this.vx.toFixed(2)),
			vy: this.vy === undefined ? 0 : Number.parseFloat(this.vy.toFixed(2)),
			splineNum: this.splineNum === undefined ? 0 : Number.parseFloat(this.splineNum.toFixed(2))
		}
	};
}

/*
 * Function takes two waypoints and returns generated points in a spline between the two given waypoints
 */
class Spline {
	constructor(startWaypoint, endWaypoint) {
		this.samples = 7;
		this.points = [];

		this.startWaypoint = startWaypoint;
		this.endWaypoint = endWaypoint;

		this.startAngle = startWaypoint.spline_angle;
		// endAngle = angle of waypoint 2 in degrees
		this.endAngle = endWaypoint.spline_angle;
		// knot = distance between the two waypoints
		this.getKnot = function() {
			return Math.sqrt((endWaypoint.x - startWaypoint.x) * (endWaypoint.x - startWaypoint.x) + (endWaypoint.y - startWaypoint.y) * (endWaypoint.y - startWaypoint.y));
		}
		// angleOff = angle between the starting waypoint and the ending waypoint in radians
		// angleOff has nothing to do with rotation of robot
		this.getAngleOff = function() {
			return Math.atan2(endWaypoint.y - startWaypoint.y, endWaypoint.x - startWaypoint.x);
		}

		// represents relationship between startAngle and the angleOff
		let getA0 = function (spline) {
			let a0 = toRadians(spline.startAngle) - spline.getAngleOff();
			while (a0 > Math.PI * 2) {
				a0 -= Math.PI * 2;
			}
			a0 = Math.tan(a0);
			return a0;
		};

		// represents relationship between endAngle and the angleOff
		let getA1 = function (spline) {
			let a1 = toRadians(spline.endAngle) - spline.getAngleOff();
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
				speedAtPoint = startWaypoint.speed;
			} else if (percentage === 1) {
				speedAtPoint = endWaypoint.speed;
			} 

			return new point(x * cosTheta - y * sinTheta + startWaypoint.x, x * sinTheta + y * cosTheta + startWaypoint.y, speedAtPoint);
		};

		this.generatePoints = function () { 
			this.points = [];
			let stepSize = 1 / this.samples; // Sets the stepSize based on the samples

			this.points.push(this.get(0)); 
			this.points[0].theta = startWaypoint.angle; 

			for (let i = stepSize; i < 1; i += stepSize) {
				this.points.push(this.get(i));
			}

			this.points.push(this.get(1));
			this.points[this.points.length - 1].theta = endWaypoint.angle;
		};

		this.calculateTime = function (initialTime) {
			this.points[0].time = initialTime;
            let totalTime = initialTime;
            for (let i = 1; i < this.points.length; i++) {
                let deltaDist = hypot(this.points[i].x, this.points[i].y, this.points[i-1].x, this.points[i-1].y);
                let deltaTime = this.points[i].speed !== 0 ? deltaDist / this.points[i].speed : 0;

                totalTime += deltaTime;
                this.points[i].time = totalTime;
            }
		};

		this.calculateThetas = function () { 
			this.points[0].omega = 0;
			let deltaTime = this.points[this.points.length - 1].time - this.points[0].time;
			let aveOmega = shortestRotationTo(startWaypoint.angle, endWaypoint.angle) / deltaTime;
			let alpha = (aveOmega) / (0.5 * deltaTime);
			for (let i = 1; i < this.points.length; i++) {
				let relTime = this.points[i].time - this.points[0].time
				if (relTime < (0.5 * deltaTime)) {
					this.points[i].omega = alpha * relTime + this.points[0].omega;
					this.points[i].theta = 0.5 * alpha * relTime * relTime + this.points[0].omega + this.points[0].theta;
				} else {
					this.points[i].omega = -alpha * relTime + this.points[0].omega + 4 * aveOmega;
					this.points[i].theta = 0.5 * alpha * relTime * relTime + this.points[0].omega + this.points[0].theta;    
				}
			}
			endWaypoint.omega = this.points[this.points.length-1].omega;

        };
	}
}
