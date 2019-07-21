var fieldImage = new Image();
var robotImage = new Image();

var rotTarget = -1;
var rotTargetRobot, rotTargetWaypoint;
var moveTarget = -1;
var moveTargetRobot, moveTargetWaypoint;

//properties
var fieldWidthIn = 143.04;
var fieldHeightIn = 143.04;
var robotWidthIn = 39;
var robotCenterIn = 19;

var ratio = 1;

var splines = [];
var samples = 5;

var toolBarWidth = 100;
var fieldWidthPxl = 0;
var robots = [];
var ws;
var selectedWaypointIndex;
var selectedWaypoint;
var lastSelectedRobot;

var waypointSelected = false;

var length;

const MouseWaypointActions = {
    MOVE: "move",
    ROTATE: "rotate",
    NONE: "none"
};

var mouseWaypointAction = MouseWaypointActions.NONE;

function getTargetRobot() {
    var r = 20;
    var mX = px2inX(fieldMousePos.x);
    var mY = px2inY(fieldMousePos.y);
    var closestRobot = -1;
    var currentLeastDistance = r;
    for (var i = 0; i < robots.length; i++) {
        var distance = hypot(mX, mY, robots[i].x, robots[i].y);
        if (distance < currentLeastDistance) {
            closestRobot = i;
            currentLeastDistance = distance;
        }
    }
    return closestRobot;
}

function autonCreatorInit() {
    connectToRobot();
    splines = [];
    fieldImage.src = "images/field.png";
    robotImage.src = "images/robot.png";
    newRobot(0, 0, 0 , "startRobot");
    // newRobot(97, 100, 0 * (Math.PI / 180));
    newRobot(0, 75, 0, 0, "endRobot");
    // newRobot(-97, 168, 0 * (Math.PI / 180));
}

function newRobot(x, y, robotRotation, robotName) {
    var lastWaypoint;
    if (robots.length !== 0) {
        lastWaypoint = robots[robots.length - 1];
        x = (x === undefined) ? lastWaypoint.x + 15 : x;
        y = (y === undefined) ? lastWaypoint.y + 15 : y;
        robotRotation = (robotRotation === undefined) ? lastWaypoint.angle : robotRotation;
    } else {
        x = (x === undefined) ? 0 : x;
        y = (y === undefined) ? 0 : y;
        robotRotation = (robotRotation === undefined) ? 0 : robotRotation;
    }
    var newRobot = new Robot(x, y, robotRotation, robotName);
    robots.push(newRobot);
    if (lastWaypoint) {
        var newSpline = new Spline(lastWaypoint, newRobot);
        var lastSpline = splines.length > 0 ? splines[splines.length - 1].spline : undefined;
        if (lastSpline) {
            newSpline.startTheta = lastSpline.endTheta;
        }
        splines.push({spline: newSpline, samples: 7, length: 0});
    }
}

function removeRobot() {
    if (robots.length > 2) {
        if (waypointSelected) {
            robots.splice(selectedWaypointIndex, 1);
            if(robots.length === selectedWaypointIndex) {
                splines.splice(selectedWaypointIndex - 1, 1);
            }  else if (selectedWaypointIndex === 0) {
                splines.splice(selectedWaypointIndex, 1);
            } else {
                splines.splice(selectedWaypointIndex, 1);
                var newSpline = new Spline(robots[selectedWaypointIndex - 1], robots[selectedWaypointIndex]);
                newSpline.startTheta = robots[selectedWaypointIndex - 1].angle;
                newSpline.endTheta = robots[selectedWaypointIndex].angle;
                splines[selectedWaypointIndex - 1].spline = newSpline;
            }
            waypointSelected = false;
        } else {
            robots.pop();
            splines.pop();
        }
    }
}

function autonCreatorDataLoop() {
    fieldWidthPxl = windowWidth - toolBarWidth - 12;
    ratio = fieldWidthPxl / fieldWidthIn;


    if (fieldMouseRising.l && waypointSelected && getTargetRobot() === selectedWaypointIndex) {
        mouseWaypointAction = MouseWaypointActions.MOVE;
    } else if (fieldMouseRising.r && waypointSelected && getTargetRobot() === selectedWaypointIndex) {
        mouseWaypointAction = MouseWaypointActions.ROTATE;
    } else if(fieldMouseRising.l) {
        var selectedIndex = getTargetRobot();
        if (selectedIndex >= 0) {
            //Select a robot
            selectedWaypointIndex = selectedIndex;
            waypointSelected = true;
        }
        else {
            //Deselect robot
            selectedWaypointIndex = undefined;
            waypointSelected = false;
        }
    } else if (fieldMouseFalling.l || fieldMouseFalling.r) {
        mouseWaypointAction = MouseWaypointActions.NONE;
    }



    selectedWaypoint = robots[selectedWaypointIndex];

    // update data
    let mousePosX = px2inX(fieldMousePos.x);
    let mousePosY = px2inY(fieldMousePos.y);

    switch(mouseWaypointAction) {
        case MouseWaypointActions.MOVE:
            selectedWaypoint.x = mousePosX;
            selectedWaypoint.y = mousePosY;
            fieldCanvas.style.cursor = cursors.move;
            break;
        case MouseWaypointActions.ROTATE:
            var angle = toDegrees(Math.atan2((mousePosX - selectedWaypoint.x), (mousePosY - selectedWaypoint.y)));

            if (fieldKeyboard.control) {
                angle = Math.round(angle / 15) * 15;
            }
            // adjust robot angle
            selectedWaypoint.angle = angle;

            var leftSpline = selectedWaypointIndex === 0 ? undefined : splines[selectedWaypointIndex - 1];
            if (leftSpline) {
                leftSpline.spline.endTheta = angle;
            }
            var rightSpline = selectedWaypointIndex === splines.length ? undefined : splines[selectedWaypointIndex];
            if (rightSpline) {
                rightSpline.spline.startTheta = angle;
            }

            fieldCanvas.style.cursor = cursors.crosshair;
            break;
        case MouseWaypointActions.NONE:
            fieldCanvas.style.cursor = cursors.default;
            break;
    }
}

