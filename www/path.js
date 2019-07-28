function toCamelCase(str) {
    if(str !== undefined) {
        return str.replace(/(?:^\w|[A-Z]|\b\w|\s+)/g, function(match, index) {
            if (+match === 0) return ""; // or if (/\s+/.test(match)) for white spaces
            return match.toUpperCase();
        });
    }
}

class Path {
    constructor(pathName) {
        this.name = toCamelCase(pathName);
        let waypoints = [];
        let splines = [];
        let points = [];


        let regenerate = true;

        let simplified = false;

        this.newWaypoint = function (x, y, angle, name, shared, index) {
            if (index === undefined) {
                index = waypoints.length - 1;
            }

            if (shared === undefined) {
                shared = false;
            }

            let lastWaypoint;
            if (waypoints.length !== 0) {
                lastWaypoint = waypoints[waypoints.length - 1];
                x = (x === undefined) ? lastWaypoint.x + 15 : x;
                y = (y === undefined) ? lastWaypoint.y + 15 : y;
                angle = (angle === undefined) ? lastWaypoint.angle : angle;
            } else {
                x = (x === undefined) ? 0 : x;
                y = (y === undefined) ? 0 : y;
                angle = (angle === undefined) ? 0 : angle;
            }
            let newRobot = new Waypoint(x, y, angle, name, shared);
            waypoints.push(newRobot);
            if (lastWaypoint) {
                let newSpline = new Spline(lastWaypoint, newRobot);
                let lastSpline = splines.length > 0 ? splines[splines.length - 1].spline : undefined;
                if (lastSpline) {
                    newSpline.startAngle = lastSpline.endAngle;
                }
                splines.push({
                    spline: newSpline,
                    samples: 7,
                    length: 0
                });
            }

            regenerate = true;
        };

        this.removeWaypoint = function (index) {
            if (index !== undefined) {
                waypoints.splice(index, 1);
                if(waypoints.length === index) {
                    splines.splice(index - 1, 1);
                }  else if (index === 0) {
                    splines.splice(index, 1);
                } else {
                    splines.splice(index, 1);
                    let newSpline = new Spline(waypoints[index - 1], waypoints[index]);
                    newSpline.startAngle = waypoints[index - 1].angle;
                    newSpline.endAngle = waypoints[index].angle;
                    splines[index - 1].spline = newSpline;
                }
            } else {
                waypoints.pop();
                splines.pop();
            }

            regenerate = true;
        };

        this.getPoints = function (waypointToSimplify) {
            if ((waypointToSimplify === undefined) !== simplified) {
                regenerate = true;
            }
            if (regenerate) {
                points = [];

                for (let i in waypoints) {
                    let leftSpline = i === 0 ? undefined : splines[i - 1];
                    if (leftSpline) {
                        leftSpline.spline.endAngle = waypoints[i].angle;
                    }
                    let rightSpline = i === splines.length ? undefined : splines[i];
                    if (rightSpline) {
                        rightSpline.spline.startAngle = waypoints[i].angle;
                    }
                }
                if (splines.length !== 0) {
                    for (let s in splines) {
                        let spline = splines[s];
                        let stepSize = 1 / spline.samples;
                        spline.length = hypot(spline.spline.get(0).x, spline.spline.get(0).y,
                            spline.spline.get(stepSize).x, spline.spline.get(stepSize).y);

                        if (waypointToSimplify !== undefined &&
                            (parseInt(s) === waypointToSimplify || parseInt(s) === waypointToSimplify - 1)) {
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

                        points.push(spline.spline.get(0));

                        for (let i = stepSize; i < 1; i += stepSize) {
                            points.push(spline.spline.get(i));
                        }
                        points.push(spline.spline.get(1));
                    }
                    this.calculateSpeed();
                    regenerate = false;
                }
            }
            return points;
        };

        this.calculateSpeed = function () {
            let k = 1;
            let maxVel = 100;
            let maxAccel = 80;

            //Limit speed around curves based on curvature
            for (let i in points) {
                if (parseInt(i) === 0 || parseInt(i) >= (points.length - 1)) {
                    points[i].speed = maxVel;
                } else {
                    let curvature = calculateCurvature(points[parseInt(i) - 1], points[parseInt(i)], points[parseInt(i) + 1]);
                    if (curvature === 0 || isNaN(curvature)) {
                        points[i].speed = maxVel;
                    } else {
                        points[i].speed = Math.min(maxVel, k / curvature);
                    }
                }
            }

            points[0].speed = 0;
            points[points.length - 1].speed = 0;

            //Limit acceleration
            for (let i = 1; i < points.length; i++) {
                let distance = hypot(points[i - 1].x, points[i - 1].y, points[i].x, points[i].y);
                points[i].speed = Math.min(points[i].speed, Math.sqrt(points[i - 1].speed**2 + 2 * maxAccel * distance));
            }

            //Limit deceleration
            for (let i = points.length - 2; i >= 0; i--) {
                let distance = hypot(points[i + 1].x, points[i + 1].y, points[i].x, points[i].y);
                points[i].speed = Math.min(points[i].speed, Math.sqrt(points[i + 1].speed**2 + 2 * maxAccel * distance));
            }

        };

        this.getWaypoints = function () {
            return waypoints;
        };

        this.getNumWaypoints = function () {
          return waypoints.length;
        };

        this.getWaypoint = function (waypointIndex) {
            if (waypointIndex >= waypoints.length) {
                return undefined;
            }
            const obj = waypoints[waypointIndex];
            return new Proxy(obj, {
                set(target, prop, value, receiver) {
                    regenerate = true;
                    target[prop] = value;
                    return true;
                }
            });
        };

        this.getWaypointIndexByName = function (name) {
            for (let i in waypoints) {
                if (name === waypoints[i].name) {
                    return i;
                }
            }
            return undefined;
        };

        this.getClosestWaypoint = function (coordinate, radius) {
            let mousePosInInches = pixelsToInches(fieldMousePos);
            let closestWaypoint = -1;
            let currentLeastDistance = radius;
            for (let i in waypoints) {
                let distance = hypot(mousePosInInches.x, mousePosInInches.y, waypoints[i].x, waypoints[i].y);
                if (distance < currentLeastDistance) {
                    closestWaypoint = parseInt(i);
                    currentLeastDistance = distance;
                }
            }
            return closestWaypoint;
        };

        this.toJSON = function () {
            return {
                name: this.name,
                waypoints: waypoints,
                points: this.getPoints()
            }
        };
    }

    static fromJson(json) {
        let path = new Path(json.name);
        for (let waypoint of json.waypoints) {
            path.newWaypoint(waypoint.x, waypoint.y, waypoint.angle, waypoint.name);
        }
        return path;
    }
}