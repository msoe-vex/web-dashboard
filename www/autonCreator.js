const fieldImage = new Image();
const robotImage = new Image();

//properties
const fieldWidthIn = 143.04;
let robotWidthIn = 14.5;
let robotCenterIn = 6;

let ratio = 1;

let ws;
let selectedWaypointIndex;
let selectedWaypoint;

let waypointSelected = false;

const WaypointAction = {
    MOVE: 1,
    ROTATE: 2,
    SPLINE_ROTATE: 3,
    NONE: 4
};

let path = new Path();
let paths = [];
let sharedWaypoints = [];

let selectedPath = -1;
let lastSelectedPath = -1;

let waypointAction = WaypointAction.NONE;

function addPath(path) {
    paths.push(path);
    $('#pathSelector').append($('<option/>', {
        value: paths.length - 1
    }).text(path.name));
}

$('#pathSelector').on('change', function() {
    selectedPath = this.value;
});

function newPath() {
    let name = prompt("Name the Path");
    let path = new Path(name, 100, 50, 6, True);
    path.newWaypoint(20, 10, 0, 0, "start");
    path.newWaypoint(30, 70, 0, 0, "end");
    addPath(path);
}

function setSwerve() {
    if (!path.getIsTank()) {
        path.setIsTank(true);
        $("#swerveTankToggle").text("Tank Drive");
    } else {
        path.setIsTank(false);
        $("#swerveTankToggle").text("Swerve Drive");
    }
}

function newWaypoint(x, y, angle, name, shared) {
    path.newWaypoint(x, y, angle, angle, name, shared);
}

function newSharedWaypoint() {
    let newWaypoint = path.newWaypoint(undefined, undefined, undefined, undefined, prompt("Name"), true);
    sharedWaypoints.push(newWaypoint)
}

function removeWaypoint() {
    if (path.getNumWaypoints() > 0) {
        if (waypointSelected) {
            path.removeWaypoint(selectedWaypointIndex);
            if (path.getNumWaypoints() === 0) {
                selectedWaypointIndex = -1;
                waypointSelected = false;
            } else if(path.getNumWaypoints() === selectedWaypointIndex) {
                selectedWaypointIndex--;
            }
        } else {
            path.removeWaypoint();
        }
    }
}

function autonCreatorInit() {
    connectToRobot();
    let firstPath = new Path("TestPath", 100, 50, 6); //TODO: Make it so these can be changed on the GUI, also save them in the json output so they can be loaded later
    addPath(firstPath);
    fieldImage.src = "images/field.png";
    robotImage.src = "images/robot.png";
    firstPath.newWaypoint(0, 7.5, 0, 0, "startWaypoint");
    firstPath.newWaypoint(0, 71, 0, 0, "endWaypoint");
    selectedPath = 0;
}

