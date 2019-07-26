class Waypoint {
    constructor(x, y, angle, name) {
        this.name = name || "wp";
        this.x = parseFloat(x);
        this.y = parseFloat(y);
        this.m_angle = parseFloat(angle);
    };

    /**
     * Set rotation of waypoint. 0 degrees is straight forward, or up on the page
     * @param degrees
     */
    set angle(degrees) {
        this.m_angle = degrees;

        while(this.m_angle > 180) {
            this.m_angle -= 360;
        }

        while(this.m_angle < -180) {
            this.m_angle += 360;
        }
    }

    get angle() {
        return this.m_angle;
    }

    get x() {
        return this._x;
    }

    set x(value) {
        this._x = value;
    }

    get y() {
        return this._y;
    }

    set y(value) {
        this._y = value;
    }

    get name() {
        return this._name;
    }

    set name(value) {
        this._name = value;
    }
}