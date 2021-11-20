import { Path } from "./Path";
import { Point } from "./Point";
import { Waypoint } from "./Waypoint";
import { toDegrees, toRadians } from "./Math";
import { inchesToPixels, percentToColor, pixelsToInches } from "./Utility";
import * as Constants from "./Constants";
import { saveAs } from "./filesaver/FileSaver";
import { CursorTypes, InputState } from "./Input";
import { FieldCanvas } from "./FieldCanvas";
import Field from "./images/field.png"
import Robot from "./images/robot.png"
import Test from "./images/test.png"

export enum WaypointAction {
    MOVE,
    ROTATE,
    SPLINE_ROTATE,
    NONE
};

export type RobotConfig = {
    name: string;
    width: number;
    length: number;
    isTankDrive: boolean;
}

export type JSONPathExport = {
    sharedWaypoints: Waypoint[];
    robotConfig: RobotConfig;
    paths: Path[];
}

export class AutonCreator {
    fieldImage: HTMLImageElement = new Image();
    fieldHeight: number;
    robotImage: HTMLImageElement = new Image();
    ratio: number;
    ws: WebSocket;
    selectedWaypointIndex: number;
    selectedWaypoint: Waypoint;
    isWaypointSelected: boolean;
    activePath?: Path;
    paths: Path[];
    sharedWaypoints: Waypoint[];
    robotWidth: number;
    robotLength: number;
    robotName: string;
    isTank: boolean;
    savedIsTank: boolean;
    selectedPath?: number;
    lastSelectedPath?: number;
    waypointAction: WaypointAction;

    constructor() {
        this.ratio = 1;
        this.fieldHeight = 1;
        this.isWaypointSelected = false;
        this.sharedWaypoints = [];
        this.activePath = null;
        this.paths = [];
        this.robotWidth = 0;
        this.robotLength = 0;
        this.robotName = "";
        this.isTank = true;
        this.savedIsTank = this.isTank;
        this.selectedPath = -1;
        this.lastSelectedPath = -1;
        this.waypointAction = WaypointAction.NONE;
        this.addPath = this.addPath.bind(this);
        this.createNewPath = this.createNewPath.bind(this);
        this.setSwerve = this.setSwerve.bind(this);
        this.newWaypoint = this.newWaypoint.bind(this);
        this.newSharedWaypoint = this.newSharedWaypoint.bind(this);
        this.newSharedButton = this.newSharedButton.bind(this);
        this.loadSharedButtons = this.loadSharedButtons.bind(this);
        this.removeWaypoint = this.removeWaypoint.bind(this);
        this.autonCreatorInit = this.autonCreatorInit.bind(this);
        this.loadConfig = this.loadConfig.bind(this);
        this.saveConfig = this.saveConfig.bind(this);
        this.loadWaypointConfig = this.loadWaypointConfig.bind(this);
        this.saveWaypointConfig = this.saveWaypointConfig.bind(this);
        this.autonCreatorDataLoop = this.autonCreatorDataLoop.bind(this);
        this.autonCreatorDrawLoop = this.autonCreatorDrawLoop.bind(this);
        this.pathAsText = this.pathAsText.bind(this);
        this.exportPath = this.exportPath.bind(this);
        this.sendPath = this.sendPath.bind(this);
        this.loadPath = this.loadPath.bind(this);
        this.connectedToRobot = this.connectedToRobot.bind(this);
        this.connectToRobot = this.connectToRobot.bind(this);
    }

    /**
     * Adds new path to the path selector
     * @param path
     */
    addPath(path: Path) {
        this.paths.push(path);
        let index = this.paths.length - 1;
        $('#pathSelector').append($('<option/>', {
            value: index
        }).text(path.name).attr('selected','selected'));
        return index;
    }

    /**
     * Creates a new path
     */
    createNewPath() {
        let name = prompt("Name the Path");
        let path = new Path(name, Constants.MAX_VELOCITY, Constants.MAX_ACCELERATION, Constants.K);
        path.newWaypoint(20, 10, 0, 0, "start", 0);
        path.newWaypoint(30, 70, 0, 0, "end", undefined);
        this.selectedPath = this.addPath(path);
    };

