const fieldImage = new Image();
const robotImage = new Image();

//properties
const fieldWidthIn = 143.04;
let robotWidthIn = 14.5;
let robotCenterIn = robotWidthIn/2;

let maxVel = 50;
let maxAccel = 100;
let k = 3;

let ratio = 1;

let ws;
let selectedWaypointIndex;
let selectedWaypoint;

let waypointSelected = false;

const WaypointAction = {
    MOVE: 1,
    ROTATE: 2,
    NONE: 3
};

let prevWaypointAction = WaypointAction.NONE;

let path = null;
let paths = [];
let robotOpacity = localStorage.hasOwnProperty("robotOpacity") ? localStorage.getItem("robotOpacity") : 1.0;
let rotationBall = localStorage.hasOwnProperty("toggleRotationBall") ? localStorage.getItem("toggleRotationBall") : true;
let pathSelector = document.getElementById("pathSelector");
let sharedWaypoints = [];
let robotWidth = 0;
let robotLength = 0;

// Twenty Four Pixel Coefficient Addition
let TFPCA = 0; 

let robotName = "";
let isTank = true;
let savedIsTank = isTank;

let selectedPath = -1;
let lastSelectedPath = -1;

let historyStack = [];
let tempMousePos = null;
let tempSelected = null;

let waypointAction = WaypointAction.NONE;

fieldKeyboard.undoWait = false;
fieldKeyboard.redoWait = false;

/**
 * Update robot's opacity when slider is changed
 */
function changeOpacity() {
    robotOpacity = document.getElementById("opacityRange").value/100;
    localStorage.setItem("robotOpacity", robotOpacity);
}

/**
 * Toggle rotational ball when checkbox is changed
 */
function toggleRotationBall() {
    rotationBall = document.getElementById("rotationBallCheckbox").checked;
    localStorage.setItem("toggleRotationBall", rotationBall);
}

/**
 * Adds new path to the path selector and sets it as the selected path.
 * @param path
 */
function addPath(path) {
    paths.push(path);
    let index = paths.length - 1;
    $('#pathSelector').append($('<option/>', {
        value: index
    }).text(path.name).attr('selected', 'selected'));
    return index;
}

/**
 * Allows user to change the selected path
 */
$('#pathSelector').on('change', function () {
    selectedPath = this.value;
});

/**
 * Renames a path
 */
function renamePath() {
    let name = toCamelCase(prompt("New name for the path"));
    if (name != "" && name != null) {
        paths[selectedPath].name = name;
        pathSelector.options[pathSelector.selectedIndex].text = name;
    }
}

/**
 * Event listener to rename path name on right click
 */
pathSelector.addEventListener('contextmenu', function(ev) {
    ev.preventDefault();
    renamePath();
    return false;
}, false);

/**
 * Creates a new path
 */
function newPath() {
    let name = prompt("Name the path");
    if (name != "" && name != null) {
        let path = new Path(name, maxVel, maxAccel, k);
        path.newWaypoint(20, 10, 0, 0, "start", 0);
        path.newWaypoint(30, 70, 0, 0, "end", undefined);
        selectedPath = addPath(path);
    } else {
        // ask again
        newPath();
    }
}

/**
 * Switches the drive mode of all paths
 * Toggle button in the config menu
 */
function setSwerve() {
    if (isTank) {
        $("#swerveTankToggle").text("Swerve Drive");
    } else {
        $("#swerveTankToggle").text("Tank Drive");
    }
    isTank = !isTank;
}

/**
 * Creates a new waypoint in the current path
 * Called when the 'New Waypoint' button is pressed
 * @param x - starting x position
 * @param y - starting y position
 * @param angle - starting angle of robot
 * @param spline_angle - starting angle of spline
 * @param name - name of the waypoint
 * @param speed - speed of the waypoint
 * @param shared - true if waypoint is shared
 */
function newWaypoint(x, y, angle, spline_angle, name, speed, shared) {
    path.newWaypoint(x, y, angle, spline_angle, name, speed, shared, undefined, true);
}

/**
 * Creates a new shared waypoint
 * Called when the 'New Shared Waypoint' button is pressed
 */
