import { Point } from "fabric/fabric-impl";
import { start } from "repl";
import { ParameterizedCurve } from "../Field/mathUtils";
import { Robot, robotMaxVelocityChanged, RobotType } from "../Tree/robotsSlice";
import { ControlWaypoint } from "../Tree/waypointsSlice";
import { Path } from "./pathsSlice";

/**
 * A factory class for constructing an ExportObject.
 */
class ExportObjectFactory {
    public static ExportObject(exportRobot: ExportRobot, exportPath: ExportPath): ExportObject {
        return {
            robot: exportRobot,
            path: exportPath
        };
    }

    public static ExportRobot(robot: Robot): ExportRobot {
        return {
            ...robot,
            isTank: robot.robotType === RobotType.TANK
        };
    }

    // public static ExportPath(path: Path, k: number, totalTime: number): ExportPath {
    //     return {
    //     }
    // }

}

class ExportPathFactory {
    public constructor(waypoints: ControlWaypoint[]) {
        this.waypoints = waypoints;
    }

    public makePath(name: string, k: number): ExportPath {
        const exportWaypoints = this.waypoints.map(waypoint => ExportPathFactory.ExportWaypoint(waypoint));
        const exportPoints = this.ExportPoints();
        return {
            name,
            k,
            totalTime: this.computeTotalTime(),
            points: exportPoints,
            waypoints: exportWaypoints
        }
    }

    public ExportPoints(): ExportPoint[] {
        return [];
    }

    public computeTotalTime(): number {
        // time = distance / (m/s) = seconds
        // to get, we need to know arc lengths (trivial) and apply velocity and acceleration constraints (yikes)
        return 0;
    }


    public static ExportPoint(curve: ParameterizedCurve, parameter: number) {
        const firstDerivative = curve.firstDerivative(parameter);
        return {
            ...curve.point(parameter),

            vx: firstDerivative.x,
            vy: firstDerivative.y
        }
    }

    public static ExportWaypoint(waypoint: ControlWaypoint): ExportWaypoint {
        return {
            ...waypoint.point,
            name: waypoint.name,
            robotAngle: waypoint.robotAngle ?? waypoint.angle,
            angle: waypoint.angle,
            speed: 0
        };
    }

    private waypoints: ControlWaypoint[];
}

interface ExportObject {
    robot: ExportRobot;
    path: ExportPath;
}

interface ExportWaypoint {
    name: string;
    // previously was spline_angle and angle
    // spline_angle -> angle, angle -> robotAngle
    robotAngle: number;
    angle: number;
    x: number;
    y: number;
    speed: number; // target speed at point?
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