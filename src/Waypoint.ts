/*
 * Function defines the attributes of a waypoint
 *
 * x,y - coordinate position of waypoint
 * angle - angle of the robot
 * spline angle - angle of the generated robot path (spline)
 * name - given name of the waypoint (default: "wp")
 * shared - whether or not the waypoint is shared (default: False)
 */
export class Waypoint {
    x: number;
    y: number;
    angle: number;
    spline_angle: number;
    name: string;
    speed: number;
    shared: boolean;

    constructor(x: number, y: number, angle: number, spline_angle: number, name: string, speed: number, shared?: boolean) {
        this.x = x;
        this.y = y;
        this.angle = angle;
        this.spline_angle = spline_angle;
        this.name = name;
        this.speed = speed;
        this.shared = shared || false;
    }

    getX() {
        return this.x.toFixed(2);
    }

    getY() {
        return this.y.toFixed(2);
    }

    getAngle() {
        return this.angle.toFixed(2);
    }

    setAngle(angle: number) {
        this.angle = angle;

        while(this.angle > 180) {
            this.angle -= 360;
        }

        while(this.angle < -180) {
            this.angle += 360;
        }
    }

    getSplineAngle() {
        return this.spline_angle.toFixed(2);
    }

    setSplineAngle(spline_angle: number) {
        this.spline_angle = spline_angle;

        while(this.spline_angle > 180) {
            this.spline_angle -= 360;
        }

        while(this.spline_angle < -180) {
            this.spline_angle += 360;
        }
    }

    getName() {
        return this.name;
    }

    getShared() {
        return this.shared;
    }

    getSpeed() {
        return this.speed.toFixed(2);
    }
}