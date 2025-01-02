import Point from "@mapbox/point-geometry";
import { SOCKET_SIZE } from "./constants";

export type RectCoords = [number, number, number, number];

export const Directions = {
    UP: new Point(0, -1),
    DOWN: new Point(0, +1),
    LEFT: new Point(-1, 0),
    RIGHT: new Point(+1, 0),
};

export type Direction = Point;

function isDirection(point: Point) {
    return (
        point.equals(Directions.UP) ||
        point.equals(Directions.DOWN) ||
        point.equals(Directions.LEFT) ||
        point.equals(Directions.RIGHT)
    );
}

/**
 * Get a list of points representing a polyline. The first element will be the
 * starting point of the polyline.
 *
 * The polyline will have either 1, 2 or 3 lines. If the starting and ending
 * points are the same, fuck you.
 */
export function getRectLinePoints(
    start: Point,
    startBlock: Direction,
    end: Point,
    endBlock: Direction,
) {
    if (isWeirdRectLineSituation(start, startBlock, end, endBlock)) {
        throw new Error("FUCKING SHIT");
    }

    const d = getDirectionsTo(start, end);
    if (d.length === 0) {
        throw new Error("Fuck you, I'm not handling this. Fuck you.");
    } else if (d.length === 1) {
        return [start, end];
    } else if (d.length === 2) {
        // If this order of directions is invalid
        if (d[0].equals(startBlock) || d[1].equals(endBlock.mult(-1))) {
            d.reverse();
        }

        // It looks cleaner if the line starting at `start` goes in the opposite
        // direction of `startBlock`.
        if (
            d[1].equals(startBlock.mult(-1)) &&
            !d[0].equals(endBlock.mult(-1))
        ) {
            d.reverse();
        }

        const component = d[0].multByPoint(d[0]).multByPoint(end.sub(start));
        const midpoint = start.add(component);

        return [start, midpoint, end];
    }

    // Unreachable
    return [];
}

export function isWeirdRectLineSituation(
    start: Point,
    startBlock: Direction,
    end: Point,
    endBlock: Direction,
) {
    // start going up to end
    if (
        startBlock.equals(Directions.UP) &&
        endBlock.equals(Directions.DOWN) &&
        end.y < start.y
    )
        return true;
    // start going down to end
    if (
        startBlock.equals(Directions.DOWN) &&
        endBlock.equals(Directions.UP) &&
        end.y > start.y
    )
        return true;
    // start going left to end
    if (
        startBlock.equals(Directions.LEFT) &&
        endBlock.equals(Directions.RIGHT) &&
        end.x < start.x
    )
        return true;
    // start going right to end
    if (
        startBlock.equals(Directions.RIGHT) &&
        endBlock.equals(Directions.LEFT) &&
        end.x > start.x
    )
        return true;

    return false;
}

export function getDirectionsTo(start: Point, end: Point): Direction[] {
    const directions = [];

    // Horizontal directions
    if (start.x > end.x) {
        directions.push(Directions.LEFT);
    } else if (start.x < end.x) {
        directions.push(Directions.RIGHT);
    }

    // Vertical directions
    if (start.y > end.y) {
        directions.push(Directions.UP);
    } else if (start.y < end.y) {
        directions.push(Directions.DOWN);
    }

    return directions;
}

export function snap(value: number, mod: number) {
    return value - (value % mod);
}

export function modPoint(point: Point, mod: number): Point {
    return new Point(snap(point.x, mod), snap(point.y, mod));
}