function newSharedWaypoint() {
    // Creates new shared waypoint with button
    let name = prompt("Shared waypoint name");
    if (name !== null) {
        let newShared = path.newWaypoint(undefined, undefined, undefined, undefined, name, undefined, true);
        sharedWaypoints.push(newShared);
        newSharedButton(name);
        historyStack.push({"Action":"NewWaypoint", "Name":name})
    }
}

/**
 * Creates a new button for a shared waypoint
 * @param name - name of the new button
 */
function newSharedButton(name) {
    let buttonList = $("#waypointsList");
    let button = $("<button>" + name + "</button>");
    // Function runs if dynamically created shared waypoint button is pressed
    const clickShared = (name) => {
        let inPath = false;
        path.getWaypoints().forEach(function (point) {
            if (point.name === name && point.shared) {
                inPath = true;
            }
        })
        if (inPath === false) {
            sharedWaypoints.forEach(function (point) {
                if (name === point.name) {
                    path.newWaypoint(point.x, point.y, point.angle, point.spline_angle, name, undefined, true);
                }
            })
        }
    };
    button.attr("type", "button");
    button.attr("class", "sharedWaypoint btn btn-block btn-secondary");
    button.attr("data-trigger", "hover");
    button.attr("data-toggle", "popover");
    button.click(() => clickShared(name));
    buttonList.append(button);
}

/**
 * When a JSON file is added, loads in all of the shared waypoints.
 */
function loadSharedButtons() {
    sharedWaypoints.forEach(function (point) {
        newSharedButton(point.name);
    })
}

/**
 * Removes the currently selected waypoint.
 * Called when the 'Remove Waypoint' button is pressed.
 */
function removeWaypoint() {
    if (path.getNumWaypoints() > 0) {
        if (waypointSelected) {
            path.removeWaypoint(selectedWaypointIndex, true);

            if (path.getNumWaypoints() === 0) {
                selectedWaypointIndex = -1;
                waypointSelected = false;
            } else {
                // if index exceeds num waypoints, decrease index
                if (path.getNumWaypoints() === selectedWaypointIndex) {
                    selectedWaypointIndex--;
                }
                selectedWaypoint = path.getWaypoint(selectedWaypointIndex);
            }
        } else {
            path.removeWaypoint(undefined, true);
        }
    }
}

/**
 * Initialized the first path and images
 */
function autonCreatorInit() {
    //connectToRobot();
    let firstPath = new Path("TestPath", maxVel, maxAccel, k);
    addPath(firstPath);
    fieldImage.src = "images/field.png";
    robotImage.src = "images/robot.png";
    firstPath.newWaypoint(10, 7.5, 90, 90, "startWaypoint", 0);
    firstPath.newWaypoint(0, 71, 180, 90, "endWaypoint", undefined);
    selectedPath = 0;
    $("#x-value").keyup(function () {
        let x = this.value;
        if (!isNaN(x)) {
            const num = parseFloat(x);
            if (num >= -70 && num <= 70) {
                selectedWaypoint.x = num;
            }
        }
    });
    $("#y-value").keyup(function () {
        let y = this.value;
        if (!isNaN(y)) {
            const num = parseFloat(y);
            if (num >= 0 && num <= 140) {
                selectedWaypoint.y = num;
            }
        }
    });
}

/**
 * Loads the configuration data into the popup
 */
function loadConfig() {
    $("#robotLength").val(robotLength);
    $("#robotWidth").val(robotWidth);
    $("#robotName").val(robotName);
    $("#maxAccel").val(maxAccel);
    $("#maxVel").val(maxVel);
    $("#kPoints").val(k);
    isTank = savedIsTank;
    $("#swerveTankToggle").text(isTank ? "Tank Drive" : "Swerve Drive");
}

/**
 * Saves the new configurations
 */
function saveConfig() {
    robotLength = $("#robotLength").val();
    robotWidth = $("#robotWidth").val();
    robotName = $("#robotName").val();
    maxAccel = $("#maxAccel").val();
    maxVel = $("#maxVel").val();
    k = $("#kPoints").val();
    if (robotWidth == 24 && robotLength == 24) {
        TFPCA = 20;
    }
    savedIsTank = isTank;
    $("#myModal").modal("hide");
}

