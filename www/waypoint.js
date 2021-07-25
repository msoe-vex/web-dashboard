/*
 * Function defines the attributes of a waypoint
 *
 * x,y - coordinate position of waypoint
 * angle - angle of the robot
 * spline angle - angle of the generated robot path (spline)
 * name - given name of the waypoint (default: "wp")
 * shared - whether or not the waypoint is shared (default: False)
 */
function Waypoint(x, y, angle, spline_angle, name, speed, shared) {
    let _name = name || "wp";
    let _x = parseFloat(x);
    let _y = parseFloat(y);
    let _angle = parseFloat(angle);
    let _spline_angle = parseFloat(spline_angle);
    let _shared = shared || false;
    let _speed = parseFloat(speed);

    Object.defineProperty(this, "name", {
        enumerable: true,
        get: function(){ return _name },
        set: function(value){ _name = value }
    });

    Object.defineProperty(this, "omega", {
        enumerable: true,
        get: function(){ return _omega },
        set: function(value){ _omega = value }
    });

    Object.defineProperty(this, "angle", {
        enumerable: true,
        get: function(){ return parseFloat(_angle.toFixed(2)) },
        set: function(value){
            _angle = value;

            while(_angle > 180) {
                _angle -= 360;
            }

            while(_angle < -180) {
                _angle += 360;
            }
        }
    });

    Object.defineProperty(this, "spline_angle", {
        enumerable: true,
        get: function(){ return parseFloat(_spline_angle.toFixed(2)) },
        set: function(value){
            _spline_angle = value;

            while(_spline_angle > 180) {
                _spline_angle -= 360;
            }

            while(_spline_angle < -180) {
                _spline_angle += 360;
            }
        }
    });

    Object.defineProperty(this, "x", {
        enumerable: true,
        get: function(){ return parseFloat(_x.toFixed(2)) },
        set: function(value){ _x = value }
    });

    Object.defineProperty(this, "y", {
        enumerable: true,
        get: function(){ return parseFloat(_y.toFixed(2)) },
        set: function(value){ _y = value }
    });

    Object.defineProperty(this, "shared", {
        enumerable: true,
        get: function(){ return _shared },
        set: function(value){ _shared = value }
    });

    Object.defineProperty(this, "speed", {
        enumerable: true,
        get: function() { return _speed },
        set: function(speed){ _speed = speed }
    });
}