    /**
     * Switches the drive mode of all paths
     * Toggle button in the config menu
     */
    setSwerve() {
        if (this.isTank) {
            $("#swerveTankToggle").text("Swerve Drive");
        } else {
            $("#swerveTankToggle").text("Tank Drive");
        }
        this.isTank = !this.isTank;
    };

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
    newWaypoint = () => {
        this.activePath.newWaypoint();
    };

    /**
     * Creates a new shared waypoint
     * Called when the 'New Shared Waypoint' button is pressed
     */
    newSharedWaypoint() {
        // Creates new shared waypoint with button
        let name = prompt("Shared Waypoint Name");
        if (name !== null) {
            let newShared = this.activePath.newWaypoint(undefined, undefined, undefined, undefined, name, undefined, true);
            this.sharedWaypoints.push(newShared);
            this.newSharedButton(name);
        }
    };

    /**
     * Creates a new button for a shared waypoint
     * @param name - name of the new button
     */
    newSharedButton(name: string) {
        let buttonList = $("#waypointsList");
        let button = $("<button>" + name + "</button>");
        // Function runs if dynamically created shared waypoint button is pressed
        const clickShared = (name: string)  => {
            let inPath = false;
            this.activePath.getWaypoints().forEach((point) => {
                if (point.name === name && point.shared) {
                    inPath = true;
                }
            })
            if (inPath === false) {
                this.sharedWaypoints.forEach((point) => {
                    if (name === point.name) {
                        this.activePath.newWaypoint(point.x, point.y, point.angle, point.spline_angle, name, undefined, true);
                    }
                })
            }
        };
        button.attr("type", "button");
        button.attr("class", "sharedWaypoint btn btn-block btn-secondary");
        button.attr("data-trigger", "hover");
        button.attr("data-toggle", "popover");
        button.trigger("click", () => clickShared(name));
        buttonList.append(button);
    };

    /**
     * Loads in all shared waypoints when a JSON file is added
     */
    loadSharedButtons() {
        this.sharedWaypoints.forEach((point) => {
            this.newSharedButton(point.name);
        })
    };

    /**
     * Removes the selected by waypoint
     * Called when the 'Remove Waypoint' button is pressed
     */
    removeWaypoint = () => {
        if (this.activePath.getNumWaypoints() > 0) {
            if (this.isWaypointSelected) {
                this.activePath.removeWaypoint(this.selectedWaypointIndex);
                if (this.activePath.getNumWaypoints() === 0) {
                    this.selectedWaypointIndex = -1;
                    this.isWaypointSelected = false;
                } else if (this.activePath.getNumWaypoints() === this.selectedWaypointIndex) {
                    this.selectedWaypointIndex--;
                }
            } else {
                this.activePath.removeWaypoint();
            }
        }
    };

    /**
     * Initialized the first path and images
     */
    autonCreatorInit() {
        let firstPath = new Path("TestPath", Constants.MAX_VELOCITY, Constants.MAX_ACCELERATION, Constants.K); //TODO: Make it so these can be changed on the GUI, also save them in the json output so they can be loaded later
        this.addPath(firstPath);
        this.fieldImage.src = Field;
        this.robotImage.src = Robot;

        firstPath.newWaypoint(0, 7.5, 0, 0, "startWaypoint", 0);
        firstPath.newWaypoint(0, 71, 0, 0, "endWaypoint", undefined);
        this.selectedPath = 0;

        $("#x-value").trigger("keyup", (event: KeyboardEvent) => {
            let x = parseFloat($("#x-value").val().toString());

            if (x >= -70 && x <= 70) {
                this.selectedWaypoint.x = x;
            }
        });

        $("#y-value").trigger("keyup", (event: KeyboardEvent) => {
            let y = parseFloat($("#y-value").val().toString());

            if (y >= 0 && y <= 140) {
                this.selectedWaypoint.y = y;
            }
        });
    };

