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
            Math.max(p1.y, p2.y)
        );
    }

    static fromCenter(center: Point, width: number, height: number): Rectangle {
        return new Rectangle(
            center.x - width / 2,
            center.y - height / 2,
            center.x + width / 2,
            center.y + height / 2
        );
    }

    static fromTopLeft(
        topLeft: Point,
        width: number,
        height: number
    ): Rectangle {
        return new Rectangle(
            topLeft.x,
            topLeft.y,
            topLeft.x + width,
            topLeft.y + height
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