function autonCreatorDataLoop() {
    let fieldHeightPxl = windowHeight;

    ratio = fieldHeightPxl / fieldWidthIn * (fieldImage.height / fieldImage.width);

    if(lastSelectedPath !== selectedPath) {
        path = paths[selectedPath];
        selectedWaypointIndex = -1;
        waypointSelected = false;
        waypointAction = WaypointAction.NONE;
    }

    lastSelectedPath = selectedPath;

    if (fieldMouseRising.l && waypointSelected && path.getClosestWaypoint(fieldMousePos, robotWidthIn/2) === selectedWaypointIndex) {
        waypointAction = WaypointAction.MOVE;
    } else if (fieldMouseRising.r && waypointSelected && path.getClosestWaypoint(fieldMousePos, robotWidthIn/2) === selectedWaypointIndex) {
        waypointAction = WaypointAction.ROTATE;
    } else if(fieldMouseRising.l) {
        let selectedIndex = path.getClosestWaypoint(fieldMousePos, robotWidthIn/2);
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
        waypointAction = WaypointAction.NONE;
    } else if (fieldMouseFalling.l || fieldMouseFalling.r || !waypointSelected) {
        waypointAction = WaypointAction.NONE;
    }

    if (waypointSelected) {
        selectedWaypoint = path.getWaypoint(selectedWaypointIndex);
    } else {
        selectedWaypoint = undefined;
    }

    // update data
    let mousePos = pixelsToInches(fieldMousePos);

    switch(waypointAction) {
        case WaypointAction.MOVE:
            selectedWaypoint.x = mousePos.x;
            selectedWaypoint.y = mousePos.y;
            fieldCanvas.style.cursor = cursors.move;
            break;
        case WaypointAction.ROTATE:
            let angle1 = toDegrees(Math.atan2((mousePos.x - selectedWaypoint.x), (mousePos.y - selectedWaypoint.y)));

            if (fieldKeyboard.control) {
                angle1 = Math.round(angle1 / 15) * 15;
            }

            // Move spline only
            if (fieldKeyboard.shift && !path.getIsTank()) {
                // Swerve - Update spline only with right click shift
                selectedWaypoint.spline_angle = angle1;
            } else if (!path.getIsTank()) {
                // Swerve - Update Robot only with right click
                selectedWaypoint.angle = angle1;
            } else {
                // Tank - Update both spine and robot angles
                selectedWaypoint.angle = angle1;
                selectedWaypoint.spline_angle = angle1;
            }
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

function perc2color(perc) {
    perc *= 100;
    let r, g, b = 0;
    if(perc < 50) {
        r = 255;
        g = Math.round(5.1 * perc);
    }
    else {
        g = 255;
        r = Math.round(510 - 5.10 * perc);
    }
    let h = r * 0x10000 + g * 0x100 + b * 0x1;
    return '#' + ('000000' + h.toString(16)).slice(-6);
}

function autonCreatorDrawLoop() {
    let robotWidthPxl = robotWidthIn * ratio;
    let robotHeightPxl = robotWidthPxl * (robotImage.height / robotImage.width);
    let robotCenterPxl = robotCenterIn * ratio;
    let fieldWidthPxl = fieldWidthIn * ratio;
    let fieldHeightPxl = fieldWidthPxl * (fieldImage.height / fieldImage.width);

    fieldContext.canvas.width = fieldWidthPxl;
    fieldContext.canvas.height = fieldHeightPxl;

    let smallScreen = parseInt(windowWidth) < fieldWidthPxl;
    $("#windowDiv").toggleClass("justify-content-center", !smallScreen).toggleClass("justify-content-start", smallScreen);

    fieldContext.drawImage(fieldImage,0, 0, fieldWidthPxl, fieldHeightPxl);

    if(waypointSelected) {
        // document.getElementById("statusBarXY").innerText = "X: " + selectedWaypoint.x.toFixed(1)
        //     + " Y: " + selectedWaypoint.y.toFixed(1) + " Angle: " + selectedWaypoint.angle.toFixed(2)
        //     + " Name: " + selectedWaypoint.name;
    } else {
        let mousePos = pixelsToInches(fieldMousePos);
        // document.getElementById("statusBarXY").innerText = "X: " + mousePos.x.toFixed(1)
        //     + " Y: " + mousePos.y.toFixed(1);
    }

    if(waypointAction === WaypointAction.ROTATE) {
        fieldContext.fillStyle = "#ffffff";
        if (fieldKeyboard.shift) {
            fieldContext.fillText((selectedWaypoint.spline_angle.toFixed(1) + "\xB0"), fieldMousePos.x + 8,
                fieldMousePos.y - 8);
        } else {
            fieldContext.fillText((selectedWaypoint.angle.toFixed(1) + "\xB0"), fieldMousePos.x + 8,
                fieldMousePos.y - 8);
        }
    }

    if (path.getNumWaypoints() > 0) {
        // Draw waypoints
        let waypoints = path.getWaypoints();

        for (let i in waypoints) {
            let waypoint = waypoints[i];
            let waypointPos = inchesToPixels(new point(waypoint.x, waypoint.y));
            let waypointRotation = waypoint.angle;
            fieldContext.save();
            fieldContext.translate(waypointPos.x, waypointPos.y);
            fieldContext.rotate(toRadians(waypointRotation + 90));

            // Add highlight to currently selected waypoint
            if (parseInt(i) === selectedWaypointIndex) {
                fieldContext.shadowBlur = 10;
                fieldContext.shadowColor = 'white';
            }

            fieldContext.drawImage(robotImage, Math.floor(-robotWidthPxl * .5), Math.floor(-robotCenterPxl), Math.floor(robotWidthPxl), Math.floor(robotHeightPxl));
            fieldContext.restore();
        }
    }

    // Draw spline
    let points;
    if (waypointAction !== WaypointAction.NONE) {
        points = path.getPoints(selectedWaypointIndex);
    } else {
        points = path.getPoints();
    }

    if (points.length !== 0) {
        fieldContext.lineWidth = Math.floor(robotWidthPxl * .05);

        for (let i = 1; i < points.length; i++) {
            let lastPointInPixels = inchesToPixels(points[i-1]);
            let currentPointInPixels = inchesToPixels(points[i]);
            fieldContext.beginPath();
            fieldContext.strokeStyle = perc2color(points[i].speed/path.getMaxVel());
            fieldContext.moveTo(lastPointInPixels.x, lastPointInPixels.y);
            fieldContext.lineTo(currentPointInPixels.x, currentPointInPixels.y);
            fieldContext.stroke();
        }
    }

    // Draw ghost of other path if the changing point is shared
    if (waypointAction !== WaypointAction.NONE && selectedWaypoint.shared && waypointSelected) {
        for (let i in paths) {
            if (i !== selectedPath) {
                let otherPath = paths[i];
                let otherWaypointIndex = otherPath.getWaypointIndexByName(selectedWaypoint.name);

                if (otherWaypointIndex !== undefined) {
                    let otherWaypoint = otherPath.getWaypoint(otherWaypointIndex);

                    otherWaypoint.x = selectedWaypoint.x;
                    otherWaypoint.y = selectedWaypoint.y;
                    otherWaypoint.angle = selectedWaypoint.angle;

                    if (otherPath.getNumWaypoints() > 0) {
                        // Draw waypoints
                        let waypoints = otherPath.getWaypoints();

                        for (let waypoint of waypoints) {
                            let waypointPos = inchesToPixels(new point(waypoint.x, waypoint.y));
                            let waypointRotation = waypoint.angle;
                            fieldContext.save();
                            fieldContext.translate(waypointPos.x, waypointPos.y);
                            fieldContext.rotate(toRadians(waypointRotation + 90));
                            fieldContext.globalAlpha = 0.5;
                            fieldContext.drawImage(robotImage, Math.floor(-robotWidthPxl * .5), Math.floor(-robotCenterPxl), Math.floor(robotWidthPxl), Math.floor(robotHeightPxl));
                            fieldContext.restore();
                        }
                    }

                    // Draw spline
                    let points = otherPath.getPoints(otherWaypointIndex);

                    fieldContext.save();

                    if (points.length !== 0) {
                        fieldContext.lineWidth = Math.floor(robotWidthPxl * .05);
                        fieldContext.strokeStyle = "#d9d9d9";
                        fieldContext.globalAlpha = 0.5;

                        let pointInPixels = inchesToPixels(points[0]);
                        fieldContext.moveTo(pointInPixels.x, pointInPixels.y);
                        fieldContext.beginPath();

                        for (let point of points) {
                            let pointInPixels = inchesToPixels(point);
                            fieldContext.lineTo(pointInPixels.x, pointInPixels.y);
                        }

                        fieldContext.stroke();
                    }
                    fieldContext.restore();
                }
            }
        }
    }
}

function pathAsText(pretty) {
    let output = {
        sharedWaypoints: [],
        paths: paths
    };
    let json = JSON.stringify(output, null, 4);
    console.log("Path: ");
    console.log(json);
    return json;
}

function exportPath() {
    var file = new File([pathAsText(true)], "path.json", { type: "text/plain;charset=utf-8" });
    saveAs(file);
}

function sendPath() {
    ws.send(pathAsText());
}

function loadPath(path) {
    let json = JSON.parse(path);
    paths = [];
    $('#pathSelector').empty();
    for (let path of json.paths) {
        addPath(Path.fromJson(path));
    }
    console.log("Loaded paths: ");
    console.log(paths);
    lastSelectedPath = -1;
}

function connectedToRobot() {
    if(ws) {
        return ws.readyState === ws.OPEN;
    } else {
        return false;
    }

}

function connectToRobot() {
    if (location.protocol !== 'https:') {
        ws = new WebSocket('ws://' + document.location.host + '/path');
        if(!(ws.readyState === ws.CONNECTING || ws.readyState === ws.OPEN)) {
            console.log("Can not connect to: " + 'ws://' + document.location.host + '/path');
            ws = new WebSocket('ws://10.20.62.2:5810/path');
        }
    }
}

function inchesToPixels(pointInInches) {
    function in2pxX(fieldInches) {
        return (fieldInches + (fieldWidthIn / 2)) * ratio;
    }

    function in2pxY(fieldInches) {
        return fieldInches * ratio;
    }

    return new point(in2pxY(pointInInches.y), in2pxX(pointInInches.x));
}

function pixelsToInches(pointInPixels) {
    function px2inY(px) {
        return px / ratio;
    }

    function px2inX(px) {
        return (px / ratio) - (fieldWidthIn / 2);
    }

    return new point(px2inX(pointInPixels.y), px2inY(pointInPixels.x));
}