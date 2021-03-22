import { Waypoint } from "./Waypoint";
import { Point, Spline } from "./Spline";
import { hypot, calculateCurvature, shortestRotationTo } from "./Math";
import { pixelsToInches, getFieldMousePosVar } from "./autonCreator.js"

const toCamelCase = (str: string) => {
    if(str !== undefined) {
        return str.replace(/(?:^\w|[A-Z]|\b\w|\s+)/g, function(match, index) {
            if (+match === 0) return ""; // or if (/\s+/.test(match)) for white spaces
            return match.toUpperCase();
        });
    }
}

export type SplineDetails = {
    spline: Spline;
    samples: number;
    length: number;
}

/*
 * Path Class
 *
 * Paths are made up of waypoints which are connected by splines.
 * Each spline is a series of points bewteen the waypoints.
 *
 * Paths also contain path and robot specific data used in some calculations
 */
export class Path {
    name: string;
    maxVel: number;
    maxAccel: number;
    k: number;
    totalTime: number;
    waypoints: Waypoint[];
    splines: SplineDetails[];
    points: Point[];
    regenerate: boolean;
    simplified: boolean;
    waypointIndicies: any[];


    constructor(pathName: string, maxVel: number, maxAccel: number, k?: number, totalTime?: number) {
        this.name = toCamelCase(pathName);
        this.maxVel = maxVel;
        this.maxAccel = maxAccel;
        this.k = k || 1.6;
        this.totalTime = totalTime || 0;
        let waypoints = [];
        let splines = [];
        this.points = [];
        this.regenerate = true;
        this.simplified = false;
    }

    regeneratePath() {
        this.regenerate = true;
    }

    setMaxVel(maxVel: number) {
        this.maxVel = maxVel;
    };

    setMaxAccel(maxAccel: number) {
        this.maxAccel = maxAccel;
    };

    getMaxVel() {
        return this.maxVel;
    };

    getMaxAccel() {
        return this.maxAccel;
    };

    newWaypoint(x?: number, y?: number, angle?: number, spline_angle?: number, name?: string, speed?: number, shared?: boolean, index?: number) {
        if (index === undefined) {
            index = this.waypoints.length - 1;
        }

        if (shared === undefined) {
            shared = false;
        }

        let lastWaypoint: Waypoint;
        if (this.waypoints.length !== 0) {
            lastWaypoint = this.waypoints[this.waypoints.length - 1];
            x = (x === undefined) ? lastWaypoint.x + 15 : x;
            y = (y === undefined) ? lastWaypoint.y + 15 : y;
            angle = (angle === undefined) ? lastWaypoint.angle : angle;
            spline_angle = (spline_angle === undefined) ? lastWaypoint.spline_angle : spline_angle;
        } else {
            x = (x === undefined) ? 0 : x;
            y = (y === undefined) ? 0 : y;
            angle = (angle === undefined) ? 0 : angle;
            spline_angle = (spline_angle === undefined) ? 0 : spline_angle;
        }

        speed = speed ?? this.maxVel;
        let newWaypoint = new Waypoint(x, y, angle, spline_angle, name, speed, shared);
        this.waypoints.push(newWaypoint);
        if (lastWaypoint) {
            let newSpline = new Spline(lastWaypoint, newWaypoint);
            let lastSpline = this.splines.length > 0 ? this.splines[this.splines.length - 1].spline : undefined;
            if (lastSpline) {
                newSpline.startAngle = lastSpline.endAngle;
            }
            this.splines.push({
                spline: newSpline,
                samples: 7,
                length: 0
            });
        }

        this.regenerate = true;
        return newWaypoint;
    };

    removeWaypoint(index: number) {
        if (index !== undefined) {
            this.waypoints.splice(index, 1);
            if(this.waypoints.length === index) {
                this.splines.splice(index - 1, 1);
            }  else if (index === 0) {
                this.splines.splice(index, 1);
            } else {
                this.splines.splice(index, 1);
                let newSpline = new Spline(this.waypoints[index - 1], this.waypoints[index]);
                newSpline.startAngle = this.waypoints[index - 1].angle;
                newSpline.endAngle = this.waypoints[index].angle;
                this.splines[index - 1].spline = newSpline;
            }
        } else {
            this.waypoints.pop();
            this.splines.pop();
        }

        this.regenerate = true;
    };

    getPoints(waypointToSimplify: number) {
        // Regenerate path if switching between simplified and non simplified representations
        if ((waypointToSimplify === undefined) === this.simplified) {
            this.regenerate = true;
            this.simplified = !this.simplified;
        }

        if (this.regenerate) {
            this.points = [];

            this.waypoints.forEach((waypoint, i) => {
                let leftSpline = i === 0 ? undefined : this.splines[i - 1];
                if (leftSpline) {
                    leftSpline.spline.endAngle = waypoint.spline_angle;
                }
                let rightSpline = i === this.splines.length ? undefined : this.splines[i];
                if (rightSpline) {
                    rightSpline.spline.startAngle = waypoint.spline_angle;
                }
            });

            if (this.splines.length !== 0) {
                this.splines.forEach((spline, i) => {
                    let stepSize = 1 / spline.samples;
                    spline.length = hypot(spline.spline.get(0).x, spline.spline.get(0).y,
                        spline.spline.get(stepSize).x, spline.spline.get(stepSize).y);

                    if (waypointToSimplify !== undefined &&
                        (i === waypointToSimplify || i === waypointToSimplify - 1)) {
                        spline.samples = 7;
                        stepSize = 1 / spline.samples;
                    } else {
                        while (spline.length > 4) { //Increase samples until <4 in between first and second points
                            spline.samples++;
                            stepSize = 1 / spline.samples;
                            spline.length = hypot(spline.spline.get(0).x, spline.spline.get(0).y,
                                spline.spline.get(stepSize).x, spline.spline.get(stepSize).y);
                        }
                    }

                    this.points.push(spline.spline.get(0));
                    for (let i = stepSize; i < 1; i += stepSize) {
                        this.points.push(spline.spline.get(i));
                    }

                    if (i === (this.splines.length - 1)) {
                        this.points.push(spline.spline.get(1));
                    }
                });
                
                this.calculateSpeed();
                this.regenerate = false;
            }
        }
        return this.points;
    };