/**
 * Loads the waypoint configuration into the interface.
 * In particular, sets the shown path to the first selected path.
 */
function loadWaypointConfig() {
    $("#waypointName").val(selectedWaypoint.name);
    $("#waypointSpeed").val(selectedWaypoint.speed);
}

/**
 * Saves a new waypoint configuration to the current waypoint
 */
function saveWaypointConfig() {
    let previousName = selectedWaypoint.name;
    let newName = $("#waypointName").val();
    let newSpeed = $("#waypointSpeed").val();

    if (newName) {
        selectedWaypoint.name = newName;

        if (selectedWaypoint.shared) {
            // Update global shared waypoint
            sharedWaypoints.forEach(function (point) {
                if (previousName === point.name) {
                    point.name = newName;
                }
            })

            // Update shared waypoints in every path
            for (let i in paths) {
                if (i !== selectedPath) {
                    let otherPath = paths[i];
                    let otherWaypointIndex = otherPath.getWaypointIndexByName(previousName);

                    if (otherWaypointIndex !== undefined) {
                        let otherWaypoint = otherPath.getWaypoint(otherWaypointIndex);
                        otherWaypoint.name = newName;
                    }
                }
            }

            // Update button
            let buttonList = $(".sharedWaypoint");
            buttonList.each(function (index) {
                let oldName = $(this).text();
                if (oldName === previousName) {
                    $(this).text(newName);
                }
            });
        }
    }

    if (newSpeed) {
        selectedWaypoint.speed = parseFloat(newSpeed);
    } else {
        selectedWaypoint.speed = undefined;
    }

    paths[selectedPath].regeneratePath();
}

/**
 * Updates the selected path when actions are done to the selected waypoint
 */
