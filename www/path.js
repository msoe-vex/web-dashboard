class Path {
    constructor() {
        let waypoints = [];
        let splines = [];
        let points = [];

        let regenerate = true;

        let simplified = false;

        this.newWaypoint = function (x, y, angle, name, index) {
            if (index === undefined) {
                index = waypoints.length - 1;
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
            let newRobot = new Waypoint(x, y, angle, name);
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

                for (let s in splines) {
                    let spline = splines[s];
                    let stepSize = 1 / spline.samples;
                    spline.length = hypot(spline.spline.get(0).x, spline.spline.get(0).y,
                        spline.spline.get(stepSize).x, spline.spline.get(stepSize).y);

                    if(waypointToSimplify !== undefined &&
                        (parseInt(s) === waypointToSimplify || parseInt(s) === waypointToSimplify - 1)) {
                        spline.samples = 7;
                        stepSize = 1 / spline.samples;
                    } else {
                        while (spline.length > 6) { //Increase samples until <6 in between first and second points
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
                regenerate = false;
            }
            return points;
        };

        this.getWaypoints = function () {
            return waypoints;
        };

        this.getWaypoint = function (waypointIndex) {
            const obj = waypoints[waypointIndex];
            return new Proxy(obj, {
                set(target, prop, value, receiver) {
                    regenerate = true;
                    target[prop] = value;
                    return true;
                }
            });
        };

        this.getWaypointByName = function (name) {
            for (let waypoint of waypoints) {
                if (name === waypoint.name) {
                    return waypoint;
                }
            }
        };

        this.getClosestWaypoint = function (coordinate, radius) {
            var mX = px2inX(fieldMousePos.x);
            var mY = px2inY(fieldMousePos.y);
            var closestWaypoint = -1;
            var currentLeastDistance = radius;
            for (var i = 0; i < waypoints.length; i++) {
                var distance = hypot(mX, mY, waypoints[i].x, waypoints[i].y);
                if (distance < currentLeastDistance) {
                    closestWaypoint = i;
                    currentLeastDistance = distance;
                }
            }
            return closestWaypoint;
        };

        this.toJSON = function () {
            return {
                name: name,
                waypoints: waypoints,
                points: this.getPoints()
            }
        };
    }


}