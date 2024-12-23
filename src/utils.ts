import Point from "@mapbox/point-geometry";

export type RectCoords = [number, number, number, number];

export function snap(value: number, mod: number) {
    return value - (value % mod);
}

export function getButton(event: MouseEvent): "LMB" | "MMB" | "RMB" | null {
    if (event.button === 0) return "LMB";
    if (event.button === 1) return "LMB";
    if (event.button === 2) return "LMB";
    return null;
}

/**
 * Get a Point representation of the mouse event's offset coordinates.
 */
export function mouseCoordsAsPoint(event: MouseEvent): Point {
    return new Point(event.offsetX, event.offsetY);
}

export function assertType<T>(variable: any): T {
    return variable;
}

export function asRectCoords(p1: Point, p2: Point): RectCoords {
    return [
        Math.min(p1.x, p2.x),
        Math.min(p1.y, p2.y),
        Math.max(p1.x, p2.x),
        Math.max(p1.y, p2.y),
    ];
}
