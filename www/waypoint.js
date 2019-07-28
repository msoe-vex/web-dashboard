function Waypoint(x, y, angle, name) {
    let _name = name || "wp";
    let _x = parseFloat(x);
    let _y = parseFloat(y);
    let _angle = parseFloat(angle);

    Object.defineProperty(this, "name", {
        enumerable: true,
        get: function(){ return _name },
        set: function(value){ _name = value }
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
}