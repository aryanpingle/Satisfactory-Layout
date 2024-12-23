import Point from "@mapbox/point-geometry";

export type StateName =
    | "idle"
    | "selecting"
    | "selection"
    | "moving"
    | "panning"
    | "buffer";

interface BaseState {
    name: StateName;
    enter(): void;
    exit(): void;
}

export abstract class StateManager {
    abstract currentState: BaseState;

    transitionState(nextState: BaseState) {
        this.currentState.exit();
        nextState.enter();
        this.currentState = nextState;
    }
}

// State implementations

export class IdleState implements BaseState {
    name: StateName = "idle";

    constructor() {}

    enter(): void {}
    exit(): void {}
}

// --- Selecting State

/**
 * When the user is dragging their mouse with LMB to select one or more items.
 */
export class SelectingState implements BaseState {
    name: StateName = "selecting";

    startCoords: Point;
    endCoords: Point;

    constructor(startCoords: Point) {
        this.startCoords = startCoords;
        this.endCoords = startCoords;
    }

    enter(): void {}
    exit(): void {}

    /**
     * Get the [x, y, width, height] representation of the start and end coords.
     */
    asRectCoords(): [number, number, number, number] {
        return [
            this.startCoords.x,
            this.startCoords.y,
            this.endCoords.x - this.startCoords.x,
            this.endCoords.y - this.startCoords.y,
        ];
    }
}

// --- Selection State

export interface SelectionStateData {
    selection: Set<number>;
}

/**
 * When the user is dragging their mouse with LMB to select one or more items.
 */
export class SelectionState implements BaseState {
    name: StateName = "selection";

    data: SelectionStateData;

    constructor(data: SelectionStateData) {
        this.data = data;
    }

    enter(): void {}
    exit(): void {}
}