function nameRobot() {
    if (waypointSelected) {
        selectedWaypoint.name = prompt("Name the Robot");
    }
}

function autonCreatorDrawLoop() {
    var robotWidthPxl = robotWidthIn * ratio;
    var robotHeightPxl = robotWidthPxl * (robotImage.height / robotImage.width);
    var robotCenterPxl = robotCenterIn * ratio;
    var fieldHeightPxl = fieldHeightIn * ratio;

    fieldContext.canvas.width = fieldWidthPxl;
    fieldContext.canvas.height = fieldHeightPxl;

    document.getElementById("windowDiv").style.width = fieldWidthPxl + 12 + "px";
    document.getElementById("windowDiv").style.height = (windowHeight - 32) + "px";

    creatorToolbar.style.width = toolBarWidth + "px";
    creatorToolbar.style.height = (windowHeight) + "px";

    fieldContext.drawImage(fieldImage, 0, 0, fieldWidthPxl, fieldHeightPxl);

    // draw
    if(waypointSelected) {
        document.getElementById("statusBarXY").innerText = "X: " + selectedWaypoint.x.toFixed(1)
            + " Y: " + selectedWaypoint.y.toFixed(1) + " Rot: " + selectedWaypoint.angle.toFixed(2)
            + " Path Angle: " + selectedWaypoint.angle.toFixed(2) + " Name: " + selectedWaypoint.name;
    } else {
        document.getElementById("statusBarXY").innerText = "X: " + px2inX(fieldMousePos.x).toFixed(1)
            + " Y: " + px2inY(fieldMousePos.y).toFixed(1);
    }

    if(mouseWaypointAction === MouseWaypointActions.ROTATE) {
        fieldContext.fillStyle = "#ffffff";
        fieldContext.fillText((selectedWaypoint.angle.toFixed(1) + "\xB0"), fieldMousePos.x + 8,
            fieldMousePos.y - 8);
    }


    for (var i in robots) {
        var robotPosXPxl = in2pxX(robots[i].x);
        var robotPosYPxl = in2pxY(robots[i].y);
        var robotRotation = robots[i].angle;
        fieldContext.save();
        fieldContext.translate(Math.floor(robotPosXPxl), Math.floor(robotPosYPxl));
        fieldContext.rotate(toRadians(robotRotation));
        if (robots[i] === selectedWaypoint) {
            fieldContext.shadowBlur = 10;
            fieldContext.shadowColor = 'white';
        }
        fieldContext.drawImage(robotImage, Math.floor(-robotWidthPxl * .5), Math.floor(-robotCenterPxl), Math.floor(robotWidthPxl), Math.floor(robotHeightPxl));
        fieldContext.restore();
    }

    //Draw spline
    var a = splines[0].spline.coord(0);
    fieldContext.moveTo(in2pxX(a.x), in2pxY(a.y));
    fieldContext.beginPath();
    fieldContext.lineWidth = Math.floor(windowWidth * .005);
    fieldContext.strokeStyle = "#00ffff";
    for (var s in splines) {
        let currentSpline = splines[s].spline;
        var inc = 1 / splines[s].samples;
        splines[s].length = hypot(currentSpline.coord(0).x, currentSpline.coord(0).y,
            currentSpline.coord(inc).x, currentSpline.coord(inc).y);

        if(mouseWaypointAction !== MouseWaypointActions.NONE && (parseInt(s) === selectedWaypointIndex || parseInt(s) === selectedWaypointIndex - 1)) {
            splines[s].samples = 7;
            inc = 1 / splines[s].samples;
        } else {
            while (splines[s].length > 6) { //Increase samples until <6 in between first and second points
                splines[s].samples++;
                inc = 1 / splines[s].samples;
                splines[s].length = hypot(currentSpline.coord(0).x, currentSpline.coord(0).y,
                    currentSpline.coord(inc).x, currentSpline.coord(inc).y);
            }
        }

        var c = currentSpline.coord(0);
        fieldContext.moveTo(in2pxX(c.x), in2pxY(c.y));

        for (var i = inc; i < 1; i += inc) {
            c = currentSpline.coord(i);
            fieldContext.lineTo(Math.floor(in2pxX(c.x)), Math.floor(in2pxY(c.y)));
        }
        c = currentSpline.coord(1);
        fieldContext.lineTo(Math.floor(in2pxX(c.x)), Math.floor(in2pxY(c.y)));
    }

    fieldContext.stroke();
}

