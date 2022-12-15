import { multiply, normalize, ParameterizedCurve } from "../Field/mathUtils";
import { Robot, RobotType } from "../Tree/robotsSlice";
import { ControlWaypoint } from "../Tree/waypointsSlice";

function createExportFile(object: object): Blob {
    const dictionary = JSON.stringify(object);
    return new Blob([dictionary], { type: 'text/plain' });

    // const element = document.createElement("path");

    // element.href = URL.createObjectURL(textFile);
    // element.download = fileName;

    // document.body.appendChild(element);
    // element.click();

    // document.body.remove(element);
}

/**
 * A factory class for constructing an ExportObject.
 */
class ExportObjectFactory {
    // public makeExportObject(robot: Robot): ExportObject {
    // }

    public static ExportObject(exportRobot: ExportRobot, exportPath: ExportPath): ExportObject {
        return {
            robot: exportRobot,
            path: exportPath
        };
    }

    private static ExportRobot(robot: Robot): ExportRobot {
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
        const exportWaypoints = this.waypoints.map(waypoint => this.ExportWaypoint(waypoint));
        // const exportPoints = this.ExportPoints();
        return {
            name,
            k,
            totalTime: this.computeTotalTime(),
            points: [],
            waypoints: exportWaypoints
        }
    }

    // public ExportPoints(): ExportPoint[] {
    // map waypoints to curves with k intermediate points

    // }

    public computeTotalTime(): number {
        // time = distance / (m/s) = seconds
        // to get, we need to know arc lengths (trivial) and apply velocity and acceleration constraints (yikes)
        return 0;
    }

    private ExportPoint(curve: ParameterizedCurve, parameter: number) {
        const firstDerivative = multiply(
            normalize(curve.firstDerivative(parameter)), 3
        );

        // const theta = curve.angle(parameter);

        return {
            ...curve.point(parameter),
            // theta: angle,
            vx: firstDerivative.x,
            vy: firstDerivative.y
        }
    }

    private ExportWaypoint(waypoint: ControlWaypoint): ExportWaypoint {
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