    /**
     * Loads the configuration data into the popup
     */
    loadConfig() {
        $("#robotLength").val(this.robotLength);
        $("#robotWidth").val(this.robotWidth);
        $("#robotName").val(this.robotName);
        this.isTank = this.savedIsTank;
        $("#swerveTankToggle").text(this.isTank ? "Tank Drive" : "Swerve Drive");
    };

    /**
     * Saves the new configurations
     */
    saveConfig() {
        this.robotLength = parseFloat($("#robotLength").val().toString());
        this.robotWidth = parseFloat($("#robotWidth").val().toString());
        this.robotName = $("#robotName").val().toString();
        this.savedIsTank = this.isTank;
        $("#myModal").modal("hide");
    };

    /**
     * This function loads the waypoint configuration into the interface
     */
    loadWaypointConfig() {
        $("#waypointName").val(this.selectedWaypoint.name);
        $("#waypointSpeed").val(this.selectedWaypoint.speed);
    };

    /**
     * This function saves a new waypoint configuration to the current waypoint
     */
    saveWaypointConfig() {
        let previousName = this.selectedWaypoint.name;
        let newName = $("#waypointName").val().toString();
        let newSpeed = parseFloat($("#waypointSpeed").val().toString());

        if (newName) {
            this.selectedWaypoint.name = newName;

            if (this.selectedWaypoint.shared) {
                // Update global shared waypoint
                this.sharedWaypoints.forEach((point) => {
                    if (previousName === point.name) {
                        point.name = newName;
                    }
                })

                // Update shared waypoints in every path
                this.paths.forEach((path, i) => {
                    if (i !== this.selectedPath) {
                        let otherPath = path;
                        let otherWaypointIndex = otherPath.getWaypointIndexByName(previousName);

                        if (otherWaypointIndex !== undefined) {
                            let otherWaypoint = otherPath.getWaypoint(otherWaypointIndex);
                            otherWaypoint.name = newName;
                        }
                    }
                })

                // Update button
                let buttonList = $(".sharedWaypoint");
                buttonList.each((index) => {
                    let oldName = $(this).text();
                    if (oldName === previousName) {
                        $(this).text(newName);
                    }
                });
            }
        }

        if (newSpeed) {
            this.selectedWaypoint.speed = newSpeed;
        } else {
            this.selectedWaypoint.speed = undefined;
        }

        this.paths[this.selectedPath].regeneratePath();
    };