function angleBetweenRobot(a, b) {
    //a += (a < 0 ? 2 * Math.PI : 0);
    //b += (b < 0 ? 2 * Math.PI : 0);
    var dif1 = b - a;
    var dif2 = a - b;
    dif1 += (dif1 < 0 ? 2 * Math.PI : 0);
    dif2 += (dif2 < 0 ? 2 * Math.PI : 0);
    var dif = (Math.abs(dif2) < Math.abs(dif1) ? -dif2 : dif1);
    if (dif > Math.PI) {
        dif = dif - 2 * Math.PI;
    }
    return dif / Math.abs(samples);
}

function pathAsText(pretty) {
    var output = [];
    var inc = 1 / samples;
    for (var s = 0; s < splines.length; s++) {
        var c = splines[s].spline.coord(0);
        var waypoint = {
            "name": robots[s].name,
            "x": Number(c.x.toFixed(2)),
            "y": Number(c.y.toFixed(2)),
            "theta": Number(robots[s].angle.toFixed(2)),
            "pathAngle": Number(splines[s].spline.startTheta.toFixed(2))
        };
        var delta = angleBetweenRobot(robots[s].angle, robots[s + 1].angle);
        var intermediateAngle = robots[s].angle;
        output.push(waypoint);
        for (var i = inc; i < 1; i += inc) {
            intermediateAngle += delta;
            c = splines[s].spline.coord(i);
            var waypoint = {
                "name": "point",
                "x": Number(c.x.toFixed(2)),
                "y": Number(c.y.toFixed(2)),
                "theta": Number(intermediateAngle.toFixed(2))
            };
            output.push(waypoint);
        }
    }
    c = splines[splines.length - 1].spline.coord(1);
    var waypoint = {
        "name": robots[s].name,
        "x": Number(c.x.toFixed(2)),
        "y": Number(c.y.toFixed(2)),
        "theta": Number(robots[robots.length - 1].angle.toFixed(2)),
        "pathAngle": Number(splines[splines.length - 1].spline.endTheta.toFixed(2))
    };
    output.push(waypoint);
    console.log("Path: ");
    console.log(output);
    if (pretty === true) {
        return JSON.stringify(output, null, 4);
    } else {
        return JSON.stringify(output);
    }
}

function exportPath() {
    var file = new File([pathAsText(true)], "path.json", { type: "text/plain;charset=utf-8" });
    saveAs(file);
}

function sendPath() {
    ws.send(pathAsText());
}

function loadPath(path) {
    var tmpObj = JSON.parse(path);
    robots = [];
    splines = [];
    rotTarget = -1;
    moveTarget = -1;
    samples = 5;
    for (var i = 0; i < tmpObj.length; i++) {
        var tmpItem = tmpObj[i];
        if (tmpObj[i].name !== "point") {
            newRobot(tmpItem.x, tmpItem.y, tmpItem.theta, tmpItem.pathAngle, tmpItem.name);
        }
    }
    if (robots.length > 1) {
        splines[0].spline.startTheta = tmpObj[0].pathAngle;
    }
}

function connectedToRobot() {
    if(ws) {
        return ws.readyState === ws.OPEN;
    } else {
        return false;
    }

}

function connectToRobot() {
    if (!location.protocol === 'https:') {
        ws = new WebSocket('ws://' + document.location.host + '/path');
        if(!(ws.readyState === ws.CONNECTING || ws.readyState === ws.OPEN)) {
            console.log("Can not connect to: " + 'ws://' + document.location.host + '/path');
            ws = new WebSocket('ws://10.20.62.2:5810/path');
        }
    }
}

function px2inX(px) {
   return -1 * ((fieldWidthIn / 2) - (px / ratio));
}

function in2pxX(fieldInches) {
   return (ratio * ((fieldWidthIn / 2) + fieldInches));
}

function px2inY(px) {
   return fieldHeightIn - (px / ratio);
}

function in2pxY(fieldInches) {
   return -1 * (fieldInches - fieldHeightIn) * ratio;
}

function setSideStartingPos() {
    robots = [];
    splines = [];
    newRobot(97, 19, (-Math.PI / 2), 0, "sideStartWaypoint");
    newRobot(0, 80, 0, 0);
}

function setCenterStartingPos() {
    robots = [];
    splines = [];
    newRobot(8, 19, 0, 0, "centerStartWaypoint");
    newRobot(0, 80, 0, 0);
}

function setScaleStartingPos() {
    robots = [];
    splines = [];
    newRobot(104.5, 310.99, 0, 0, "scaleWaypoint");
    newRobot(0, 80, 0, 0);
}