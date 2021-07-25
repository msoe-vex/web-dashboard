function hypot(x1, y1, x2, y2) {
	return Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));
}

function toDegrees(radians) {
	return radians * (180 / Math.PI);
}

function toRadians(degrees) {
	return degrees * (Math.PI / 180);
}

function calculateCurvature(point1, point2, point3) {
	// Borrowed from https://www.chiefdelphi.com/uploads/default/original/3X/b/e/be0e06de00e07db66f97686505c3f4dde2e332dc.pdf
	if(point1.x === point2.x) {
		point1.x += 0.000001;
	}

	let k1 = 0.5 * (point1.x**2 + point1.y**2 - point2.x**2 - point2.y**2) / (point1.x - point2.x);
	let k2 = (point1.y - point2.y) / (point1.x - point2.x);
	let b = 0.5 * (point2.x**2 - 2 * point2.x * k1 + point2.y**2 - point3.x**2 + 2 * point3.x * k1 - point3.y**2)
					/ (point3.x * k2 - point3.y + point2.y - point2.x * k2);
	let a = k1 - k2 * b;
	let r = Math.sqrt((point1.x - a)**2 + (point1.y - b)**2);
	return 1 / r;
}

function shortestRotationTo (target, current) {
	let counterClockwiseMove = current - target;
	let clockwiseMove = target - current;
	clockwiseMove += (clockwiseMove < 0 ? 360 : 0);
	counterClockwiseMove += (counterClockwiseMove < 0 ? 360 : 0);
	return (Math.abs(clockwiseMove) < Math.abs(counterClockwiseMove) ? -clockwiseMove : counterClockwiseMove);
}