    /**
     * Updates the selected path when actions are done to the selected waypoint
     */
    autonCreatorDataLoop(fieldCanvas: FieldCanvas) {
        // Field Canvas height gets reset to 0, due to image not being loaded in on first few loops, so we need to save it somehow
        if (fieldCanvas.getHeight() > 1) {
            this.fieldHeight = fieldCanvas.getHeight();
        } else {
            fieldCanvas.getFieldCanvas().height = this.fieldHeight;
        }

        const xinput = $("#x-value");
        const yinput = $("#y-value");

        this.ratio = fieldCanvas.getHeight() / Constants.FIELD_WIDTH_IN * (this.fieldImage.height / this.fieldImage.width);

        // Temp change because something is wrong with fieldCanvas height, I think its a css problem, with flex, but im v confused
        this.ratio = 6;

        if (this.lastSelectedPath !== this.selectedPath) {
            this.activePath = this.paths[this.selectedPath];
            this.selectedWaypointIndex = -1;
            this.isWaypointSelected = false;
            this.waypointAction = WaypointAction.NONE;
        }

        this.lastSelectedPath = this.selectedPath;

        if (InputState.mouse.l.pressed() && 
                this.isWaypointSelected && 
                this.activePath.getClosestWaypoint(InputState.fieldMousePos, this.ratio, Constants.ROBOT_WIDTH_IN / 2) === this.selectedWaypointIndex) {
                this.waypointAction = WaypointAction.MOVE;
        } else if (InputState.mouse.r.pressed() && 
                this.isWaypointSelected && 
                this.activePath.getClosestWaypoint(InputState.fieldMousePos, this.ratio, Constants.ROBOT_WIDTH_IN / 2) === this.selectedWaypointIndex) {
            this.waypointAction = WaypointAction.ROTATE;
        } else if (InputState.mouse.l.pressed()) {
            let selectedIndex = this.activePath.getClosestWaypoint(InputState.fieldMousePos, this.ratio, Constants.ROBOT_WIDTH_IN / 2);
            if (selectedIndex >= 0) {
                //Select a waypoint
                this.selectedWaypointIndex = selectedIndex;
                this.isWaypointSelected = true;
                this.selectedWaypoint = this.activePath.getWaypoint(this.selectedWaypointIndex);
                xinput.prop("disabled", false);
                yinput.prop("disabled", false);
                xinput.val(this.selectedWaypoint.x);
                yinput.val(this.selectedWaypoint.y);
                this.loadWaypointConfig();
                $("#nameWaypointButton").prop("disabled", false);
            } else {
                //Deselect waypoint
                this.selectedWaypointIndex = undefined;
                this.isWaypointSelected = false;
                this.selectedWaypoint = undefined;
                xinput.val("");
                yinput.val("");
                xinput.prop("disabled", true);
                yinput.prop("disabled", true);
                $("#nameWaypointButton").prop("disabled", true);
            }
            this.waypointAction = WaypointAction.NONE;
        } else if (InputState.mouse.l.released() || InputState.mouse.r.released() || !this.isWaypointSelected) {
            this.waypointAction = WaypointAction.NONE;
        }

        // update data
        let mousePos = pixelsToInches(InputState.fieldMousePos, this.ratio);

        switch (this.waypointAction) {
            case WaypointAction.MOVE:
                this.selectedWaypoint.x = mousePos.x;
                this.selectedWaypoint.y = mousePos.y;
                xinput.val(this.selectedWaypoint.x);
                yinput.val(this.selectedWaypoint.y);
                fieldCanvas.setCursor(CursorTypes.MOVE);
                break;
            case WaypointAction.ROTATE:
                let angle1 = toDegrees(Math.atan2((mousePos.x - this.selectedWaypoint.x), (mousePos.y - this.selectedWaypoint.y)));

                if (InputState.keyboard.control.pressed()) {
                    angle1 = Math.round(angle1 / 15) * 15;
                }

                // Move spline only
                if (InputState.keyboard.shift.pressed() && !this.savedIsTank) {
                    // Swerve - Update spline only with right click shift
                    this.selectedWaypoint.spline_angle = angle1;
                } else if (!this.savedIsTank) {
                    // Swerve - Update Robot only with right click
                    this.selectedWaypoint.angle = angle1;
                } else {
                    // Tank - Update both spine and robot angles
                    this.selectedWaypoint.angle = angle1;
                    this.selectedWaypoint.spline_angle = angle1;
                }
                fieldCanvas.setCursor(CursorTypes.CROSSHAIR);
                break;
            case WaypointAction.NONE:
                fieldCanvas.setCursor(CursorTypes.DEFAULT);
                break;
        }
    };