    calculateSpeed() {
        //Limit speed around curves based on curvature
        this.points.forEach((point, i) => {
            if (i !== 0 && i < (this.points.length - 1)) {
                let curvature = calculateCurvature(this.points[i - 1], this.points[i], this.points[i + 1]);
                let current_speed = point.speed || this.maxVel;
                if (curvature === 0 || isNaN(curvature)) {
                    point.speed = Math.min(current_speed, this.maxVel);
                } else {
                    point.speed = Math.min(current_speed, Math.min(this.maxVel, (this.k / curvature)));
                }
            }
        });

        //Limit acceleration
        for (let i = 1; i < this.points.length; i++) {
            let distance = hypot(this.points[i - 1].x, this.points[i - 1].y, this.points[i].x, this.points[i].y);
            this.points[i].speed = Math.min(this.points[i].speed, Math.sqrt(this.points[i - 1].speed**2 + 2 * this.maxAccel * distance));
        }

        //Limit deceleration
        for (let i = this.points.length - 2; i >= 0; i--) {
            let distance = hypot(this.points[i + 1].x, this.points[i + 1].y, this.points[i].x, this.points[i].y);
            this.points[i].speed = Math.min(this.points[i].speed, Math.sqrt(this.points[i + 1].speed**2 + 2 * this.maxAccel * distance));
        }

        // TODO add another block to limit turning (copy both blocks above)

        // Figure out the time of each point based on the velocity and distance
        // Step through previous points and use their velocity and distance to determine time
        // Add the time to each point
    };

    calculateTime() {
        this.points[0].time = 0;
        for (let i = 1; i < this.points.length; i++) {
            let deltaDist = hypot(this.points[i].x, this.points[i-1].x, this.points[i].y, this.points[i-1].y);
            let deltaTime = deltaDist / this.points[i].speed;
            this.totalTime += deltaTime;
            this.points[i].time = this.totalTime;
        }
    };

    calculateThetas() { // TODO: Create waypointIndicies that hols the points indicies where waypoints are
        for (let i = 1; i < this.waypointIndicies.length; i++) {
            let deltaTime = this.points[i].time - this.points[i-1].time;
            let aveOmega = shortestRotationTo(this.points[i].theta, this.points[i-1].theta) / deltaTime;
            let alpha = (2 * aveOmega) / (0.5 * deltaTime);
            for (this.k = this.waypointIndicies[i-1]; this.k < this.waypointIndicies[i]; this.k++) {
                let relTime = this.points[this.k].time - this.points[i-1].time
                if (relTime > (0.5 * deltaTime)) {
                    this.points[this.k].omega = alpha * relTime + this.points[i-1].omega;
                    this.points[this.k].theta = this.points[this.k].omega * relTime + this.points[i-1].theta;
                } else {
                    this.points[this.k].omega = -alpha * relTime + this.points[i-1].omega + 2 * aveOmega;
                    this.points[this.k].theta = this.points[this.k].omega * relTime + this.points[i-1].theta;    
                }
            }
        }
    };

    getWaypoints() {
        return this.waypoints;
    };

    getNumWaypoints () {
        return this.waypoints.length;
    };

    getWaypoint(waypointIndex: number) {
        if (waypointIndex >= this.waypoints.length) {
            return undefined;
        }

        const obj: any = this.waypoints[waypointIndex];
        return new Proxy(obj, {
            set(target, prop, value, receiver) {
                this.regenerate = true;
                target[prop] = value;
                return true;
            }
        });
    };

    getWaypointIndexByName(name: string) {
        for (let i in this.waypoints) {
            if (name === this.waypoints[i].name) {
                return i;
            }
        }
        return undefined;
    };

    getClosestWaypoint(radius: number) {
        let mousePosInInches: any = pixelsToInches(getFieldMousePosVar());
        let closestWaypoint = -1;
        let currentLeastDistance = radius;
        for (let i in this.waypoints) {
            let distance = hypot(mousePosInInches.x, mousePosInInches.y, this.waypoints[i].x, this.waypoints[i].y);
            if (distance < currentLeastDistance) {
                closestWaypoint = parseInt(i);
                currentLeastDistance = distance;
            }
        }
        return closestWaypoint;
    };

    static fromJson(json: any) {
        let path = new Path(json.name, json.maxVel, json.maxAccel, json.k);
        json.waypoints.forEach((waypoint: Waypoint) => {
            path.newWaypoint(waypoint.x, waypoint.y, waypoint.angle, waypoint.spline_angle, waypoint.name, waypoint.speed, waypoint.shared);
        });
        return path;
    }
}