export function getButton(event: MouseEvent): "LMB" | "MMB" | "RMB" | null {
    if (event.button === 0) return "LMB";
    if (event.button === 1) return "MMB";
    if (event.button === 2) return "RMB";
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

export function withMaxDecimal(value: number, precision: number) {
    const original = String(value);
    const withFixed = value.toPrecision(precision);
    if (original.length < withFixed.length) return original;
    else return withFixed;
}

export function fillCircle(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    radius: number,
) {
    ctx.beginPath();
    ctx.ellipse(cx, cy, radius, radius, 0, 0, 2 * Math.PI, false);
    ctx.fill();
    ctx.closePath();
}

export function drawConnectionLine(
    ctx: CanvasRenderingContext2D,
    sOutCoords: Point,
    sOutDirection: Direction,
    sInCoords: Point,
    sInDirection: Direction,
) {
    // Line style
    ctx.strokeStyle = "goldenrod";
    ctx.lineWidth = 1;

    const EXTENSION_LENGTH = SOCKET_SIZE;

    const delta = sInCoords.sub(sOutCoords);
    if (delta.mag() < 2 * EXTENSION_LENGTH) {
        // Directo shooto da!
        ctx.beginPath();
        ctx.moveTo(sOutCoords.x, sOutCoords.y);
        ctx.lineTo(sInCoords.x, sInCoords.y);
        ctx.stroke();
        ctx.closePath();

        return;
    }

    const sOutExtension = sOutCoords.add(sOutDirection.mult(EXTENSION_LENGTH));
    const sInExtension = sInCoords.add(sInDirection.mult(EXTENSION_LENGTH));

    const points = getRectLinePoints(
        sOutExtension,
        sOutDirection.mult(-1),
        sInExtension,
        sInDirection.mult(-1),
    );

    ctx.beginPath();
    // Socket out coords
    ctx.moveTo(sOutCoords.x, sOutCoords.y);
    // Lines to all intermediate points (socket out coords -> extension -> extension)
    points.forEach((point) => {
        ctx.lineTo(point.x, point.y);
    });
    ctx.lineTo(sInCoords.x, sInCoords.y);
    ctx.stroke();
    ctx.closePath();
}

export class Rectangle {
    x1: number;
    y1: number;
    x2: number;
    y2: number;

    private constructor(x1: number, y1: number, x2: number, y2: number) {
        this.x1 = x1;
        this.y1 = y1;
        this.x2 = x2;
        this.y2 = y2;
    }

    containsPoint(point: Point): boolean {
        return (
            this.x1 <= point.x &&
            point.x <= this.x2 &&
            this.y1 <= point.y &&
            point.y <= this.y2
        );
    }

    intersects(other: Rectangle): boolean {
        // https://stackoverflow.com/a/306332/8089674
        // modified because y increases downwards
        return (
            this.x1 < other.x2 &&
            this.x2 > other.x1 &&
            this.y1 < other.y2 &&
            this.y2 > other.y1
        );
    }

    xywh(): [number, number, number, number] {
        return [this.x1, this.y1, this.x2 - this.x1, this.y2 - this.y1];
    }

    getCenter(): Point {
        const mx = (this.x1 + this.x2) / 2;
        const my = (this.y1 + this.y2) / 2;
        return new Point(mx, my);
    }

    private selfUnion(rect: Rectangle): void {
        this.x1 = Math.min(this.x1, rect.x1);
        this.y1 = Math.min(this.y1, rect.y1);
        this.x2 = Math.max(this.x2, rect.x2);
        this.y2 = Math.max(this.y2, rect.y2);
    }

    // --- Static Methods

    static fromTwoPoints(p1: Point, p2: Point): Rectangle {
        return new Rectangle(
            Math.min(p1.x, p2.x),
            Math.min(p1.y, p2.y),
            Math.max(p1.x, p2.x),
            Math.max(p1.y, p2.y),
        );
    }

    static fromCenter(center: Point, width: number, height: number): Rectangle {
        return new Rectangle(
            center.x - width / 2,
            center.y - height / 2,
            center.x + width / 2,
            center.y + height / 2,
        );
    }

    static fromTopLeft(
        topLeft: Point,
        width: number,
        height: number,
    ): Rectangle {
        return new Rectangle(
            topLeft.x,
            topLeft.y,
            topLeft.x + width,
            topLeft.y + height,
        );
    }

    static union(rects: Rectangle[]): Rectangle {
        if (rects.length === 0) {
            return new Rectangle(0, 0, 0, 0);
        }

        const r = rects[0];
        for (let i = 1; i < rects.length; ++i) {
            r.selfUnion(rects[i]);
        }

        return r;
    }
}

export function getMsAndFPS(ms: number): string {
    const fps = ms === 0 ? Number.POSITIVE_INFINITY : Math.ceil(1000 / ms);
    return `${ms.toFixed(2)}ms (${fps} FPS)`;
}