    /**
     * Draws the updated path when actions are done to the selected waypoint
     * Also draws ghosts of any shared waypoints being changed
     */
    autonCreatorDrawLoop(fieldCanvas: FieldCanvas) {
        let robotWidthPxl = Constants.ROBOT_WIDTH_IN * this.ratio;
        let robotHeightPxl = robotWidthPxl * (this.robotImage.height / this.robotImage.width);
        let robotCenterPxl = Constants.ROBOT_CENTER_IN * this.ratio;
        
        let fieldWidthPxl = Constants.FIELD_WIDTH_IN * this.ratio;
        let fieldHeightPxl = fieldWidthPxl * (this.fieldImage.height / this.fieldImage.width);

        fieldCanvas.getFieldContext().canvas.width = fieldWidthPxl;
        fieldCanvas.getFieldContext().canvas.height = fieldHeightPxl;

        let smallScreen = fieldCanvas.getWidth() < fieldWidthPxl;
        $("#windowDiv").toggleClass("justify-content-center", !smallScreen).toggleClass("justify-content-start", smallScreen);

        fieldCanvas.getFieldContext().drawImage(this.fieldImage, 0, 0, fieldWidthPxl, fieldHeightPxl);

        if (this.waypointAction === WaypointAction.ROTATE) {
            fieldCanvas.getFieldContext().fillStyle = "#ffffff";
            if (InputState.keyboard.shift.pressed()) {
                fieldCanvas.getFieldContext().fillText((this.selectedWaypoint.spline_angle.toFixed(1) + "\xB0"), InputState.fieldMousePos.x + 8,
                InputState.fieldMousePos.y - 8);
            } else {
                fieldCanvas.getFieldContext().fillText((this.selectedWaypoint.angle.toFixed(1) + "\xB0"), InputState.fieldMousePos.x + 8,
                InputState.fieldMousePos.y - 8);
            }
        }

        if (this.activePath.getNumWaypoints() > 0) {
            // Draw waypoints
            let waypoints = this.activePath.getWaypoints();

            waypoints.forEach((waypoint, i) => {
                let waypointPos = inchesToPixels(new Point(waypoint.x, waypoint.y), this.ratio);
                let waypointRotation = waypoint.angle;
                fieldCanvas.getFieldContext().save();
                fieldCanvas.getFieldContext().translate(waypointPos.x, waypointPos.y);
                fieldCanvas.getFieldContext().rotate(toRadians(waypointRotation + 90));

                // Add highlight to currently selected waypoint
                if (i === this.selectedWaypointIndex) {
                    fieldCanvas.getFieldContext().shadowBlur = 10;
                    fieldCanvas.getFieldContext().shadowColor = 'white';
                }

                fieldCanvas.getFieldContext().drawImage(this.robotImage, Math.floor(-robotWidthPxl * .5), Math.floor(-robotCenterPxl), Math.floor(robotWidthPxl), Math.floor(robotHeightPxl));
                fieldCanvas.getFieldContext().restore();
            });
        }

        // Draw spline
        let points;
        if (this.waypointAction !== WaypointAction.NONE) {
            points = this.activePath.getPoints(this.selectedWaypointIndex);
        } else {
            points = this.activePath.getPoints();
        }

        if (points.length !== 0) {
            fieldCanvas.getFieldContext().lineWidth = Math.floor(robotWidthPxl * .05);
            for (let i = 1; i < points.length; i++) {
                let lastPointInPixels = inchesToPixels(points[i - 1], this.ratio);
                let currentPointInPixels = inchesToPixels(points[i], this.ratio);
                fieldCanvas.getFieldContext().beginPath();
                fieldCanvas.getFieldContext().strokeStyle = percentToColor(points[i].speed / this.activePath.getMaxVel());
                fieldCanvas.getFieldContext().moveTo(lastPointInPixels.x, lastPointInPixels.y);
                fieldCanvas.getFieldContext().lineTo(currentPointInPixels.x, currentPointInPixels.y);
                fieldCanvas.getFieldContext().stroke();
            }
        }

        // Draw ghost of other path if the changing point is shared
        if (this.waypointAction !== WaypointAction.NONE && this.selectedWaypoint.shared && this.isWaypointSelected) {
            let sharedIndex = -1;
            this.sharedWaypoints.forEach((point, index) => {
                if (this.selectedWaypoint.name === point.name) {
                    sharedIndex = index;
                }
            })

            this.paths.forEach((otherPath, i) => {
                if (i !== this.selectedPath) {
                    let otherWaypointIndex = otherPath.getWaypointIndexByName(this.selectedWaypoint.name);

                    if (otherWaypointIndex !== undefined) {
                        let otherWaypoint = otherPath.getWaypoint(otherWaypointIndex);

                        otherWaypoint.x = this.selectedWaypoint.x;
                        otherWaypoint.y = this.selectedWaypoint.y;
                        otherWaypoint.angle = this.selectedWaypoint.angle;
                        this.sharedWaypoints[sharedIndex].x = this.selectedWaypoint.x;
                        this.sharedWaypoints[sharedIndex].y = this.selectedWaypoint.y;
                        this.sharedWaypoints[sharedIndex].angle = this.selectedWaypoint.angle;
                        if (this.isTank) {
                            otherWaypoint.spline_angle = this.selectedWaypoint.spline_angle;
                            this.sharedWaypoints[sharedIndex].spline_angle = this.selectedWaypoint.spline_angle;
                        }

                        if (otherPath.getNumWaypoints() > 0) {
                            // Draw waypoints
                            let waypoints = otherPath.getWaypoints();

                            waypoints.forEach((waypoint, i) => {
                                let waypointPos = inchesToPixels(new Point(waypoint.x, waypoint.y), this.ratio);
                                let waypointRotation = waypoint.angle;
                                fieldCanvas.getFieldContext().save();
                                fieldCanvas.getFieldContext().translate(waypointPos.x, waypointPos.y);
                                fieldCanvas.getFieldContext().rotate(toRadians(waypointRotation + 90));
                                fieldCanvas.getFieldContext().globalAlpha = 0.5;
                                fieldCanvas.getFieldContext().drawImage(this.robotImage, Math.floor(-robotWidthPxl * .5), Math.floor(-robotCenterPxl), Math.floor(robotWidthPxl), Math.floor(robotHeightPxl));
                                fieldCanvas.getFieldContext().restore();
                            });
                        }

                        // Draw spline
                        let points = otherPath.getPoints(otherWaypointIndex);

                        fieldCanvas.getFieldContext().save();

                        if (points.length !== 0) {
                            fieldCanvas.getFieldContext().lineWidth = Math.floor(robotWidthPxl * .05);
                            fieldCanvas.getFieldContext().strokeStyle = "#d9d9d9";
                            fieldCanvas.getFieldContext().globalAlpha = 0.5;

                            let pointInPixels = inchesToPixels(points[0], this.ratio);
                            fieldCanvas.getFieldContext().moveTo(pointInPixels.x, pointInPixels.y);
                            fieldCanvas.getFieldContext().beginPath();

                            for (let point of points) {
                                let pointInPixels = inchesToPixels(point, this.ratio);
                                fieldCanvas.getFieldContext().lineTo(pointInPixels.x, pointInPixels.y);
                            }

                            fieldCanvas.getFieldContext().stroke();
                        }
                        fieldCanvas.getFieldContext().restore();
                    }
                }
            });
        }
    };

