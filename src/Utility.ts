import { Point } from "./Point";
import * as Constants from "./Constants";

export function percentToColor(percent: number): string {
    percent *= 100;
    let r, g, b = 0;
    if (percent < 50) {
        r = 255;
        g = Math.round(5.1 * percent);
    } else {
        g = 255;
        r = Math.round(510 - 5.10 * percent);
    }
    let h = r * 0x10000 + g * 0x100 + b * 0x1;
    return '#' + ('000000' + h.toString(16)).slice(-6);
};

export function toCamelCase(str: string): string {
    if (str !== undefined) {
        return str.replace(/(?:^\w|[A-Z]|\b\w|\s+)/g, function (match, index) {
            if (+match === 0) return ""; // or if (/\s+/.test(match)) for white spaces
            return match.toUpperCase();
        });
    }
}

/**
 * Converts the field inches to pixels on the screen
 * @param pointInInches - point in inches
 * @returns {point} - new point in pixels
 */
export function inchesToPixels(pointInInches: Point, ratio: number): Point {
    let pixelsX = (pointInInches.x + (Constants.FIELD_WIDTH_IN / 2)) * ratio;
    let pixelsY = pointInInches.y * ratio;

    return new Point(pixelsY, pixelsX);
}

/**
 * Converts number of pixels to field inches
 * @param pointInPixels - point in pixels
 * @returns {point} - new point in inches
 */
export function pixelsToInches(pointInPixels: Point, ratio: number): Point {
    // TODO: these were flipped in the original program
    let inchesX = (pointInPixels.y / ratio) - (Constants.FIELD_WIDTH_IN / 2);
    let inchesY = (pointInPixels.x / ratio);

    return new Point(inchesX, inchesY);
}