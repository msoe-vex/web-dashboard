class Robot {
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
}