    /**
     * Outputs every path in current window to json format
     */
    pathAsText() {
        let pathOutput: JSONPathExport = {
            sharedWaypoints: this.sharedWaypoints,
            robotConfig: {
                name: this.robotName,
                width: this.robotWidth,
                length: this.robotLength,
                isTankDrive: this.savedIsTank
            },
            paths: this.paths
        };
        let json = JSON.stringify(pathOutput, null, 4);
        return json;
    };

    /**
     * Exports the path to json and saves it
     */
    exportPath = () => {
        var file = new File([this.pathAsText()], "path.json", {type: "text/plain;charset=utf-8"});
        saveAs(file);
    };

    sendPath = () => {
        this.ws.send(this.pathAsText());
    };

    /**
     * Loads a path from a json file
     * @param path - json path data
     */
    loadPath(path: string) {
        let json = JSON.parse(path);
        this.paths = [];
        $('#pathSelector').empty();
        this.robotLength = json.robot.robotWidth;
        this.robotWidth = json.robot.robotWidth;
        this.robotName = json.robot.robotName;
        this.isTank = json.robot.savedIsTank;
        this.savedIsTank = json.robot.savedIsTank;
        this.sharedWaypoints = json.sharedWaypoints;
        this.loadConfig();
        for (let path of json.paths) {
            this.addPath(Path.fromJSON(path));
        }
        this.loadSharedButtons();
        this.lastSelectedPath = -1;
    };

    connectedToRobot() {
        if (this.ws) {
            return this.ws.readyState === this.ws.OPEN;
        } else {
            return false;
        }

    };

    connectToRobot() {
        if (location.protocol !== 'https:') {
            this.ws = new WebSocket('ws://' + document.location.host + '/path');
            if (!(this.ws.readyState === this.ws.CONNECTING || this.ws.readyState === this.ws.OPEN)) {
                console.log("Can not connect to: " + 'ws://' + document.location.host + '/path');
                this.ws = new WebSocket('ws://10.20.62.2:5810/path');
            }
        }
    };
}

let activeAutonCreator = new AutonCreator();

export { activeAutonCreator };