function hypot(x1, y1, x2, y2) {
	return Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));
}

function toDegrees(radians) {
	return radians * (180 / Math.PI);
}

function toRadians(degrees) {
	return degrees * (Math.PI / 180);
}