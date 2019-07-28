var fieldImage = new Image();
var robotImage = new Image();

//properties
var fieldWidthIn = 143.04;
var robotWidthIn = 15;
var robotCenterIn = 6;

var ratio = 1;

var toolBarWidth = 100;
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

let paths = [];

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

function newWaypoint() {
    path.newWaypoint();
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
    let firstPath = new Path("First Path");
    addPath(firstPath);
    let testPath = new Path("Test Path");
    testPath.newWaypoint(20, 10, 0, "start");
    testPath.newWaypoint(45, 30, 0, "mid");
    testPath.newWaypoint(30, 70, 0, "end");
    addPath(testPath);
    fieldImage.src = "images/field.png";
    robotImage.src = "images/robot.png";
    firstPath.newWaypoint(0, 7.5, 0 , "startWaypoint");
    // newWaypoint(97, 100, 0 * (Math.PI / 180));
    firstPath.newWaypoint(0, 71, 0, "endWaypoint");
    // newWaypoint(-97, 168, 0 * (Math.PI / 180));
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
            let angle = toDegrees(Math.atan2((mousePos.x - selectedWaypoint.x), (mousePos.y - selectedWaypoint.y)));

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
        fieldContext.fillText((selectedWaypoint.angle.toFixed(1) + "\xB0"), fieldMousePos.x + 8,
            fieldMousePos.y - 8);
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
        fieldContext.strokeStyle = "#00ffff";

        let pointInPixels = inchesToPixels(points[0]);
        fieldContext.moveTo(pointInPixels.x, pointInPixels.y);
        fieldContext.beginPath();

        for (let point of points) {
            let pointInPixels = inchesToPixels(point);
            fieldContext.lineTo(pointInPixels.x, pointInPixels.y);
        }

        fieldContext.stroke();
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
    let loadedPaths = [];
    for (let path of json.paths) {
        loadedPaths.push(Path.fromJson(path));
    }
    paths = loadedPaths;
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