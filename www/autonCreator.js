var fieldImage = new Image();
var robotImage = new Image();

var rotTarget = -1;
var moveTarget = -1;

//properties
var fieldWidthIn = 143.04;
var fieldHeightIn = 143.04;
var robotWidthIn = 15;
var robotCenterIn = 6;

var ratio = 1;

var splines = [];
var samples = 5;

var toolBarWidth = 100;
var fieldWidthPxl = 0;
var waypoints = [];
var ws;
var selectedWaypointIndex;
var selectedWaypoint;

var waypointSelected = false;

const WaypointAction = {
    MOVE: "move",
    ROTATE: "rotate",
    NONE: "none"
};

let path = new Path();

let waypointAction = WaypointAction.NONE;

function newWaypoint() {
    path.newWaypoint();
}

function removeWaypoint() {
    if (waypointSelected) {
        path.removeWaypoint(selectedWaypointIndex);
    } else {
        path.removeWaypoint();
    }
}

function autonCreatorInit() {
    connectToRobot();
    fieldImage.src = "images/field.png";
    robotImage.src = "images/robot.png";
    path.newWaypoint(0, 0, 0 , "startWaypoint");
    // newWaypoint(97, 100, 0 * (Math.PI / 180));
    path.newWaypoint(0, 75, 0, 0, "endWaypoint");
    // newWaypoint(-97, 168, 0 * (Math.PI / 180));
}

function autonCreatorDataLoop() {
    fieldWidthPxl = windowWidth - toolBarWidth - 12;
    ratio = fieldWidthPxl / fieldWidthIn;


    if (fieldMouseRising.l && waypointSelected && path.getClosestWaypoint(fieldMousePos, 15) === selectedWaypointIndex) {
        waypointAction = WaypointAction.MOVE;
    } else if (fieldMouseRising.r && waypointSelected && path.getClosestWaypoint(fieldMousePos, 15) === selectedWaypointIndex) {
        waypointAction = WaypointAction.ROTATE;
    } else if(fieldMouseRising.l) {
        var selectedIndex = path.getClosestWaypoint(fieldMousePos, 15);
        if (selectedIndex >= 0) {
            //Select a waypoint
            selectedWaypointIndex = selectedIndex;
            waypointSelected = true;
        }
        else {
            //Deselect waypoint
            selectedWaypointIndex = undefined;
            waypointSelected = false;
        }
    } else if (fieldMouseFalling.l || fieldMouseFalling.r) {
        waypointAction = WaypointAction.NONE;
    }

    if (waypointSelected) {
        selectedWaypoint = path.getWaypoint(selectedWaypointIndex);
    } else {
        selectedWaypoint = undefined;
    }

    // update data
    let mousePosX = px2inX(fieldMousePos.x);
    let mousePosY = px2inY(fieldMousePos.y);

    switch(waypointAction) {
        case WaypointAction.MOVE:
            selectedWaypoint.x = mousePosX;
            selectedWaypoint.y = mousePosY;
            fieldCanvas.style.cursor = cursors.move;
            break;
        case WaypointAction.ROTATE:
            let angle = toDegrees(Math.atan2((mousePosX - selectedWaypoint.x), (mousePosY - selectedWaypoint.y)));

            if (fieldKeyboard.control) {
                angle = Math.round(angle / 15) * 15;
            }
            // adjust waypoint angle
            selectedWaypoint.angle = angle;

            fieldCanvas.style.cursor = cursors.crosshair;
            break;
        case WaypointAction.NONE:
            fieldCanvas.style.cursor = cursors.default;
            break;
    }
}

function nameRobot() {
    if (waypointSelected) {
        selectedWaypoint.name = prompt("Name the Waypoint");
    }
}

