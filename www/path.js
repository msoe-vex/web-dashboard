function toCamelCase(str) {
    if(str !== undefined) {
        return str.replace(/(?:^\w|[A-Z]|\b\w|\s+)/g, function(match, index) {
            if (+match === 0) return ""; // or if (/\s+/.test(match)) for white spaces
            return match.toUpperCase();
        });
    }
}

/*
 * Path Class
 *
 * Paths are made up of waypoints which are connected by splines.
 * Each spline is a series of points bewteen the waypoints.
 *
 * Paths also contain path and robot specific data used in some calculations
 */
class Path {
    constructor(pathName, maxVel, maxAccel, k, totalTime) {
        this.name = toCamelCase(pathName);
        this.maxVel = maxVel;
        this.maxAccel = maxAccel;
        this.k = (k === undefined) ? 1.6 : k;
        this.totalTime = totalTime || 0;
        this.waypoints = [];
        let splines = [];
        this.points = [];
        let self = this;


        let regenerate = true;

        let simplified = false;

        this.regeneratePath = function() {
            regenerate = true;
        }

        this.setMaxVel = function (maxVel) {
            this.maxVel = maxVel;
        };

        this.setMaxAccel = function (maxAccel) {
            this.maxAccel = maxAccel;
        };

        this.getMaxVel = function () {
            return this.maxVel;
        };

        this.getMaxAccel = function () {
            return this.maxAccel;
        };

        this.newWaypoint = function (x, y, angle, spline_angle, name, speed, shared, index) {
            if (index === undefined) {
                index = this.waypoints.length - 1;
            }

            if (shared === undefined) {
                shared = false;
            }

            let lastWaypoint;
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
                let lastSpline = splines.length > 0 ? splines[splines.length - 1] : undefined;
                if (lastSpline) {
                    newSpline.startAngle = lastSpline.endAngle;
                }
                splines.push(newSpline);
            }

            regenerate = true;
            return newWaypoint;
        };

        this.removeWaypoint = function (index) {
            if (index !== undefined) {
                this.waypoints.splice(index, 1);
                if(this.waypoints.length === index) {
                    splines.splice(index - 1, 1);
                }  else if (index === 0) {
                    splines.splice(index, 1);
                } else {
                    splines.splice(index, 1);
                    let newSpline = new Spline(this.waypoints[index - 1], this.waypoints[index]);
                    newSpline.startAngle = this.waypoints[index - 1].angle;
                    newSpline.endAngle = this.waypoints[index].angle;
                    splines[index - 1] = newSpline;
                }
            } else {
                this.waypoints.pop();
                splines.pop();
            }

            regenerate = true;
        };

        this.getPoints = function (waypointToSimplify) {
            // Regenerate path if switching between simplified and non simplified representations
            if ((waypointToSimplify === undefined) === simplified) {
                regenerate = true;
                simplified = !simplified;
            }

            if (regenerate) {
                this.points = [];

                for (let i in this.waypoints) {
                    let leftSpline = i === 0 ? undefined : splines[i - 1];
                    if (leftSpline) {
                        leftSpline.endAngle = this.waypoints[i].spline_angle;
                    }
                    let rightSpline = i === splines.length ? undefined : splines[i];
                    if (rightSpline) {
                        rightSpline.startAngle = this.waypoints[i].spline_angle;
                    }
                }
                if (splines.length !== 0) {
                    splines.forEach((spline, i) => {
                        let stepSize = 1 / spline.samples;
                        let length = hypot(spline.get(0).x, spline.get(0).y,
                            spline.get(stepSize).x, spline.get(stepSize).y);

                        if (waypointToSimplify !== undefined &&
                            (i === waypointToSimplify || i === waypointToSimplify - 1)) {
                            spline.samples = 7;
                            stepSize = 1 / spline.samples;
                        } else {
                            while (length > 4) { //Increase samples until <4 in between first and second points
                                spline.samples++;
                                stepSize = 1 / spline.samples;
                                length = hypot(spline.get(0).x, spline.get(0).y,
                                    spline.get(stepSize).x, spline.get(stepSize).y);
                            }
                        }
                        //generates points in the current spline
                        spline.generatePoints();
                        if (i !== splines.length - 1) {
                            spline.points.pop();
                        }
                        // iterates through each point in spline.points
                        spline.points.forEach((point, j) => {
                            self.points.push(point);
                        });
                    });
                    this.calculateSpeed();
                    regenerate = false;
                    this.waypoints[0].omega = 0;
                    // this is here because calculateSpeed can only be done on the complete points array and 
                    // calculateTime and calulateThetas depend on speed and time
                    splines.forEach((spline, i) => {
                        // handles edge case of the inital time of the path
                        let initialTime = i !== 0 ? splines[i-1].points[splines[i-1].points.length] : 0
                        // passes in the final time of the previous spline as the inital of the current
                        spline.calculateTime(initialTime);
                        spline.calculateThetas();
                    });

                    this.calculateSpeedComponents();
                }
            }
            return this.points;
        };
        
        this.calculateSpeedComponents = function() {
            this.points[0].vx = 0;
            this.points[0].vy = 0;
            this.points.forEach((point, i) => {
                if(i !== 0) {
                    let delta_time = this.points[i].time - this.points[i-1].time;
                    if(delta_time === 0) {
                        this.points[i].vx = 0;
                        this.points[i].vy = 0;
                    } else {
                        this.points[i].vx = (this.points[i].x - this.points[i-1].x) / delta_time;
                        this.points[i].vy = (this.points[i].y - this.points[i-1].y) / delta_time;
                    }
                }
            });
        }

        this.calculateSpeed = function () {
            //Limit speed around curves based on curvature
            this.points.forEach((point, i) => {
                if (i !== 0 && i < (self.points.length - 1)) {
                    let curvature = calculateCurvature(self.points[i - 1], self.points[i], self.points[i + 1]);
                    let current_speed = point.speed || self.maxVel;
                    if (curvature === 0 || isNaN(curvature)) {
                        point.speed = current_speed;
                    } else {
                        point.speed = Math.min(current_speed, Math.min(self.maxVel, (self.k / curvature)));
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
        };

        this.getWaypoints = function () {
            return this.waypoints;
        };

        this.getNumWaypoints = function () {
          return this.waypoints.length;
        };

        this.getWaypoint = function (waypointIndex) {
            if (waypointIndex >= this.waypoints.length) {
                return undefined;
            }
            const obj = this.waypoints[waypointIndex];
            return new Proxy(obj, {
                set(target, prop, value, receiver) {
                    regenerate = true;
                    target[prop] = value;
                    return true;
                }
            });
        };

        this.getWaypointIndexByName = function (name) {
            for (let i in this.waypoints) {
                if (name === this.waypoints[i].name) {
                    return i;
                }
            }
            return undefined;
        };

        this.getClosestWaypoint = function (coordinate, radius) {
            let mousePosInInches = pixelsToInches(fieldMousePos);
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
    }

    static fromJson(json) {
        let path = new Path(json.name, json.maxVel, json.maxAccel, json.k);
        json.waypoints.forEach((waypoint) => {
            path.newWaypoint(waypoint.x, waypoint.y, waypoint.angle, waypoint.spline_angle, waypoint.name, waypoint.speed, waypoint.shared);
        });
        return path;
    }
}