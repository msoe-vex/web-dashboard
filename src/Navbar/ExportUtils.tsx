import { NumberLiteralType } from "typescript";
import { ControlWaypoint } from "../Tree/waypointsSlice";

class Export {
    public constructor(waypoints: ControlWaypoint[], maxVelocity: number, maxAcceleration: number) {
        this.waypoints = waypoints;
        this.maxVelocity = maxVelocity;
        this.maxAcceleration = maxAcceleration;
    }

    public static makeExportWaypoint(waypoint: ControlWaypoint): ExportWaypoint {
        return {
            ...waypoint.point,
            name: waypoint.name,
            spline_angle: waypoint.angle,
            angle: waypoint.robotAngle ?? waypoint.angle,
            speed: 0
        };
    }

    private waypoints: ControlWaypoint[];
    private maxVelocity: number;
    private maxAcceleration: number;
}

interface ExportObject {
    sharedWaypoints: undefined[];
    robot: ExportRobot;
    paths: ExportPath[];
}

interface ExportWaypoint {
    name: string;
    angle: number;
    spline_angle: number;
    x: number;
    y: number;
    speed: number; // target speed at point
}

interface ExportPoint {
    x: number;
    y: number;
    speed: number; // actual speed at point
    time: number; // distance * derivative?
    theta: number; // angle at point
    omega: number; // rotation translation
    // x and y components of first derivatives at point
    vx: number;
    vy: number;
    splineNum: number; // Always 0?
}

interface ExportPath {
    name: string;
    k: number;
    totalTime: number;
    waypoints: ExportWaypoint[];
    points: ExportPoint[];
}

interface ExportRobot {
    name: string;
    width: number;
    length: number;
    isTank: boolean;
    maxAcceleration: number;
    maxVelocity: number;
}