function autonCreatorDrawLoop() {
    let robotWidthPxl = robotWidthIn * ratio;
    let robotHeightPxl = robotWidthPxl * (robotImage.height / robotImage.width);
    let robotCenterPxl = robotCenterIn * ratio;
    let fieldHeightPxl = fieldHeightIn * ratio;

    fieldContext.canvas.width = fieldWidthPxl;
    fieldContext.canvas.height = fieldHeightPxl;

    document.getElementById("windowDiv").style.width = fieldWidthPxl + 12 + "px";
    document.getElementById("windowDiv").style.height = (windowHeight - 32) + "px";

    creatorToolbar.style.width = toolBarWidth + "px";
    creatorToolbar.style.height = (windowHeight) + "px";

    fieldContext.drawImage(fieldImage,0, 0, fieldWidthPxl, fieldHeightPxl);

    if(waypointSelected) {
        document.getElementById("statusBarXY").innerText = "X: " + selectedWaypoint.x.toFixed(1)
            + " Y: " + selectedWaypoint.y.toFixed(1) + " Angle: " + selectedWaypoint.angle.toFixed(2)
            + " Name: " + selectedWaypoint.name;
    } else {
        document.getElementById("statusBarXY").innerText = "X: " + px2inX(fieldMousePos.x).toFixed(1)
            + " Y: " + px2inY(fieldMousePos.y).toFixed(1);
    }

    if(waypointAction === WaypointAction.ROTATE) {
        fieldContext.fillStyle = "#ffffff";
        fieldContext.fillText((selectedWaypoint.angle.toFixed(1) + "\xB0"), fieldMousePos.x + 8,
            fieldMousePos.y - 8);
    }

    let waypoints = path.getWaypoints();

    for (let i in waypoints) {
        let waypoint = waypoints[i];
        let waypointPosXPxl = in2pxX(waypoint.x);
        let waypointPosYPxl = in2pxY(waypoint.y);
        let waypointRotation = waypoint.angle;
        fieldContext.save();
        fieldContext.translate(Math.floor(waypointPosXPxl), Math.floor(waypointPosYPxl));
        fieldContext.rotate(toRadians(waypointRotation));
        if (parseInt(i) === selectedWaypointIndex) {
            fieldContext.shadowBlur = 10;
            fieldContext.shadowColor = 'white';
        }
        fieldContext.drawImage(robotImage, Math.floor(-robotWidthPxl * .5), Math.floor(-robotCenterPxl), Math.floor(robotWidthPxl), Math.floor(robotHeightPxl));
        fieldContext.restore();
    }

    //Draw spline
    let points;
    if (waypointAction !== WaypointAction.NONE) {
        points = path.getPoints(selectedWaypointIndex);
    } else {
        points = path.getPoints();
    }

    fieldContext.lineWidth = Math.floor(windowWidth * .005);
    fieldContext.strokeStyle = "#00ffff";

    fieldContext.moveTo(Math.floor(in2pxX(points[0].x)), Math.floor(in2pxY(points[0].y)));
    fieldContext.beginPath();

    for (let point of points) {
        fieldContext.lineTo(Math.floor(in2pxX(point.x)), Math.floor(in2pxY(point.y)));
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
        var c = splines[s].spline.get(0);
        var waypoint = {
            "name": waypoints[s].name,
            "x": Number(c.x.toFixed(2)),
            "y": Number(c.y.toFixed(2)),
            "theta": Number(waypoints[s].angle.toFixed(2)),
            "pathAngle": Number(splines[s].spline.startAngle.toFixed(2))
        };
        var delta = angleBetweenRobot(waypoints[s].angle, waypoints[s + 1].angle);
        var intermediateAngle = waypoints[s].angle;
        output.push(waypoint);
        for (var i = inc; i < 1; i += inc) {
            intermediateAngle += delta;
            c = splines[s].spline.get(i);
            var waypoint = {
                "name": "point",
                "x": Number(c.x.toFixed(2)),
                "y": Number(c.y.toFixed(2)),
                "theta": Number(intermediateAngle.toFixed(2))
            };
            output.push(waypoint);
        }
    }
    c = splines[splines.length - 1].spline.get(1);
    var waypoint = {
        "name": waypoints[s].name,
        "x": Number(c.x.toFixed(2)),
        "y": Number(c.y.toFixed(2)),
        "theta": Number(waypoints[waypoints.length - 1].angle.toFixed(2)),
        "pathAngle": Number(splines[splines.length - 1].spline.endAngle.toFixed(2))
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
    waypoints = [];
    splines = [];
    rotTarget = -1;
    moveTarget = -1;
    samples = 5;
    for (var i = 0; i < tmpObj.length; i++) {
        var tmpItem = tmpObj[i];
        if (tmpObj[i].name !== "point") {
            newWaypoint(tmpItem.x, tmpItem.y, tmpItem.theta, tmpItem.pathAngle, tmpItem.name);
        }
    }
    if (waypoints.length > 1) {
        splines[0].spline.startAngle = tmpObj[0].pathAngle;
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

function inchesToPixels(pointInInches) {
    pointInInches.x
}

function pixelsToInches(pointInPixels) {

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
    newWaypoint(97, 19, (-Math.PI / 2), 0, "sideStartWaypoint");
    newWaypoint(0, 80, 0, 0);
}

function setCenterStartingPos() {
    newWaypoint(8, 19, 0, 0, "centerStartWaypoint");
    newWaypoint(0, 80, 0, 0);
}

function setScaleStartingPos() {
    newWaypoint(104.5, 310.99, 0, 0, "scaleWaypoint");
    newWaypoint(0, 80, 0, 0);
}