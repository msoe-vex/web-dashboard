function point(x, y) {
	let _x = x;
	let _y = y;

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

function Spline(w1, w2) {
	this.startAngle = toRadians(w1.angle) + (Math.PI /2);
	this.endAngle = toRadians(w2.angle) - (Math.PI /2);
	Object.defineProperty(this, "xOff", { enumerable: true, get: function () { return w1.x; } });
	Object.defineProperty(this, "yOff", { enumerable: true, get: function () { return w1.y; } });
	Object.defineProperty(this, "knot", { enumerable: true, get: function () { return Math.sqrt((w2.x - w1.x) * (w2.x - w1.x) + (w2.y - w1.y) * (w2.y - w1.y)); } });
	Object.defineProperty(this, "angleOff", { enumerable: true, get: function () { return Math.atan2(w2.y - w1.y, w2.x - w1.x) ; } });

	let getA0 = function (spline) {
		let a0 = -toRadians(spline.startAngle + 90)- spline.angleOff;
		while (a0 > 2 * Math.PI) {
			a0 -= Math.PI * 2;
		}
		a0 = Math.tan(a0);
		return a0;
	};

	let getA1 = function (spline) {
		let a1 = -toRadians(spline.endAngle + 90) - spline.angleOff;
		while (a1 > 2 * Math.PI) {
			a1 -= Math.PI * 2;
		}
		a1 = Math.tan(a1);
		return a1;
	};

	Object.defineProperty(this, "a", { enumerable: true, get: function () { return 0 } });
	Object.defineProperty(this, "b", { enumerable: true, get: function () { return 0 } });
	Object.defineProperty(this, "c", { enumerable: true, get: function () { return (getA0(this) + getA1(this)) / (this.knot * this.knot) } });
	Object.defineProperty(this, "d", { enumerable: true, get: function () { return -(2 * getA0(this) + getA1(this)) / this.knot; } });
	Object.defineProperty(this, "e", { enumerable: true, get: function () { return getA0(this); } });
	this.get = function (percentage) {
		percentage = Math.max(Math.min(percentage, 1), 0);
		let x = percentage * this.knot;
		let y = (this.a * x + this.b) * (Math.pow(x, 4)) + (this.c * x + this.d) * (x * x) + this.e * x;
		let cosTheta = Math.cos(this.angleOff);
		let sinTheta = Math.sin(this.angleOff);
		return new point(x * cosTheta - y * sinTheta + this.xOff, x * sinTheta + y * cosTheta + this.yOff)
	}
}