function autonCreatorDataLoop() {
    let fieldHeightPxl = windowHeight;
    let robotWidthPxl = robotWidthIn * ratio;
    const xinput = $("#x-value");
    const yinput = $("#y-value");

    ratio = fieldHeightPxl / fieldWidthIn * (fieldImage.height / fieldImage.width);

    if (lastSelectedPath !== selectedPath) {
        path = paths[selectedPath];
        selectedWaypointIndex = -1;
        waypointSelected = false;
        waypointAction = WaypointAction.NONE;
    }

    if (fieldKeyboard.undo && fieldKeyboard.undoWait === false) {
        path.undoAction()
        fieldKeyboard.undoWait = true;
    }

    if (fieldKeyboard.redo && fieldKeyboard.redoWait === false) {
        path.redoAction()
        fieldKeyboard.redoWait = true;
    }

    lastSelectedPath = selectedPath;
    
    // shifts mouse position from rotation ball to selected waypoint position for closest waypoint check
    let adjustedMousePosPxl = {x: 0, y: 0};
    if (waypointSelected) {
        fieldMousePosIn = pixelsToInches(fieldMousePos);
        rotateBack = rotatePoint(selectedWaypoint.x, selectedWaypoint.y, fieldMousePosIn.x,
            fieldMousePosIn.y, selectedWaypoint.angle - 180);
        positionBack = {x: rotateBack.x + robotWidthIn, y: rotateBack.y};
        adjustedMousePosPxl = inchesToPixels(positionBack);
    }
    
    if (fieldMouseRising.l && waypointSelected &&
        path.getClosestWaypoint(fieldMousePos, robotWidthIn / 2) === selectedWaypointIndex) {
        waypointAction = WaypointAction.MOVE;
        tempMousePos = fieldMousePos;
        tempSelected = waypointSelected;
    } else if (fieldMouseRising.r && waypointSelected && path.getClosestWaypoint(fieldMousePos, robotWidthIn / 2) === selectedWaypointIndex) {
        waypointAction = WaypointAction.ROTATE;
        tempMousePos = fieldMousePos;
        tempSelected = waypointSelected;
    } else if (rotationBall && fieldMouseRising.l && waypointSelected &&
        path.getClosestWaypoint(adjustedMousePosPxl, 2) === selectedWaypointIndex) {
        waypointAction = WaypointAction.ROTATE;
        tempMousePos = fieldMousePos;
        tempSelected = waypointSelected;
    } else if (fieldMouseRising.l) {
        let selectedIndex = path.getClosestWaypoint(fieldMousePos, robotWidthIn / 2);

        if (selectedIndex >= 0) {
            //Select a waypoint
            selectedWaypointIndex = selectedIndex;
            waypointSelected = true;
            selectedWaypoint = path.getWaypoint(selectedWaypointIndex);
            xinput.prop("disabled", false);
            yinput.prop("disabled", false);
            xinput.val(selectedWaypoint.x);
            yinput.val(selectedWaypoint.y);
            loadWaypointConfig();
            $("#nameWaypointButton").prop("disabled", false);
        } else {
            //Deselect waypoint
            selectedWaypointIndex = undefined;
            waypointSelected = false;
            selectedWaypoint = undefined;
            xinput.val("");
            yinput.val("");
            xinput.prop("disabled", true);
            yinput.prop("disabled", true);
            $("#nameWaypointButton").prop("disabled", true);
        }
        waypointAction = WaypointAction.NONE;
    } else if (fieldKeyboardRising.delete) {
            removeWaypoint();
    } else if (fieldMouseFalling.l || fieldMouseFalling.r || !waypointSelected) {
        waypointAction = WaypointAction.NONE;
        if (fieldMouseFalling.l && waypointSelected && tempMousePos != fieldMousePos && tempSelected == waypointSelected) {
            historyStack.push({"Action":"AddMove", "x":selectedWaypoint.x, "y":selectedWaypoint.y})
        }
        if (fieldMouseFalling.r && waypointSelected && tempMousePos != fieldMousePos && tempSelected == waypointSelected) {
            historyStack.push({"Action":"AddRotate", "angle":selectedWaypoint.angle})
        }
    }

    // update data
    let mousePos = pixelsToInches(fieldMousePos);

    switch (waypointAction) {
        case WaypointAction.MOVE:
            path.setWaypointXY(selectedWaypointIndex, mousePos.x, mousePos.y, prevWaypointAction !== WaypointAction.MOVE);
            prevWaypointAction = WaypointAction.MOVE;
            xinput.val(selectedWaypoint.x);
            yinput.val(selectedWaypoint.y);
            fieldCanvas.style.cursor = cursors.move;
            break;
        case WaypointAction.ROTATE:
            let angle1 = toDegrees(Math.atan2((mousePos.y - selectedWaypoint.y), (mousePos.x - selectedWaypoint.x)));

            if (fieldKeyboard.control) {
                angle1 = Math.round(angle1 / 15) * 15;
            }

            const undoable = prevWaypointAction !== WaypointAction.ROTATE;

            // Move spline only
            if (fieldKeyboard.shift && !savedIsTank) {
                // Swerve - Update spline only with right click shift
                path.setWaypointAngle(selectedWaypointIndex, angle1, "spline", undoable);
            } else if (!savedIsTank) {
                // Swerve - Update Robot only with right click
                path.setWaypointAngle(selectedWaypointIndex, angle1, "angle", undoable);
            } else {
                // Tank - Update both spine and robot angles
                path.setWaypointAngle(selectedWaypointIndex, angle1, "both", undoable);
            }
            fieldCanvas.style.cursor = cursors.crosshair;
            prevWaypointAction = WaypointAction.ROTATE;
            break;
        case WaypointAction.NONE:
            fieldCanvas.style.cursor = cursors.default;
            prevWaypointAction = WaypointAction.NONE;
            break;
    }
}

/**
 * Used to computes the color of the path based on acceleration and speed.
 */
function perc2color(perc) {
    perc *= 100;
    let r, g, b = 0;
    if (perc < 50) {
        r = 255;
        g = Math.round(5.1 * perc);
    } else {
        g = 255;
        r = Math.round(510 - 5.10 * perc);
    }
    let h = r * 0x10000 + g * 0x100 + b * 0x1;
    return '#' + ('000000' + h.toString(16)).slice(-6);
}

// function to draw circle to canvas
function drawCircle(ctx, x, y, radius, fill, stroke, strokeWidth) {
    ctx.beginPath()
    ctx.arc(x, y, radius, 0, 2 * Math.PI, false)
    if (fill) {
      ctx.fillStyle = fill
      ctx.fill()
    }
    if (stroke) {
      ctx.lineWidth = strokeWidth
      ctx.strokeStyle = stroke
      ctx.stroke()
    }
  }
  

/**
 * Draws the updated path when actions are done to the selected waypoint
 * Also draws ghosts of any shared waypoints being changed
 */
function autonCreatorDrawLoop() {
    let robotWidthPxl = (robotWidthIn * ratio) + TFPCA;
    let robotHeightPxl = (robotWidthPxl * (robotImage.height / robotImage.width)) + TFPCA;
    let robotCenterPxl = robotCenterIn * ratio + TFPCA;
    let fieldWidthPxl = fieldWidthIn * ratio;
    let fieldHeightPxl = fieldWidthPxl * (fieldImage.height / fieldImage.width);

    fieldContext.canvas.width = fieldWidthPxl;
    fieldContext.canvas.height = fieldHeightPxl;

    let smallScreen = parseInt(windowWidth) < fieldWidthPxl;
    $("#windowDiv").toggleClass("justify-content-center", !smallScreen).toggleClass("justify-content-start", smallScreen);

    fieldContext.drawImage(fieldImage, 0, 0, fieldWidthPxl, fieldHeightPxl);

    if (waypointSelected) {
        // document.getElementById("statusBarXY").innerText = "X: " + selectedWaypoint.x.toFixed(1)
        //     + " Y: " + selectedWaypoint.y.toFixed(1) + " Angle: " + selectedWaypoint.angle.toFixed(2)
        //     + " Name: " + selectedWaypoint.name;
    } else {
        let mousePos = pixelsToInches(fieldMousePos);
        // document.getElementById("statusBarXY").innerText = "X: " + mousePos.x.toFixed(1)
        //     + " Y: " + mousePos.y.toFixed(1);
    }

    if (waypointAction === WaypointAction.ROTATE) {
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
            fieldContext.rotate(toRadians(-waypointRotation + 180));

            // Add highlight to currently selected waypoint
            if (parseInt(i) === selectedWaypointIndex) {
                fieldContext.shadowBlur = 10;
                fieldContext.shadowColor = 'white';
            }

            fieldContext.globalAlpha = robotOpacity;
            fieldContext.drawImage(robotImage, Math.floor(-robotWidthPxl * .5), Math.floor(-robotCenterPxl), Math.floor(robotWidthPxl), Math.floor(robotHeightPxl));
            
            // draw rotation ball
            if (rotationBall && parseInt(i) === selectedWaypointIndex) {
                fieldContext.lineWidth = 3;
                fieldContext.beginPath();
                fieldContext.moveTo(0, 0);
                fieldContext.lineTo(0, -robotWidthPxl);
                fieldContext.stroke();
                drawCircle(fieldContext, 0, -robotWidthPxl, 10, 'black', 'blue', 2);
            }

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
            let lastPointInPixels = inchesToPixels(points[i - 1]);
            let currentPointInPixels = inchesToPixels(points[i]);
            fieldContext.beginPath();
            fieldContext.strokeStyle = perc2color(points[i].speed / path.getMaxVel());
            fieldContext.moveTo(lastPointInPixels.x, lastPointInPixels.y);
            fieldContext.lineTo(currentPointInPixels.x, currentPointInPixels.y);
            fieldContext.stroke();
        }
    }

    // Draw ghost of other path if the changing point is shared
    if (waypointAction !== WaypointAction.NONE && selectedWaypoint.shared && waypointSelected) {
        let sharedIndex = -1;
        sharedWaypoints.forEach(function (point, index) {
            if (selectedWaypoint.name === point.name) {
                sharedIndex = index;
            }
        })
        for (let i in paths) {
            if (parseInt(i) === selectedPath) {
                continue;
            }

            let otherPath = paths[i];
            let otherWaypointIndex = otherPath.getWaypointIndexByName(selectedWaypoint.name);

            // continue if the shared waypoint does not exist in other paths
            if (otherWaypointIndex === undefined) {
                continue;
            }

            let otherWaypoint = otherPath.getWaypoint(otherWaypointIndex);

            otherWaypoint.x = selectedWaypoint.x;
            otherWaypoint.y = selectedWaypoint.y;
            otherWaypoint.angle = selectedWaypoint.angle;
            sharedWaypoints[sharedIndex].x = selectedWaypoint.x;
            sharedWaypoints[sharedIndex].y = selectedWaypoint.y;
            sharedWaypoints[sharedIndex].angle = selectedWaypoint.angle;
            if (isTank) {
                otherWaypoint.spline_angle = selectedWaypoint.spline_angle;
                sharedWaypoints[sharedIndex].spline_angle = selectedWaypoint.spline_angle;
            }

            if (otherPath.getNumWaypoints() > 0) {
                // Draw waypoints
                let waypoints = otherPath.getWaypoints();

                for (let waypoint of waypoints) {
                    if (waypoint.name === selectedWaypoint.name)
                        continue;

                    let waypointPos = inchesToPixels(new point(waypoint.x, waypoint.y));
                    let waypointRotation = waypoint.angle;
                    fieldContext.save();
                    fieldContext.translate(waypointPos.x, waypointPos.y);
                    fieldContext.rotate(toRadians(-waypointRotation + 180)); // same logic as above
                    fieldContext.globalAlpha = 0.5*robotOpacity;
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

/**
 * Outputs every path in the current window to json format
 * @returns {string} - all path data in json format
 */
function pathAsText(pretty) {
    let output = {
        sharedWaypoints: sharedWaypoints,
        robot: {
            robotName,
            robotWidth,
            robotLength,
            savedIsTank,
            maxAccel,
            maxVel,
            k
        },
        paths: paths
    };
    let json = JSON.stringify(output, null, 4);
    // console.log("Path: ");
    // console.log(json);
    return json;
}

/**
 * Exports the path to json and saves it.
 */
function exportPath() {
    var file = new File([pathAsText(true)], "path.json", { type: "text/plain;charset=utf-8" });
    saveAs(file);
}

function sendPath() {
    ws.send(pathAsText());
}

/**
 * Loads a path from a json file.
 * @param path - json path data
 */
function loadPath(path) {
    let json = JSON.parse(path);
    paths = [];
    sharedWaypoints = [];
    $('#pathSelector').empty();
    $('#waypointsList').empty();
    robotLength = json.robot.robotLength;
    robotWidth = json.robot.robotWidth;
    robotName = json.robot.robotName;
    isTank = json.robot.savedIsTank;
    savedIsTank = json.robot.savedIsTank;
    k = json.robot.k;
    maxAccel = json.robot.maxAccel;
    maxVel = json.robot.maxVel;
    sharedWaypoints = json.sharedWaypoints;

    loadConfig();
    for (let path of json.paths) {
        addPath(Path.fromJson(path));
    }
    loadSharedButtons();

    selectedPath = paths.length - 1;
    lastSelectedPath = -1;
}

function connectedToRobot() {
    if (ws) {
        return ws.readyState === ws.OPEN;
    } else {
        return false;
    }
}

function connectToRobot() {
    if (location.protocol !== 'https:') {
        ws = new WebSocket('ws://' + document.location.host + '/path');
        if (!(ws.readyState === ws.CONNECTING || ws.readyState === ws.OPEN)) {
            console.log("Can not connect to: " + 'ws://' + document.location.host + '/path');
            ws = new WebSocket('ws://10.20.62.2:5810/path');
        }
    }
}

function undoAction() {
    path.undoAction();
}

function redoAction() {
    path.redoAction();
}

/**
 * Converts the field inches to pixels on the screen
 * @param pointInInches - point in inches
 * @returns {point} - new point in pixels
 */
function inchesToPixels(pointInInches) {
    function in2pxX(fieldInches) {
        return (fieldInches + (fieldWidthIn / 2)) * ratio;
    }

    function in2pxY(fieldInches) {
        return fieldInches * ratio;
    }

    return new point(in2pxY(pointInInches.y), in2pxX(pointInInches.x));
}

/**
 * Converts number of pixels to field inches
 * @param pointInPixels - point in pixels
 * @returns {point} - new point in inches
 */
function pixelsToInches(pointInPixels) {
    function px2inY(px) {
        return px / ratio;
    }

    function px2inX(px) {
        return (px / ratio) - (fieldWidthIn / 2);
    }

    return new point(px2inX(pointInPixels.y), px2inY(pointInPixels.x));
}
